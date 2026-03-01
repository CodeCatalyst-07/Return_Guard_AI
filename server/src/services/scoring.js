/**
 * Computes behavioral statistics for a user based on history.
 */
const computeUserStats = (userTx, currentIndex) => {
    const currentTx = userTx[currentIndex];
    const previousTx = userTx.slice(0, currentIndex);
    const currentTime = new Date(currentTx.purchase_date).getTime();

    // Refunds in last 7 days (Rule: >3 returns in 7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const refundsLast7days = previousTx.filter(t => {
        const refundTime = t.return_date ? new Date(t.return_date).getTime() : 0;
        return refundTime > 0 && (currentTime - refundTime) <= sevenDaysMs;
    }).length;

    return {
        refunds_last_7days: refundsLast7days
    };
};

/**
 * Calculates a deterministic risk score based on specific fraud rules.
 */
const calculateRisk = (tx, userStats, productStats = {}) => {
    let score = 0;

    // RULE 1: Return within 1 day (+40)
    if (tx.purchase_date && tx.return_date) {
        const diff = (new Date(tx.return_date) - new Date(tx.purchase_date)) / (1000 * 3600 * 24);
        if (diff <= 1 && diff >= 0) score += 40;
    }

    // RULE 2: > 3 returns in 7 days (+30)
    if (userStats.refunds_last_7days > 3) score += 30;

    // RULE 3: Product returned by multiple users (+20)
    const productId = tx.item_id || tx.product_id;
    if (productId && productStats[productId] && productStats[productId] > 1) {
        score += 20;
    }

    // RULE 4: Reason keywords (+15)
    const keywords = ["damaged", "not received", "wrong item"];
    const reason = String(tx.return_reason || "").toLowerCase();
    if (keywords.some(k => reason.includes(k))) score += 15;

    // RULE 5: Missing Required Fields (+10)
    const required = ['user_id', 'order_id', 'item_id', 'purchase_date'];
    if (required.some(f => !tx[f] || tx[f] === "UNKNOWN")) score += 10;

    // FINAL CLAMP
    score = Math.min(score, 100);

    // CLASSIFICATION
    let level = "Low";
    if (score >= 60) level = "High";
    else if (score >= 30) level = "Medium";

    return { score, level };
};

module.exports = { calculateRisk, computeUserStats };
