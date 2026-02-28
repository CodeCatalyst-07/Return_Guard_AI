const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { processCSVUpload } = require('./services/ingestion');
const { computeUserFeatures } = require('./services/features');
const { calculateRiskScore } = require('./services/scoring');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transactions/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ detail: 'No file uploaded' });
        }

        // Process the CSV
        const { count, df } = await processCSVUpload(prisma, req.file.buffer);

        // Recompute features and scores
        const uniqueUsers = [...new Set(df.map(row => String(row.user_id)))];
        for (const userId of uniqueUsers) {
            // grab the latest orderId for this user if needed
            const userRows = df.filter(row => String(row.user_id) === userId);
            const latestOrderId = String(userRows[userRows.length - 1].order_id);

            await computeUserFeatures(prisma, userId);
            await calculateRiskScore(prisma, userId, latestOrderId);
        }

        const highRiskCount = await prisma.riskScore.count({
            where: { level: { in: ['Extreme', 'Moderate'] } }
        });

        if (highRiskCount === 0) {
            throw new Error("Fraud logic still not activating — investigate feature calculation.");
        }

        res.json({ message: `Successfully uploaded ${count} transactions and updated risk scores` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: `Internal processing error: ${error.message}` });
    }
});

router.post('/transactions/:order_id/approve', async (req, res) => {
    try {
        const { order_id } = req.params;
        let score = await prisma.riskScore.findFirst({ where: { order_id } });

        if (!score && !isNaN(parseInt(order_id))) {
            score = await prisma.riskScore.findFirst({ where: { id: parseInt(order_id) } });
        }

        if (score) {
            await prisma.riskScore.update({
                where: { id: score.id },
                data: {
                    level: "Normal",
                    score: 0.0,
                    status: "Handled",
                    explanation: "APPROVED: Manually reviewed and cleared."
                }
            });
            res.json({ message: `Transaction ${order_id} approved` });
        } else {
            res.status(404).json({ detail: "Risk score record not found" });
        }
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

router.get('/users/:user_id/risk', async (req, res) => {
    try {
        const { user_id } = req.params;
        await computeUserFeatures(prisma, user_id);
        const risk = await calculateRiskScore(prisma, user_id);
        if (!risk) {
            return res.status(404).json({ detail: "User not found or no data available" });
        }
        res.json(risk);
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

router.post('/users/:user_id/blacklist', async (req, res) => {
    try {
        const { user_id } = req.params;
        const scores = await prisma.riskScore.findMany({ where: { user_id } });

        for (const s of scores) {
            await prisma.riskScore.update({
                where: { id: s.id },
                data: {
                    level: "Extreme",
                    status: "Handled",
                    explanation: "USER BLACKLISTED: Managed decision. " + (s.explanation || "")
                }
            });
        }
        res.json({ message: `User ${user_id} blacklisted across all transactions` });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

router.get('/fraud/alerts', async (req, res) => {
    try {
        const alerts = await prisma.riskScore.findMany({
            where: { status: "Pending" },
            orderBy: { score: 'desc' },
            take: 20
        });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

router.get('/metrics/summary', async (req, res) => {
    try {
        const totalTransactions = await prisma.transaction.count();
        const totalReturns = await prisma.transaction.count({ where: { return_date: { not: null } } });

        const scores = await prisma.riskScore.aggregate({
            _avg: { score: true }
        });
        const avgRiskScore = scores._avg.score || 0;

        const highRiskCount = await prisma.riskScore.count({
            where: { level: "Extreme", status: "Pending" }
        });

        res.json({
            total_transactions: totalTransactions,
            return_rate: totalTransactions > 0 ? (totalReturns / totalTransactions) : 0,
            average_risk_score: avgRiskScore,
            high_risk_count: highRiskCount
        });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { purchase_date: 'desc' },
            take: 100
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

router.get('/risk/patterns', async (req, res) => {
    try {
        const scores = await prisma.riskScore.findMany({
            where: { level: { in: ['Extreme', 'Moderate'] } }
        });

        const patterns = {};
        for (const s of scores) {
            if (s.explanation) {
                const parts = s.explanation.split(', ');
                for (const part of parts) {
                    patterns[part] = (patterns[part] || 0) + 1;
                }
            }
        }

        const results = Object.keys(patterns).map(k => ({
            pattern: k,
            count: patterns[k],
            threat_level: patterns[k] > 5 ? "Extreme" : "Moderate"
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

module.exports = router;
