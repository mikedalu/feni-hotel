'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BookingRequest } from '@/types/booking';
import { RoomResponse } from '@/types/room';

export default function ManualBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);
  const [systemCalculatedCost, setSystemCalculatedCost] = useState<number>(0);

  const { data: rooms = [] } = useQuery<RoomResponse[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/rooms');
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      return data.filter((room: RoomResponse) => room.active);
    }
  });

  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE');
  const availableRoomTypes = Array.from(new Set(availableRooms.map(r => r.roomType)));

  const [formData, setFormData] = useState<BookingRequest>(() => {
    let printerIp = '';
    if (typeof window !== 'undefined') {
      printerIp = localStorage.getItem('feni_printer_ip') || '';
    }
    return {
      guestFirstName: '',
      guestLastName: '',
      guestEmail: '',
      guestPhone: '',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      roomNumber: '',
      roomType: 'Standard',
      checkInTime: '14:00',
      paymentMethod: 'CASH',
      totalCost: 0,
      printerIp,
    };
  });

  // removed useEffect for printerIp

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If room type changes, clear room number
    if (name === 'roomType') {
      setFormData(prev => ({ ...prev, roomType: value, roomNumber: '' }));
      return;
    }

    if (name === 'printerIp') {
      localStorage.setItem('feni_printer_ip', value);
    }

    setFormData(prev => {
      const nextState = {
        ...prev,
        [name]: name === 'totalCost' ? parseFloat(value) || 0 : value,
      };
      
      // Auto-calculate cost when relevant fields change
      if (name === 'roomNumber' || name === 'checkInDate' || name === 'checkOutDate') {
        const room = rooms.find(r => r.roomNumber === nextState.roomNumber);
        if (room && room.currentPrice) {
          const inDate = new Date(nextState.checkInDate);
          const outDate = new Date(nextState.checkOutDate);
          const diffTime = Math.abs(outDate.getTime() - inDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const nights = diffDays > 0 ? diffDays : 1;
          const autoCost = room.currentPrice * nights;
          setSystemCalculatedCost(autoCost);
          nextState.totalCost = autoCost;
        }
      }
      return nextState;
    });
  };

  // removed useEffect for cost calculation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/api/proxy/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.fieldErrors) {
            const errors = Object.entries(parsed.fieldErrors).map(([field, msg]) => {
              const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return `${fieldName}: ${msg}`;
            });
            throw errors;
          }
          throw new Error(parsed.message || 'Failed to create booking');
        } catch (e) {
          if (Array.isArray(e)) throw e;
          throw new Error(errorText || 'Failed to create booking');
        }
      }

      router.push('/reception'); // Redirect to dashboard on success
    } catch (err: unknown) {
      if (Array.isArray(err)) {
        setError(err);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FRONT_DESK']}>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Walk-in Check-in</h2>
          <p className="text-sm text-gray-500 mt-1">Manually enter guest details and process a walk-in booking.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
            {Array.isArray(error) ? (
              <ul className="list-disc pl-5 space-y-1">
                {error.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            ) : (
              <p>{error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Guest Details Section */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Guest Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="guestFirstName"
                  required
                  value={formData.guestFirstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="guestLastName"
                  required
                  value={formData.guestLastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <input
                  type="email"
                  name="guestEmail"
                  required
                  value={formData.guestEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input
                  type="tel"
                  name="guestPhone"
                  required
                  value={formData.guestPhone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div className="p-8 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-in Date *</label>
                <input
                  type="date"
                  name="checkInDate"
                  required
                  value={formData.checkInDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-out Date *</label>
                <input
                  type="date"
                  name="checkOutDate"
                  required
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expected Arrival Time</label>
                <input
                  type="time"
                  name="checkInTime"
                  value={formData.checkInTime}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Type *</label>
                <select
                  name="roomType"
                  required
                  value={formData.roomType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                >
                  <option value="">-- Select Type --</option>
                  {availableRoomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Number *</label>
                <select
                  name="roomNumber"
                  required
                  value={formData.roomNumber}
                  onChange={handleChange}
                  disabled={!formData.roomType}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">-- Select Room --</option>
                  {availableRooms
                    .filter(r => r.roomType === formData.roomType)
                    .map(room => (
                      <option key={room.id} value={room.roomNumber}>{room.roomNumber}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                <select
                  name="paymentMethod"
                  required
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="POS">Card Terminal (POS)</option>
                  <option value="TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Cost (₦) *</label>
                <input
                  type="number"
                  name="totalCost"
                  required
                  min="0"
                  step="0.01"
                  value={formData.totalCost}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-bold text-indigo-700"
                />
                {systemCalculatedCost > 0 && (
                  <p className="text-xs text-gray-500 mt-1">System calculated: ₦{systemCalculatedCost.toFixed(2)}</p>
                )}
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Printer IP (Optional)</label>
                <input
                  type="text"
                  name="printerIp"
                  value={formData.printerIp}
                  onChange={handleChange}
                  placeholder="e.g. 192.168.1.100"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">If provided, a physical receipt will be printed upon check-in.</p>
              </div>
              
              {formData.totalCost !== systemCalculatedCost && systemCalculatedCost > 0 && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-amber-700">Override Reason / Authorized By *</label>
                  <input
                    type="text"
                    name="overrideReason"
                    required
                    placeholder="E.g. Approved by Manager Jane for loyal guest"
                    value={formData.overrideReason || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 bg-amber-50 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                  />
                  <p className="text-xs text-amber-600 mt-1">You must provide a reason for altering the system calculated price.</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/reception')}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Check-in & Pay'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
