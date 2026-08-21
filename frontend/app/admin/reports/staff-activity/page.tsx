import React from 'react';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { UserCircle, Trophy, DollarSign, Calendar } from 'lucide-react';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export default async function StaffActivityPage() {
  // Fetch bookings and journal lines to calculate staff activity
  const bookings = await prisma.booking.findMany();
  
  const salesLines = await prisma.journalLine.findMany({
    where: {
      accountName: {
        startsWith: 'Sales Revenue',
      },
    },
    include: {
      journalEntry: true,
    },
  });

  const staffStats: Record<string, { name: string; bookings: number; revenue: number }> = {};

  bookings.forEach(b => {
    const name = b.processedByName || 'System / Unassigned';
    if (!staffStats[name]) staffStats[name] = { name, bookings: 0, revenue: 0 };
    staffStats[name].bookings += 1;
  });

  salesLines.forEach(line => {
    const name = line.journalEntry.processedByName || 'System / Unassigned';
    if (!staffStats[name]) staffStats[name] = { name, bookings: 0, revenue: 0 };
    staffStats[name].revenue += Number(line.creditAmount);
  });

  const sortedStaff = Object.values(staffStats).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Activity</h1>
        <p className="text-gray-500 mt-1">Performance tracking and accountability by staff member</p>
      </div>

      {sortedStaff.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 text-center text-gray-500 shadow-sm">
          No staff activity recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStaff.map((staff, index) => (
            <div key={staff.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-bl-lg flex items-center gap-1 text-xs font-bold">
                  <Trophy className="w-3 h-3" /> Top Performer
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{staff.name}</h3>
                  <p className="text-sm text-gray-500">Staff Member</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ₦{staff.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Bookings</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{staff.bookings}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
