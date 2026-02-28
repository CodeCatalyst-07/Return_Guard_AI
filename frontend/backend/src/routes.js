const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { processCSVStream } = require('./services/ingestion');
const { calculateRisk, computeUserStats } = require('./services/scoring');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// --- Progress Tracking Store ---
const uploads = {};

/**
 * Progress Endpoint
 */
router.get('/progress/:uploadId', (req, res) => {
    const session = uploads[req.params.uploadId];
    if (!session) return res.status(404).json({ error: "Upload session not found" });
    res.json(session);
});

/**
 * Main CSV Upload & Analysis Route
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    const uploadId = Math.random().toString(36).substring(7);
    uploads[uploadId] = { progress: 0, status: 'processing', result: null };

    try {
        if (!req.file) {
            delete uploads[uploadId];
            return res.status(400).json({ error: 'No file provided' });
        }

        // Start background processing
        (async () => {
            try {
                const { results } = await processCSVStream(req.file.buffer, () => { });
                const total = results.length;

                // 1. Pre-calculate Product Return Patterns (Rule 3)
                const productStats = {};
                results.forEach(row => {
                    if (row.return_date) {
                        const pid = row.item_id || row.product_id;
                        if (pid) productStats[pid] = (productStats[pid] || 0) + 1;
                    }
                });

                // 2. Group by user for history (Rule 2)
                const userGroups = {};
                results.forEach(row => {
                    const uid = String(row.user_id);
                    if (!userGroups[uid]) userGroups[uid] = [];
                    userGroups[uid].push(row);
                });

                const scoringResults = [];
                let processed = 0;
                let threats_detected = 0;
                let high_count = 0, med_count = 0, low_count = 0;
                let scoreSum = 0;

                for (const userId in userGroups) {
                    const userTx = userGroups[userId].sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));

                    for (let i = 0; i < userTx.length; i++) {
                        const tx = userTx[i];
                        const stats = computeUserStats(userTx, i);
                        const { score, level } = calculateRisk(tx, stats, productStats);

                        // Classification counters
                        if (level === "High") {
                            high_count++;
                            threats_detected++;
                        } else if (level === "Medium") {
                            med_count++;
                        } else {
                            low_count++;
                        }
                        scoreSum += score;

                        // Save to Database (Prisma)
                        const scoreData = {
                            user_id: String(userId),
                            order_id: String(tx.order_id),
                            score,
                            level,
                            status: "Pending",
                            explanation: `Rule-based Analysis: ${level} risk confirmed.`
                        };

                        const existing = await prisma.riskScore.findFirst({ where: { order_id: String(tx.order_id) } });
                        if (existing) {
                            await prisma.riskScore.update({ where: { id: existing.id }, data: scoreData });
                        } else {
                            await prisma.riskScore.create({ data: scoreData });
                        }

                        // Also update transaction data
                        const txData = {
                            user_id: String(tx.user_id),
                            purchase_date: new Date(tx.purchase_date),
                            return_date: tx.return_date ? new Date(tx.return_date) : null,
                            item_price: Number(tx.item_price) || 0,
                            item_id: String(tx.item_id || tx.product_id || "UNKNOWN")
                        };
                        const existingTx = await prisma.transaction.findUnique({ where: { order_id: String(tx.order_id) } });
                        if (!existingTx) {
                            await prisma.transaction.create({ data: { order_id: String(tx.order_id), ...txData } });
                        }

                        scoringResults.push(scoreData);
                        processed++;
                        uploads[uploadId].progress = Math.round((processed / total) * 100);
                        uploads[uploadId].processed = processed;
                        uploads[uploadId].total = total;
                    }
                }

                uploads[uploadId].status = 'completed';
                uploads[uploadId].result = {
                    total_records: total,
                    threats_detected,
                    high_risk_count: high_count,
                    medium_risk_count: med_count,
                    low_risk_count: low_count,
                    average_risk_score: scoreSum / Math.max(1, total),
                    flaggedTransactions: scoringResults.filter(s => s.score >= 60)
                };

            } catch (err) {
                console.error("Async Processing Error:", err);
                uploads[uploadId].status = 'error';
                uploads[uploadId].error = err.message;
            }
        })();

        res.json({ success: true, uploadId });

    } catch (err) {
        console.error("Upload Route Error:", err);
        res.status(500).json({ error: "Upload failed" });
    }
});

// Helper routes for dashboard stats
router.get('/fraud/alerts', async (req, res) => {
    const alerts = await prisma.riskScore.findMany({ orderBy: { score: 'desc' }, take: 50 });
    res.json(alerts);
});

router.get('/transactions', async (req, res) => {
    const transactions = await prisma.transaction.findMany({ orderBy: { purchase_date: 'desc' }, take: 100 });
    res.json(transactions);
});

router.get('/risk/patterns', async (req, res) => {
    const scores = await prisma.riskScore.findMany({ where: { level: { in: ['High', 'Medium'] } } });
    const patterns = {};
    scores.forEach(s => {
        const key = "Behavioral Anomaly"; // Simplified for this fix
        patterns[key] = (patterns[key] || 0) + 1;
    });
    res.json(Object.keys(patterns).map(k => ({ pattern: k, count: patterns[k], threat_level: patterns[k] > 10 ? "High" : "Medium" })));
});

module.exports = router;
