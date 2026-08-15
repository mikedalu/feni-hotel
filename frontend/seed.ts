const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const facility = await prisma.facility.create({
    data: {
      id: 'facility-123',
      name: 'Test Facility',
      apiKey: 'test-api-key'
    }
  });
  console.log('Created facility:', facility);
}

main().catch(console.error).finally(() => prisma.$disconnect());
