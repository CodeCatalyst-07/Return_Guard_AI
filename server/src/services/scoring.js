const RETURN_WINDOW_DAYS = 10;

async function calculateRiskScore(prisma, userId, orderId = null) {
    const f = await prisma.userFeature.findUnique({ where: { user_id: userId } });
    if (!f) return null;

    // ------------------------------------------------------------
    // STEP 4 - RISK SCORE CALCULATION
    // ------------------------------------------------------------
    let risk_score =
        25 * f.f_return
        + 20 * f.f_wardrobe
        + 15 * f.f_timing
        + 15 * f.f_receipt
        + 10 * f.f_refund
        + 10 * f.f_value
        + 5 * f.f_burst;

    if (f.total_returns >= 2 && f.return_rate >= 0.5) {
        risk_score += 20;
    }

    if (f.duplicate_receipts >= 1) {
        risk_score += 25;
    }

    if (f.full_refund_ratio >= 0.8 && f.total_returns >= 2) {
        risk_score += 20;
    }

    if (f.high_value_returns >= 2) {
        risk_score += 20;
    }

    risk_score = Math.max(0, Math.min(100, risk_score));

    // ------------------------------------------------------------
    // STEP 5 - CONVERTED OVERRIDE RULES (No hardcoded levels)
    // ------------------------------------------------------------
    if (f.return_rate >= 0.7 && f.total_orders >= 5) {
        risk_score += 30;
    }
    if (f.f_wardrobe >= 0.8 && f.user_avg_gap >= 0.8 * RETURN_WINDOW_DAYS) {
        risk_score += 30;
    }
    if (f.duplicate_receipts >= 3) {
        risk_score += 30;
    }
    if (f.full_refund_ratio >= 0.9 && f.total_returns >= 4) {
        risk_score += 30;
    }

    const highFeatureCount = [
        f.f_return, f.f_wardrobe, f.f_timing, f.f_receipt, f.f_refund, f.f_value, f.f_burst
    ].filter(val => val > 0.75).length;
    if (highFeatureCount >= 3) {
        risk_score += 30;
    }

    risk_score = Math.max(0, Math.min(100, risk_score));

    // ------------------------------------------------------------
    // STEP 6 - RISK LEVEL CLASSIFICATION (Score mapping)
    // ------------------------------------------------------------
    let risk_level = "Normal";
    if (risk_score > 70) {
        risk_level = "Extreme";
    } else if (risk_score > 40) {
        risk_level = "Moderate";
    }

    // ------------------------------------------------------------
    // STEP 7 - EXPLAINABILITY OUTPUT
    // ------------------------------------------------------------
    const reasons = [];
    if (f.f_return > 0.6) reasons.push("Abnormally high return rate");
    if (f.f_wardrobe > 0.6) reasons.push("Majority of returns near deadline");
    if (f.f_timing > 0.6) reasons.push("Unusual purchase-return timing");
    if (f.f_receipt > 0.6) reasons.push("Duplicate receipt usage detected");
    if (f.f_refund > 0.6) reasons.push("Frequent full refunds");
    if (f.f_value > 0.6) reasons.push("High-value items frequently returned");
    if (f.f_burst > 0.6) reasons.push("Sudden spike in return activity");

    const explanation = reasons.length > 0 ? reasons.join(", ") : "Normal behavior";

    const data = {
        user_id: userId,
        order_id: orderId,
        score: risk_score,
        level: risk_level,
        status: "Pending",
        explanation: explanation
    };

    console.table({
        user_id: userId,
        total_orders: f.total_orders,
        total_returns: f.total_returns,
        return_rate: f.return_rate,
        duplicate_receipts: f.duplicate_receipts,
        full_refund_ratio: f.full_refund_ratio,
        high_value_returns: f.high_value_returns,
        risk_score: risk_score,
        risk_level: risk_level
    });

    return await prisma.riskScore.create({ data });
}

module.exports = { calculateRiskScore };
