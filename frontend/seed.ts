import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const facility = await prisma.facility.upsert({
    where: { apiKey: 'default-dev-key' },
    update: {},
    create: {
      name: 'Feni Hotel Default Facility',
      apiKey: 'default-dev-key',
    },
  });

  console.log('Seeded facility:', facility);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
