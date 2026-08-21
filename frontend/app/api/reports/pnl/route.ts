import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    // 1. Fetch total bookings occupancy proxy
    const totalBookings = await prisma.booking.count();

    // 2. Fetch all journal lines to aggregate revenue and COGS
    const lines = await prisma.journalLine.findMany({
      include: {
        journalEntry: true,
      },
      orderBy: {
        journalEntry: {
          createdAt: 'asc',
        }
      }
    });

    let totalRevenue = 0;
    let totalCOGS = 0;

    // Aggregate by Day for charts
    // Format: "YYYY-MM-DD" -> { revenue: 0, cogs: 0 }
    const dailyData: Record<string, { date: string, revenue: number, cogs: number }> = {};

    for (const line of lines) {
      const dateStr = line.journalEntry.createdAt.toISOString().split('T')[0];
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, revenue: 0, cogs: 0 };
      }

      // Sales Revenue is typically credited on a sale
      if (line.accountName.startsWith('Sales Revenue')) {
        const amt = Number(line.creditAmount);
        totalRevenue += amt;
        dailyData[dateStr].revenue += amt;
      }

      // Cost of Goods Sold is typically debited on a sale
      if (line.accountName === 'Cost of Goods Sold') {
        const amt = Number(line.debitAmount);
        totalCOGS += amt;
        dailyData[dateStr].cogs += amt;
      }
    }

    const chartData = Object.values(dailyData);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCOGS,
        grossProfit: totalRevenue - totalCOGS,
        totalBookings
      },
      chartData
    });

  } catch (error: any) {
    console.error('Error generating P&L report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
