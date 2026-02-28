const csv = require('csv-parser');
const stream = require('stream');

async function processCSVUpload(prisma, fileBuffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        bufferStream
            .pipe(csv({ mapHeaders: ({ header }) => header.toLowerCase().trim().replace(/ /g, '_') }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Flexibly handle new vs legacy CSV templates
                    const requiredCore = ['user_id', 'order_id', 'purchase_date'];
                    if (results.length > 0) {
                        const firstRow = results[0];
                        const missingCore = requiredCore.filter(c => !(c in firstRow));

                        const hasItemId = 'item_id' in firstRow || 'product_id' in firstRow;
                        const hasItemPrice = 'item_price' in firstRow || 'order_value' in firstRow;

                        if (missingCore.length > 0 || !hasItemId || !hasItemPrice) {
                            return reject(new Error(`Missing critical columns. Ensure headers resemble user_id, order_id, item_id, purchase_date, item_price`));
                        }
                    }

                    let count = 0;
                    for (const row of results) {
                        const order_id = String(row.order_id);

                        // Handle legacy vs new templates
                        const itemId = row.item_id || row.product_id || "UNKNOWN";
                        const itemPrice = parseFloat(row.item_price) || parseFloat(row.order_value) || 0.0;

                        const existing = await prisma.transaction.findUnique({ where: { order_id } });

                        const data = {
                            user_id: String(row.user_id),
                            item_id: String(itemId),
                            purchase_date: new Date(row.purchase_date),
                            return_date: row.return_date ? new Date(row.return_date) : null,
                            return_reason: row.return_reason ? String(row.return_reason) : null,
                            item_price: itemPrice,
                            refund_amount: parseFloat(row.refund_amount || 0.0),
                            payment_method: row.payment_method ? String(row.payment_method) : "N/A",
                            receipt_id: row.receipt_id ? String(row.receipt_id) : "N/A",
                        };

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
