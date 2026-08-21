import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-facility-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
import { redis } from '@/lib/redis';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    const redisKey = `checkin:${sessionId}`;
    const dataStr = await redis.get(redisKey);

    if (!dataStr) {
      // Fallback to Postgres
      const dbSession = await prisma.checkinSession.findUnique({
        where: { sessionId }
      });
      
      if (!dbSession) {
        return NextResponse.json({ error: 'Session not found or expired' }, { status: 404, headers: corsHeaders });
      }

      const data = JSON.parse(dbSession.payload);
      return NextResponse.json(data, { status: 200, headers: corsHeaders });
    }

    const data = JSON.parse(dataStr);
    return NextResponse.json(data, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    const body = await req.json();
    const redisKey = `checkin:${sessionId}`;
    
    const existingDataStr = await redis.get(redisKey);
    if (!existingDataStr) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404, headers: corsHeaders });
    }

    const existingData = JSON.parse(existingDataStr);
    if (existingData.status === 'submitted') {
      return NextResponse.json({ error: 'Session already submitted' }, { status: 400, headers: corsHeaders });
    }

    // Merge data, keeping TTL (by default set resets TTL, so we need to get remaining TTL)
    const ttl = await redis.ttl(redisKey);
    const updatedData = { ...existingData, ...body, status: 'submitted', submittedAt: new Date().toISOString() };

    await redis.set(redisKey, JSON.stringify(updatedData), 'EX', ttl > 0 ? ttl : 900);

    // Durably store in Postgres
    await prisma.checkinSession.upsert({
      where: { sessionId },
      update: {
        payload: JSON.stringify(updatedData),
        status: 'submitted',
        submittedAt: new Date(),
      },
      create: {
        sessionId,
        facilityId: existingData.facilityId,
        status: 'submitted',
        payload: JSON.stringify(updatedData),
        submittedAt: new Date(),
      }
    });

    return NextResponse.json({ message: 'Session updated successfully' }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    const apiKey = req.headers.get('x-facility-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-facility-api-key header' }, { status: 401, headers: corsHeaders });
    }

    const facility = await prisma.facility.findUnique({
      where: { apiKey },
    });

    if (!facility) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403, headers: corsHeaders });
    }

    const redisKey = `checkin:${sessionId}`;
    const dataStr = await redis.get(redisKey);

    // Verify ownership in DB if not found in Redis, though DELETE may just delete blindly if ownership is verified
    if (dataStr) {
      const data = JSON.parse(dataStr);
      if (data.facilityId !== facility.id) {
         return NextResponse.json({ error: 'Forbidden: Session belongs to another facility' }, { status: 403, headers: corsHeaders });
      }
    } else {
      const dbSession = await prisma.checkinSession.findUnique({
        where: { sessionId }
      });
      if (dbSession && dbSession.facilityId !== facility.id) {
         return NextResponse.json({ error: 'Forbidden: Session belongs to another facility' }, { status: 403, headers: corsHeaders });
      }
    }

    // Delete from both Redis and Postgres
    await prisma.checkinSession.deleteMany({
       where: { sessionId, facilityId: facility.id }
    });
    await redis.del(redisKey);
    
    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
