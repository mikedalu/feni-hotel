import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since this is a single-tenant cloud instance, we just get the first facility
    const facility = await prisma.facility.findFirst();
    
    return NextResponse.json({ facility });
  } catch (error) {
    console.error('Error fetching facility:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, name } = body; // action can be 'regenerateKey' or 'updateName'

    let facility = await prisma.facility.findFirst();

    if (!facility) {
      // Create it if it doesn't exist
      facility = await prisma.facility.create({
        data: {
          name: name || 'Feni Hotel (Primary)',
          apiKey: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        }
      });
      return NextResponse.json({ facility });
    }

    if (action === 'regenerateKey') {
      facility = await prisma.facility.update({
        where: { id: facility.id },
        data: {
          apiKey: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        }
      });
    } else if (action === 'updateName' && name) {
      facility = await prisma.facility.update({
        where: { id: facility.id },
        data: { name }
      });
    }

    return NextResponse.json({ facility });
  } catch (error) {
    console.error('Error updating facility:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
