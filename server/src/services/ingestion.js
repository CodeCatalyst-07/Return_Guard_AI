const csv = require('csv-parser');
const stream = require('stream');

async function processCSVUpload(prisma, fileBuffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        bufferStream
            .pipe(csv({
                mapHeaders: ({ header }) => header.toLowerCase().trim()
                    .replace(/[\s\-\.]+/g, '_') // Replace spaces, hyphens, and dots with underscores
            }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    const requiredCore = ['user_id', 'order_id', 'purchase_date'];
                    if (results.length > 0) {
                        const firstRow = results[0];
                        const missingCore = requiredCore.filter(c => !(c in firstRow));
                        if (missingCore.length > 0) {
                            return reject(new Error(`Missing critical columns: ${missingCore.join(', ')}`));
                        }
                    }

                    let count = 0;
                    for (const row of results) {
                        const order_id = String(row.order_id);

                        // 4. FIX CSV PARSING ISSUES: Numeric fields converted using Number()
                        const itemId = row.item_id || row.product_id || "UNKNOWN";
                        const itemPrice = Number(row.item_price) || Number(row.order_value) || 0.0;
                        const refundAmount = Number(row.refund_amount) || 0.0;

                        const data = {
                            user_id: String(row.user_id || "UNKNOWN"),
                            item_id: String(itemId),
                            purchase_date: row.purchase_date ? new Date(row.purchase_date) : new Date(),
                            return_date: row.return_date ? new Date(row.return_date) : null,
                            return_reason: row.return_reason ? String(row.return_reason) : null,
                            item_price: itemPrice,
                            refund_amount: refundAmount,
                            payment_method: String(row.payment_method || "N/A"),
                            receipt_id: String(row.receipt_id || "N/A"),
                        };

                        const existing = await prisma.transaction.findUnique({ where: { order_id } });
                        if (!existing) {
                            await prisma.transaction.create({ data: { order_id, ...data } });
                        } else {
                            await prisma.transaction.update({ where: { order_id }, data });
                        }
                        count++;
                    }
                    resolve({ count, df: results });
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => reject(error));
    });
}

module.exports = { processCSVUpload };
