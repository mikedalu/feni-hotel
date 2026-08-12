import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-facility-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-facility-api-key header' }, { status: 401 });
    }

    // Authenticate Facility
    const facility = await prisma.facility.findUnique({
      where: { apiKey },
    });

    if (!facility) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const events = await req.json();

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Payload must be a JSON array of events' }, { status: 400 });
    }

    const processedIds: String[] = [];

    // Process events idempotently
    for (const event of events) {
      // Upsert by event.id to guarantee idempotency
      await prisma.syncEvent.upsert({
        where: { id: event.id },
        update: {
          // If it exists, update syncedAt to current time
          syncedAt: new Date(),
        },
        create: {
          id: event.id,
          facilityId: facility.id,
          eventType: event.eventType,
          payload: event.payload,
        },
      });

      // TODO: Here we will add a switch (event.eventType) to fan out the payload 
      // and construct the full cloud database replicas (Sales, Bookings, JournalEntries).
      // For now, storing it in SyncEvent is enough to ensure idempotency and acknowledge receipt.

      processedIds.push(event.id);
    }

    return NextResponse.json({ message: 'Events synced successfully', processedCount: processedIds.length, facilityId: facility.id }, { status: 200 });

  } catch (error: any) {
    console.error('Error syncing events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
