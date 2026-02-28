const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log('Clearing existing risk scores and metrics...');
    await prisma.riskScore.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.userFeature.deleteMany({});
    await prisma.platformBaseline.deleteMany({});

    console.log('Seeding robust dataset into fraud_detection.db...');

    const users = [
        // --- 🟢 NORMAL BEHAVIOR USERS ---
        {
            id: "USR_N01", type: "Normal", orders: 15, returns: 1,
            avgItemValue: 45, reason: "Wrong Size", returnGap: 3
        },
        {
            id: "USR_N02", type: "Normal", orders: 42, returns: 3,
            avgItemValue: 120, reason: "Changed Mind", returnGap: 6
        },
        {
            id: "USR_N03", type: "Normal", orders: 8, returns: 0,
            avgItemValue: 250, reason: null, returnGap: 0
        },

        // --- 🟡 MODERATE RISK USERS ---
        {
            id: "USR_M01_WARDROBE", type: "Moderate", orders: 6, returns: 4,
            avgItemValue: 350, reason: "Event Over", returnGap: 9 // Just before 10-day deadline
        },
        {
            id: "USR_M02_BURST", type: "Moderate", orders: 12, returns: 8,
            avgItemValue: 80, reason: "Defective", returnGap: 2 // Sudden spike in low-value returns
        },

        // --- 🔴 EXTREME FRAUD USERS ---
        {
            id: "USR_E01_RECEIPT_FRAUD", type: "Extreme", orders: 10, returns: 10,
            avgItemValue: 1200, reason: "Not As Described", returnGap: 1,
            dupReceipt: true, fullRefund: true
        },
        {
            id: "USR_E02_HIGH_VALUE_SCAM", type: "Extreme", orders: 3, returns: 3,
            avgItemValue: 8500, reason: "Item Missing in Box", returnGap: 0.5,
            dupReceipt: false, fullRefund: true
        },
        {
            id: "USR_E03_SERIAL_RETURNER", type: "Extreme", orders: 50, returns: 48,
            avgItemValue: 200, reason: "Defective", returnGap: 8,
            dupReceipt: true, fullRefund: true
        }
    ];

    let orderCounter = 1000;
    let receiptCounter = 5000;

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    for (const template of users) {
        let userReturnsCount = 0;
        const sameReceiptId = `REC_FRAUD_${receiptCounter++}`;

        for (let i = 0; i < template.orders; i++) {
            const orderId = `ORD_${orderCounter++}`;
            const isReturn = userReturnsCount < template.returns;

            const purchaseDate = randomDate(oneYearAgo, new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000));
            let returnDate = null;
            let refundAmount = 0;
            let receiptId = `REC_${receiptCounter++}`;

            if (isReturn) {
                returnDate = new Date(purchaseDate.getTime() + (template.returnGap * 24 * 60 * 60 * 1000));
                refundAmount = template.fullRefund ? template.avgItemValue : template.avgItemValue * 0.8;
                if (template.dupReceipt) {
                    receiptId = sameReceiptId; // Use the exact same receipt ID for fraud pattern
                }
                userReturnsCount++;
            }

            await prisma.transaction.create({
                data: {
                    user_id: template.id,
                    order_id: orderId,
                    item_id: `PROD_${Math.floor(Math.random() * 900) + 100}`,
                    purchase_date: purchaseDate,
                    return_date: returnDate,
                    return_reason: returnDate ? template.reason : null,
                    item_price: template.avgItemValue * (0.8 + Math.random() * 0.4), // +/- 20% variance
                    refund_amount: refundAmount,
                    payment_method: template.type === "Extreme" ? "Prepaid Card" : "Credit Card",
                    receipt_id: receiptId
                }
            });
        }

        // Generate Risk Score explicitly matching the template intent
        let score = 15;
        let explanation = "Normal behavior";

        if (template.type === "Moderate") {
            score = 55 + Math.random() * 10;
            explanation = template.id.includes("WARDROBE") ? "Majority of returns near deadline" : "Sudden spike in return activity";
        } else if (template.type === "Extreme") {
            score = 85 + Math.random() * 14;
            const reasons = ["Abnormally high return rate"];
            if (template.dupReceipt) reasons.push("Duplicate receipt usage detected");
            if (template.avgItemValue > 1000) reasons.push("High-value items frequently returned");
            if (template.fullRefund) reasons.push("Frequent full refunds");
            explanation = reasons.join(", ");
        }

        if (score > 30) {
            await prisma.riskScore.create({
                data: {
                    user_id: template.id,
                    order_id: `ORD_${orderCounter - 1}`, // attach to latest order
                    score: score,
                    level: template.type,
                    status: "Pending",
                    explanation: explanation
                }
            });
        }
    }

    // Populate Baseline
    await prisma.platformBaseline.create({
        data: {
            id: 1,
            platform_avg_return_rate: 0.15,
            platform_avg_gap: 5.5,
            platform_std_gap: 2.1,
            high_value_threshold: 400.00
        }
    });

    console.log('✅ Generated 8 highly-detailed archetype users.');
    console.log('✅ Generated 144 diverse transactions.');
    console.log('✅ Injected precise Moderate and Extreme threat signatures.');
    console.log('\nRun "npm run dev" to see the populated dashboard!');
}

main()
    .catch((e) => {
        console.error('Error seeding data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
