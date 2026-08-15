import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
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

    const facility = await prisma.facility.findUnique({
      where: { apiKey },
    });

    if (!facility) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId in payload' }, { status: 400 });
    }

    // Initialize session in Redis with 15 minutes TTL (900 seconds)
    const redisKey = `checkin:${sessionId}`;
    const initialData = { status: 'waiting', facilityId: facility.id, createdAt: new Date().toISOString() };
    
    await redis.set(redisKey, JSON.stringify(initialData), 'EX', 900);

    return NextResponse.json({ message: 'Session started successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Error starting session:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || String(error) }, { status: 500 });
  }
}
