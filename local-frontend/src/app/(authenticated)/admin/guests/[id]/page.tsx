"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Booking {
  id: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalCost: number;
  status: string;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title?: string;
  occupation?: string;
  nextOfKinPhone?: string;
  address?: string;
  lga?: string;
  nationality?: string;
  stateOfOrigin?: string;
  passportNo?: string;
  nin?: string;
  purposeOfVisit?: string;
  arrivingFrom?: string;
  goingTo?: string;
  idScanUrl?: string;
  bookings: Booking[];
}

export default function GuestDetailsPage() {
  const { id } = useParams();

  const { data: guest, isLoading, error } = useQuery<Guest>({
    queryKey: ['guest', id],
    queryFn: async () => {
      const res = await apiClient(`/api/proxy/guests/${id}`);
      if (!res.ok) throw new Error('Failed to fetch guest details');
      return res.json();
    }
  });

  if (isLoading) return <div className="p-8 text-gray-500">Loading guest details...</div>;
  if (error || !guest) return <div className="p-8 text-red-500">Error loading guest details</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {guest.title ? `${guest.title} ` : ''}{guest.firstName} {guest.lastName}
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">Guest</span>
          </h1>
          <p className="text-gray-500 mt-2">{guest.email} • {guest.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Info & ID Scan */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">ID Scan</h2>
            {guest.idScanUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                <img 
                  src={(guest.idScanUrl.startsWith('/api/') || guest.idScanUrl.startsWith('/uploads/')) ? guest.idScanUrl : `/api/proxy${guest.idScanUrl}`} 
                  alt="Guest ID Scan" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-gray-50 border-2 border-dashed flex flex-col items-center justify-center text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                </svg>
                <span>No ID Scan Uploaded</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Demographics</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nationality</span>
                <span className="font-medium text-gray-900">{guest.nationality || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">State of Origin</span>
                <span className="font-medium text-gray-900">{guest.stateOfOrigin || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LGA</span>
                <span className="font-medium text-gray-900">{guest.lga || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Occupation</span>
                <span className="font-medium text-gray-900">{guest.occupation || '-'}</span>
              </div>
              <div className="pt-3 border-t">
                <span className="block text-gray-500 mb-1">Address</span>
                <span className="font-medium text-gray-900 block">{guest.address || '-'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Travel Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Purpose of Visit</span>
                <span className="font-medium text-gray-900">{guest.purposeOfVisit || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Arriving From</span>
                <span className="font-medium text-gray-900">{guest.arrivingFrom || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Going To</span>
                <span className="font-medium text-gray-900">{guest.goingTo || '-'}</span>
              </div>
              <div className="pt-3 border-t">
                <span className="text-gray-500">Next of Kin Phone:</span>
                <span className="font-medium text-gray-900 ml-2">{guest.nextOfKinPhone || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bookings History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6 h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Booking History</h2>
            
            {guest.bookings && guest.bookings.length > 0 ? (
              <div className="space-y-4">
                {guest.bookings.map(booking => (
                  <div key={booking.id} className="border rounded-xl p-5 hover:border-blue-300 transition-colors flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-gray-900">Room {booking.roomNumber}</span>
                        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{booking.roomType}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          booking.status === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                          booking.status === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-800' :
                          booking.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.checkInDate).toLocaleDateString()} — {new Date(booking.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-blue-600">
                        ₦{booking.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No previous bookings</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
