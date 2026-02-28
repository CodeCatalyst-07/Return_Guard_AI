const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Updating risk levels to new labels...");

    const highUpdates = await prisma.riskScore.updateMany({
        where: { level: "High" },
        data: { level: "Extreme" }
    });
    console.log(`Updated ${highUpdates.count} records from High to Extreme`);

    const mediumUpdates = await prisma.riskScore.updateMany({
        where: { level: "Medium" },
        data: { level: "Moderate" }
    });
    console.log(`Updated ${mediumUpdates.count} records from Medium to Moderate`);

    const lowUpdates = await prisma.riskScore.updateMany({
        where: { level: "Low" },
        data: { level: "Normal" }
    });
    console.log(`Updated ${lowUpdates.count} records from Low to Normal`);

    console.log("Database labels aligned.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
