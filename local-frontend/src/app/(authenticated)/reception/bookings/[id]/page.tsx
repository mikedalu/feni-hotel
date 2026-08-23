"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { BookingResponse } from "@/types/booking";
import { PrinterIcon, ArrowLeftIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/proxy/bookings/${id}`);
        if (!res.ok) throw new Error("Failed to load booking details");
        const data = await res.json();
        setBooking(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-center text-red-500 font-medium h-[80vh] flex items-center justify-center">
        {error || "Booking not found"}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Non-printable controls */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-indigo-600 font-medium transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Reception
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
          >
            <PrinterIcon className="w-5 h-5 mr-2" /> Print
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none border border-gray-100 print:border-none">
        
        {/* Header */}
        <div className="bg-slate-50 print:bg-white border-b border-gray-200 p-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Guest Registration Form</h1>
            <p className="text-gray-500 mt-2">Booking ID: {booking.id}</p>
            <p className="text-gray-500">Date: {new Date(booking.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 print:border print:border-indigo-800">
              {booking.status}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-12">
            
            {/* Guest Details */}
            <div className="flex-1 space-y-8">
              
              {/* Personal Info */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="block text-gray-500 font-medium">Full Name</span>
                    <span className="block text-gray-900 text-base">{booking.title ? booking.title + ' ' : ''}{booking.guestFirstName} {booking.guestLastName}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Email</span>
                    <span className="block text-gray-900 text-base">{booking.guestEmail}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Phone</span>
                    <span className="block text-gray-900 text-base">{booking.guestPhone}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Nationality</span>
                    <span className="block text-gray-900 text-base">{booking.nationality || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Occupation</span>
                    <span className="block text-gray-900 text-base">{booking.occupation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Passport / ID Number</span>
                    <span className="block text-gray-900 text-base">{booking.passportNo || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-gray-500 font-medium">Next of Kin Phone</span>
                    <span className="block text-gray-900 text-base">{booking.nextOfKinPhone || 'N/A'}</span>
                  </div>
                </div>
              </section>

              {/* Travel Info */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Location & Travel</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div className="col-span-2">
                    <span className="block text-gray-500 font-medium">Home Address</span>
                    <span className="block text-gray-900 text-base">{booking.address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">State of Origin</span>
                    <span className="block text-gray-900 text-base">{booking.stateOfOrigin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">LGA</span>
                    <span className="block text-gray-900 text-base">{booking.lga || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Arriving From</span>
                    <span className="block text-gray-900 text-base">{booking.arrivingFrom || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Going To</span>
                    <span className="block text-gray-900 text-base">{booking.goingTo || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-gray-500 font-medium">Purpose of Visit</span>
                    <span className="block text-gray-900 text-base">{booking.purposeOfVisit || 'N/A'}</span>
                  </div>
                </div>
              </section>

              {/* Stay Info */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Stay Details</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm bg-indigo-50/50 print:bg-white p-4 rounded-lg">
                  <div>
                    <span className="block text-gray-500 font-medium">Room</span>
                    <span className="block text-gray-900 text-base font-bold">{booking.roomNumber} ({booking.roomType})</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Total Cost</span>
                    <span className="block text-gray-900 text-base font-bold text-green-700">₦{booking.totalCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Check In</span>
                    <span className="block text-gray-900 text-base">{booking.checkInDate} {booking.checkInTime}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Check Out</span>
                    <span className="block text-gray-900 text-base">{booking.checkOutDate}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: ID Image */}
            <div className="w-full md:w-80 shrink-0">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Identity Document</h2>
              {booking.idScanUrl ? (
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm print:border-gray-400 print:shadow-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={booking.idScanUrl}
                    alt="Guest ID Scan"
                    className="w-full h-auto object-contain bg-gray-50"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-200 rounded-xl h-64 flex items-center justify-center text-gray-400 print:border-gray-400">
                  No ID Image Uploaded
                </div>
              )}
            </div>

          </div>

          {/* Footer signature line */}
          <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-500 mb-8">Guest Signature</p>
              <div className="w-64 border-b border-gray-400"></div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-8">Receptionist Signature</p>
              <div className="w-64 border-b border-gray-400 ml-auto"></div>
              <p className="text-xs text-gray-400 mt-2">Processed by: {booking.processedByUsername}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
