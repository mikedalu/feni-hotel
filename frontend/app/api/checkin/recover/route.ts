import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest) {
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

    // Fetch all submitted sessions for this facility that haven't been cleared
    const sessions = await prisma.checkinSession.findMany({
      where: {
        facilityId: facility.id,
        status: 'submitted',
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 50, // Limit to recent sessions
    });

    // Parse the payload strings back into JSON objects for the response
    const formattedSessions = sessions.map((session: any) => ({
      sessionId: session.sessionId,
      submittedAt: session.submittedAt,
      data: JSON.parse(session.payload)
    }));

    return NextResponse.json(formattedSessions, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching recoverable sessions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
