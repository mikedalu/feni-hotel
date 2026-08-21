const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: "postgresql://myuser:secret@localhost:39129/cloud_replica" });
const prisma = new PrismaClient({ adapter });

prisma.cloudAdminUser.findMany().then(console.log).catch(console.error).finally(() => prisma.$disconnect());
