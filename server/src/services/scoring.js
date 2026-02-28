/**
 * Computes behavioral statistics for a user based on their transaction history.
 * @param {Array} userTx - List of all transactions for a user, sorted by date.
 * @param {number} currentIndex - The index of the transaction being analyzed.
 * @returns {Object} - Computed user statistics.
 */
const computeUserStats = (userTx, currentIndex) => {
    const currentTx = userTx[currentIndex];
    const previousTx = userTx.slice(0, currentIndex);
    const currentTime = new Date(currentTx.purchase_date).getTime();

    // 1. Average Amount (Past transactions only)
    const avgAmount = previousTx.length > 0
        ? previousTx.reduce((sum, t) => sum + Number(t.item_price || 0), 0) / previousTx.length
        : Number(currentTx.item_price || 0);

    // 2. Transactions in last 1 hour
    const oneHourMs = 60 * 60 * 1000;
    const txLast1hr = previousTx.filter(t =>
        (currentTime - new Date(t.purchase_date).getTime()) <= oneHourMs
    ).length;

    // 3. Transactions in last 24 hours
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const txLast24hr = previousTx.filter(t =>
        (currentTime - new Date(t.purchase_date).getTime()) <= twentyFourHoursMs
    ).length;

    // 4. Last Country (Relative to current transaction)
    const lastCountry = previousTx.length > 0
        ? (previousTx[previousTx.length - 1].country || "UNKNOWN")
        : (currentTx.country || "UNKNOWN");

    // 5. Refunds in last 7 days
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const refundsLast7days = previousTx.filter(t => {
        const refundTime = t.return_date ? new Date(t.return_date).getTime() : 0;
        return refundTime > 0 && (currentTime - refundTime) <= sevenDaysMs && (currentTime - refundTime) >= 0;
    }).length;

    return {
        avg_amount: avgAmount,
        tx_last_1hr: txLast1hr,
        tx_last_24hr: txLast24hr,
        last_country: lastCountry,
        refunds_last_7days: refundsLast7days
    };
};

/**
 * Calculates a risk score for a single transaction based on computed stats.
 * @param {Object} tx - The transaction being analyzed.
 * @param {Object} userStats - Dynamically computed user behavioral stats.
 * @param {Array} blacklist - List of blacklisted identifiers.
 * @returns {number} - Calculated risk score (0-100).
 */
const calculateRisk = (tx, userStats, blacklist = []) => {
    let score = 0;
    const txAmount = Number(tx.item_price || 0);

    // 1. Amount Anomaly
    if (userStats.avg_amount > 0 && txAmount > 3 * userStats.avg_amount && txAmount > 50) {
        score += 30;
    } else if (txAmount > 5000) {
        score += 25;
    }

    // 2. High Frequency (1hr)
    if (userStats.tx_last_1hr > 5) {
        score += 20;
    }

    // 3. Sustained Activity (24hr)
    if (userStats.tx_last_24hr > 15) {
        score += 15;
    }

    // 4. Blacklist Check
    const userId = String(tx.user_id || "").toLowerCase();
    const receiptId = String(tx.receipt_id || "").toLowerCase();
    const isBlacklisted = userId.includes('fraud') ||
        userId.includes('bot') ||
        receiptId.includes('flag') ||
        blacklist.some(b => userId === b.toLowerCase());

    if (isBlacklisted) {
        score += 40;
    }

    // 5. Refund Abuse
    if (userStats.refunds_last_7days > 3) {
        score += 25;
    }

    // 6. Location Anomaly (Simple trigger)
    if (tx.country && userStats.last_country !== "UNKNOWN" && tx.country !== userStats.last_country) {
        score += 20;
    }

    return Math.min(score, 100);
};

/**
 * Legacy wrapper for Prisma-based lookups (keeps existing integrations working)
 */
const calculateRiskScore = async (prisma, userId, orderId = null) => {
    const transactions = await prisma.transaction.findMany({
        where: { user_id: userId },
        orderBy: { purchase_date: 'asc' }
    });

    if (!transactions || transactions.length === 0) return null;

    const targetIndex = orderId
        ? transactions.findIndex(t => t.order_id === orderId)
        : transactions.length - 1;

    if (targetIndex === -1) return null;

    const tx = transactions[targetIndex];
    const userStats = computeUserStats(transactions, targetIndex);
    const risk_score = calculateRisk(tx, userStats);

    let level = "Normal";
    if (risk_score >= 71) level = "Extreme";
    else if (risk_score >= 31) level = "Moderate";

    const data = {
        user_id: userId,
        order_id: tx.order_id,
        score: risk_score,
        level: level,
        status: "Pending",
        explanation: risk_score >= 71 ? "Dynamic Batch: High risk detected" : (risk_score >= 31 ? "Moderate risk detected" : "Analyzed")
    };

    const existingScore = await prisma.riskScore.findFirst({
        where: { order_id: tx.order_id }
    });

    if (existingScore) {
        return await prisma.riskScore.update({
            where: { id: existingScore.id },
            data
        });
    }

    return await prisma.riskScore.create({ data });
};

module.exports = { calculateRisk, computeUserStats, calculateRiskScore };
