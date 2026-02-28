-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "item_id" TEXT,
    "purchase_date" DATETIME NOT NULL,
    "return_date" DATETIME,
    "return_reason" TEXT,
    "item_price" REAL NOT NULL,
    "refund_amount" REAL NOT NULL DEFAULT 0.0,
    "payment_method" TEXT,
    "receipt_id" TEXT
);

-- CreateTable
CREATE TABLE "UserFeature" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_returns" INTEGER NOT NULL DEFAULT 0,
    "return_rate" REAL NOT NULL DEFAULT 0.0,
    "user_avg_gap" REAL NOT NULL DEFAULT 0.0,
    "duplicate_receipts" INTEGER NOT NULL DEFAULT 0,
    "full_refund_ratio" REAL NOT NULL DEFAULT 0.0,
    "high_value_returns" INTEGER NOT NULL DEFAULT 0,
    "returns_last_7_days" INTEGER NOT NULL DEFAULT 0,
    "avg_weekly_returns" REAL NOT NULL DEFAULT 0.0,
    "f_return" REAL NOT NULL DEFAULT 0.0,
    "f_wardrobe" REAL NOT NULL DEFAULT 0.0,
    "f_timing" REAL NOT NULL DEFAULT 0.0,
    "f_receipt" REAL NOT NULL DEFAULT 0.0,
    "f_refund" REAL NOT NULL DEFAULT 0.0,
    "f_value" REAL NOT NULL DEFAULT 0.0,
    "f_burst" REAL NOT NULL DEFAULT 0.0,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "score" REAL NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "explanation" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlatformBaseline" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "platform_avg_return_rate" REAL NOT NULL DEFAULT 0.0,
    "platform_avg_gap" REAL NOT NULL DEFAULT 0.0,
    "platform_std_gap" REAL NOT NULL DEFAULT 0.0,
    "high_value_threshold" REAL NOT NULL DEFAULT 0.0,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_order_id_key" ON "Transaction"("order_id");

-- CreateIndex
CREATE INDEX "Transaction_user_id_idx" ON "Transaction"("user_id");

-- CreateIndex
CREATE INDEX "Transaction_order_id_idx" ON "Transaction"("order_id");

-- CreateIndex
CREATE INDEX "UserFeature_user_id_idx" ON "UserFeature"("user_id");

-- CreateIndex
CREATE INDEX "RiskScore_user_id_idx" ON "RiskScore"("user_id");

-- CreateIndex
CREATE INDEX "RiskScore_order_id_idx" ON "RiskScore"("order_id");
