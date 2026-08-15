require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const facility = await prisma.facility.upsert({
    where: { apiKey: 'test-api-key' },
    update: {},
    create: {
      id: 'facility-123',
      name: 'Test Facility',
      apiKey: 'test-api-key'
    }
  });
  console.log('Created facility:', facility);
}

main().catch(console.error).finally(() => prisma.$disconnect());
