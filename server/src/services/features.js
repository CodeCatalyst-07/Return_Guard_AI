async function computePlatformBaselines(prisma) {
    const transactions = await prisma.transaction.findMany();

    const users = [...new Set(transactions.map(t => t.user_id))];
    const userReturnRates = [];
    for (const u of users) {
        const uTrans = transactions.filter(t => t.user_id === u);
        const uRet = uTrans.filter(t => t.return_date !== null).length;
        userReturnRates.push(uTrans.length > 0 ? uRet / uTrans.length : 0);
    }
    userReturnRates.sort((a, b) => a - b);

    let platform_avg_return_rate = 0;
    if (userReturnRates.length > 0) {
        const mid = Math.floor(userReturnRates.length / 2);
        platform_avg_return_rate = userReturnRates.length % 2 !== 0 ? userReturnRates[mid] : (userReturnRates[mid - 1] + userReturnRates[mid]) / 2;
    }

    const returns = transactions.filter(t => t.return_date !== null);
    const returnGaps = returns.map(r =>
        (r.return_date.getTime() - r.purchase_date.getTime()) / (1000 * 3600 * 24)
    ).sort((a, b) => a - b);

    let platform_avg_gap = 0;
    let platform_std_gap = 1;

    if (returnGaps.length > 0) {
        const trimCount = Math.floor(returnGaps.length * 0.1);
        const trimmedGaps = returnGaps.slice(trimCount, returnGaps.length - trimCount);
        if (trimmedGaps.length > 0) {
            platform_avg_gap = trimmedGaps.reduce((a, b) => a + b, 0) / trimmedGaps.length;

            if (trimmedGaps.length > 1) {
                const variance = trimmedGaps.reduce((a, b) => a + Math.pow(b - platform_avg_gap, 2), 0) / (trimmedGaps.length - 1);
                platform_std_gap = Math.max(1, Math.sqrt(variance));
            }
        }
    }

    let high_value_threshold = 0;
    if (transactions.length > 0) {
        const prices = transactions.map(t => t.item_price).sort((a, b) => a - b);
        const p75 = prices[Math.floor(prices.length * 0.75)];
        const median = prices[Math.floor(prices.length * 0.5)];
        high_value_threshold = Math.max(p75, 1.5 * median);
    }

    const data = {
        platform_avg_return_rate,
        platform_avg_gap,
        platform_std_gap,
        high_value_threshold,
        last_updated: new Date()
    };

    await prisma.platformBaseline.upsert({
        where: { id: 1 },
        update: data,
        create: { id: 1, ...data }
    });
}

async function computeUserFeatures(prisma, userId) {
    const transactions = await prisma.transaction.findMany({ where: { user_id: userId } });
    if (!transactions || transactions.length === 0) return null;

    let baseline = await prisma.platformBaseline.findUnique({ where: { id: 1 } });
    if (!baseline) {
        await computePlatformBaselines(prisma);
        baseline = await prisma.platformBaseline.findUnique({ where: { id: 1 } });
    }

    const total_orders = transactions.length;
    const returns = transactions.filter(t => t.return_date !== null);
    const total_returns = returns.length;

    const return_rate = total_orders > 0 ? total_returns / total_orders : 0;

    const returnGaps = returns.map(r => {
        const gap = (new Date(r.return_date) - new Date(r.purchase_date)) / (1000 * 60 * 60 * 24);
        if (Number.isNaN(gap)) console.error(`Error: return_gap_days is NaN for user ${userId}`);
        return isNaN(gap) ? 0 : gap;
    });

    const user_avg_gap = returnGaps.length > 0 ? returnGaps.reduce((a, b) => a + b, 0) / returnGaps.length : 0;

    const RETURN_WINDOW_DAYS = 10;
    const late_returns = returnGaps.filter(g => g >= 0.8 * RETURN_WINDOW_DAYS).length;

    const isFullRefund = (r) => r.refund_amount >= 0.9 * r.item_price;
    const full_refund_returns = returns.filter(isFullRefund).length;
    const full_refund_ratio = total_returns > 0 ? full_refund_returns / total_returns : 0;

    const receiptCounts = {};
    for (const t of transactions) {
        if (t.receipt_id && t.receipt_id !== "N/A" && t.receipt_id !== "") {
            receiptCounts[t.receipt_id] = (receiptCounts[t.receipt_id] || 0) + 1;
        }
    }
    const duplicate_receipts = Object.values(receiptCounts).filter(c => c > 1).length;

    const high_value_returns = returns.filter(r => r.item_price > baseline.high_value_threshold).length;

    const returnsAll = await prisma.transaction.findMany({ where: { return_date: { not: null } }, select: { return_date: true } });
    let latestReturnDate = new Date(0);
    returnsAll.forEach(t => { if (t.return_date > latestReturnDate) latestReturnDate = t.return_date; });

    const sevenDaysAgo = new Date(latestReturnDate.getTime() - 7 * 24 * 3600 * 1000);
    const returns_last_7_days = returns.filter(r => r.return_date && r.return_date >= sevenDaysAgo && r.return_date <= latestReturnDate).length;

    let active_weeks = 1;
    if (transactions.length > 0) {
        const minD = Math.min(...transactions.map(t => t.purchase_date.getTime()));
        const maxD = Math.max(...transactions.map(t => t.purchase_date.getTime()));
        active_weeks = Math.max(1, (maxD - minD) / (7 * 24 * 3600 * 1000));
    }
    const avg_weekly_returns = total_returns / active_weeks;

    let baseline_min_return_rate = baseline.platform_avg_return_rate;
    if (baseline_min_return_rate < 0.1) {
        baseline_min_return_rate = 0.15;
    }

    // F1 to F7
    let f_return = Math.min(1, return_rate / (baseline_min_return_rate || 1));
    const f_wardrobe = late_returns / Math.max(total_returns, 1);
    const timing_z = Math.abs(user_avg_gap - baseline.platform_avg_gap) / Math.max(baseline.platform_std_gap, 1);
    const f_timing = Math.min(1, timing_z / 3);
    let f_receipt = Math.min(1, duplicate_receipts / 3);
    let f_refund = full_refund_ratio;
    const f_value = high_value_returns / Math.max(total_returns, 1);
    const burst_ratio = returns_last_7_days / (avg_weekly_returns + 1);
    const f_burst = Math.min(1, burst_ratio / 3);

    if (total_returns >= 3) f_return = Math.max(f_return, 0.4);
    if (duplicate_receipts >= 2) f_receipt = Math.max(f_receipt, 0.5);
    if (full_refund_ratio >= 0.8) f_refund = Math.max(f_refund, 0.6);

    const data = {
        total_orders,
        total_returns,
        return_rate,
        user_avg_gap,
        duplicate_receipts,
        full_refund_ratio,
        high_value_returns,
        returns_last_7_days,
        avg_weekly_returns,
        f_return,
        f_wardrobe,
        f_timing,
        f_receipt,
        f_refund,
        f_value,
        f_burst,
        last_updated: new Date()
    };

    await prisma.userFeature.upsert({
        where: { user_id: userId },
        update: data,
        create: { user_id: userId, ...data }
    });
}

module.exports = { computePlatformBaselines, computeUserFeatures };
