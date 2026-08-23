import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
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

      // Fan out logic
      const payloadObj = JSON.parse(event.payload);

      if (payloadObj.booking) {
        const processedByName = payloadObj.booking.processedBy?.username || null;
        await prisma.booking.upsert({
          where: { id: payloadObj.booking.id },
          update: { 
            totalCost: payloadObj.booking.totalCost,
            processedByName 
          },
          create: {
            id: payloadObj.booking.id,
            facilityId: facility.id,
            totalCost: payloadObj.booking.totalCost,
            processedByName,
          },
        });
      }

      if (payloadObj.journalEntry) {
        const entry = payloadObj.journalEntry;
        const processedByName = entry.processedBy?.username || null;
        await prisma.journalEntry.upsert({
          where: { id: entry.id },
          update: { processedByName }, // Allow updates to processedByName in case it was missing initially
          create: {
            id: entry.id,
            facilityId: facility.id,
            entryType: entry.entryType,
            referenceId: entry.referenceId,
            processedByName,
            lines: {
              create: entry.lines.map((line: any) => ({
                id: line.id,
                accountName: line.accountName,
                debitAmount: line.debitAmount,
                creditAmount: line.creditAmount,
              })),
            },
          },
        });
      }

      if (payloadObj.updatedProducts && Array.isArray(payloadObj.updatedProducts)) {
        for (const prod of payloadObj.updatedProducts) {
          await prisma.product.upsert({
            where: { id: prod.id },
            update: {
              name: prod.name,
              type: prod.type,
              internalSku: prod.internalSku,
              manufacturerBarcode: prod.manufacturerBarcode,
              price: prod.price,
              cost: prod.unitCost,
              stockQty: prod.stockQty,
              lowStockThreshold: prod.lowStockThreshold
            },
            create: {
              id: prod.id,
              facilityId: facility.id,
              name: prod.name,
              type: prod.type,
              internalSku: prod.internalSku,
              manufacturerBarcode: prod.manufacturerBarcode,
              price: prod.price,
              cost: prod.unitCost,
              stockQty: prod.stockQty,
              lowStockThreshold: prod.lowStockThreshold
            }
          });
        }
      }

      if (payloadObj.product) {
        const prod = payloadObj.product;
        await prisma.product.upsert({
          where: { id: prod.id },
          update: {
            name: prod.name,
            type: prod.type,
            internalSku: prod.internalSku,
            manufacturerBarcode: prod.manufacturerBarcode,
            price: prod.price,
            cost: prod.unitCost,
            stockQty: prod.stockQty,
            lowStockThreshold: prod.lowStockThreshold
          },
          create: {
            id: prod.id,
            facilityId: facility.id,
            name: prod.name,
            type: prod.type,
            internalSku: prod.internalSku,
            manufacturerBarcode: prod.manufacturerBarcode,
            price: prod.price,
            cost: prod.unitCost,
            stockQty: prod.stockQty,
            lowStockThreshold: prod.lowStockThreshold
          }
        });
      }

      processedIds.push(event.id);
    }

    return NextResponse.json({ message: 'Events synced successfully', processedCount: processedIds.length, facilityId: facility.id }, { status: 200 });

  } catch (error: any) {
    console.error('Error syncing events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
