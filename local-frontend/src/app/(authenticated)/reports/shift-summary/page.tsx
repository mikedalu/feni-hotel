'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { DocumentArrowDownIcon, CalendarDaysIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

interface ShiftSummaryRow {
  guestName: string;
  guestPhone: string;
  guestOccupation: string;
  guestAddress: string;
  guestNationality: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  purposeOfVisit: string;
  stateOfOrigin: string;
  lga: string;
  nextOfKinPhone: string;
}

export default function ShiftSummaryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<ShiftSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const fetchData = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/reports/shift-summary/data?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error('Failed to load shift summary data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await apiClient(`/api/reports/shift-summary/generate?date=${selectedDate}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const result = await res.json();
      
      // Open PDF in new tab
      if (result.url) {
        window.open(result.url, '_blank');
        toast.success('PDF generated successfully');
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shift Summary</h2>
          <p className="text-sm text-gray-500 mt-1">Daily operational view (D.S.S / S.I.D REPORT)</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-xl border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            />
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGeneratingPdf ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <DocumentArrowDownIcon className="h-5 w-5" />
            )}
            Download PDF
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No check-ins found for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">S/N</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Guest Name</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nationality</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Arrival</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Departure</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Occupation</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Purpose of Visit</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">State of Origin</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">L.G.A</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Next of Kin Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{idx + 1}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 font-medium">{row.guestName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-bold">{row.roomNumber}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.guestPhone}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.guestNationality}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-emerald-600 font-medium">{row.checkInDate}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-rose-600 font-medium">{row.checkOutDate}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.guestOccupation}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.purposeOfVisit}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.stateOfOrigin}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.lga}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.guestAddress}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{row.nextOfKinPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
