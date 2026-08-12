import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    const redisKey = `checkin:${sessionId}`;
    const dataStr = await redis.get(redisKey);

    if (!dataStr) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }

    const data = JSON.parse(dataStr);
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    const body = await req.json();
    const redisKey = `checkin:${sessionId}`;
    
    const existingDataStr = await redis.get(redisKey);
    if (!existingDataStr) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }

    const existingData = JSON.parse(existingDataStr);
    if (existingData.status === 'submitted') {
      return NextResponse.json({ error: 'Session already submitted' }, { status: 400 });
    }

    // Merge data, keeping TTL (by default set resets TTL, so we need to get remaining TTL)
    const ttl = await redis.ttl(redisKey);
    const updatedData = { ...existingData, ...body, status: 'submitted', submittedAt: new Date().toISOString() };

    await redis.set(redisKey, JSON.stringify(updatedData), 'EX', ttl > 0 ? ttl : 900);

    return NextResponse.json({ message: 'Session updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
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

    const redisKey = `checkin:${sessionId}`;
    const dataStr = await redis.get(redisKey);

    if (dataStr) {
      const data = JSON.parse(dataStr);
      if (data.facilityId !== facility.id) {
         return NextResponse.json({ error: 'Forbidden: Session belongs to another facility' }, { status: 403 });
      }
    }

    await redis.del(redisKey);
    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
