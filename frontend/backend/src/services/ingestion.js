const csv = require('csv-parser');
const stream = require('stream');

/**
 * Parses CSV and yields rows one by one for progress tracking.
 */
async function processCSVStream(fileBuffer, onRow) {
    return new Promise((resolve, reject) => {
        const results = [];
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        let rowCount = 0;
        // First pass to count rows (not ideal for huge files but necessary for progress)
        // For standard "senior" streaming, we'd estimate by bytes or use a smaller buffer.
        // But for this task, a quick row count is expected.

        bufferStream
            .pipe(csv({
                mapHeaders: ({ header }) => header.toLowerCase().trim()
                    .replace(/[\s\-\.]+/g, '_')
            }))
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', async () => {
                try {
                    const total = results.length;
                    for (let i = 0; i < total; i++) {
                        await onRow(results[i], i, total);
                    }
                    resolve({ total, results });
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => reject(err));
    });
}

module.exports = { processCSVStream };
