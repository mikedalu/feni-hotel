import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'crypto';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
  const prisma = new PrismaClient({ adapter });

  // Generate a secure API Key
  const apiKey = 'feni_' + crypto.randomBytes(24).toString('hex');
  const facilityName = 'Feni Hotel Downtown';

  const facility = await prisma.facility.create({
    data: {
      name: facilityName,
      apiKey: apiKey,
    },
  });

  console.log('=========================================');
  console.log('✅ FACILITY CREATED SUCCESSFULLY');
  console.log('=========================================');
  console.log(`Facility Name: ${facility.name}`);
  console.log(`Facility ID:   ${facility.id}`);
  console.log(`API KEY:       ${facility.apiKey}`);
  console.log('=========================================');
  console.log('👉 Copy the API KEY above and paste it into your local backend\'s .env file:');
  console.log(`CLOUD_SYNC_API_KEY=${facility.apiKey}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
