import React from 'react';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize Prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export default async function PnLReportPage() {
  const lines = await prisma.journalLine.findMany({
    include: {
      journalEntry: true,
    },
    orderBy: {
      journalEntry: {
        createdAt: 'desc',
      },
    },
  });

  // Group by Month (YYYY-MM)
  const monthlyData: Record<string, {
    revenue: number;
    cogs: number;
    month: string;
  }> = {};

  let totalRevenueAllTime = 0;
  let totalCogsAllTime = 0;

  lines.forEach((line: any) => {
    const date = new Date(line.journalEntry.createdAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, cogs: 0, month };
    }

    if (line.accountName.startsWith('Sales Revenue')) {
      const amt = Number(line.creditAmount);
      monthlyData[month].revenue += amt;
      totalRevenueAllTime += amt;
    } else if (line.accountName === 'Cost of Goods Sold') {
      const amt = Number(line.debitAmount);
      monthlyData[month].cogs += amt;
      totalCogsAllTime += amt;
    }
  });

  const sortedMonths = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">P&L Statement</h1>
        <p className="text-gray-500 mt-1">Monthly breakdown of Revenue, COGS, and Gross Profit</p>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        {sortedMonths.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No financial data available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">COGS</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Profit</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMonths.map((m) => {
                  const grossProfit = m.revenue - m.cogs;
                  const margin = m.revenue > 0 ? (grossProfit / m.revenue) * 100 : 0;
                  
                  return (
                    <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {new Date(`${m.month}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ₦{m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        ₦{m.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        ₦{grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          margin > 20 ? 'bg-green-100 text-green-800' : margin > 0 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">All-Time Total</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    ₦{totalRevenueAllTime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    ₦{totalCogsAllTime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    ₦{(totalRevenueAllTime - totalCogsAllTime).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {totalRevenueAllTime > 0 ? ((totalRevenueAllTime - totalCogsAllTime) / totalRevenueAllTime * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
