import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { BookingResponse, ExtendBookingRequest } from '@/types/booking';
import { RoomResponse } from '@/types/room';

interface ExtendBookingModalProps {
  booking: BookingResponse;
  onClose: () => void;
  onSubmit: (data: ExtendBookingRequest) => Promise<void>;
  isSubmitting: boolean;
}

export default function ExtendBookingModal({ booking, onClose, onSubmit, isSubmitting }: ExtendBookingModalProps) {
  // Get tomorrow relative to current checkOutDate
  const defaultNextDate = new Date(booking.checkOutDate);
  defaultNextDate.setDate(defaultNextDate.getDate() + 1);
  const defaultDateStr = defaultNextDate.toISOString().split('T')[0];

  const [newCheckOutDate, setNewCheckOutDate] = useState<string>(defaultDateStr);
  const [additionalCost, setAdditionalCost] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [error, setError] = useState<string | null>(null);

  const { data: rooms = [] } = useQuery<RoomResponse[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/rooms');
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    }
  });

  useEffect(() => {
    if (!newCheckOutDate) return;
    const oldDate = new Date(booking.checkOutDate);
    const newDate = new Date(newCheckOutDate);
    
    if (newDate > oldDate) {
      const diffTime = Math.abs(newDate.getTime() - oldDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const room = rooms.find(r => r.roomNumber === booking.roomNumber);
      if (room) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdditionalCost(diffDays * room.currentPrice);
      }
    } else {
      setAdditionalCost(0);
    }
  }, [newCheckOutDate, booking.checkOutDate, booking.roomNumber, rooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckOutDate) {
      setError('Please select a new check-out date');
      return;
    }
    const oldDate = new Date(booking.checkOutDate);
    const newDate = new Date(newCheckOutDate);
    if (newDate <= oldDate) {
      setError('New check-out date must be after the current check-out date');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        newCheckOutDate,
        additionalCost,
        paymentMethod,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to extend booking');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Extend Stay for {booking.guestFirstName}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Current Booking Details</h4>
            <p className="text-sm text-blue-800">Room: <strong>{booking.roomNumber}</strong> ({booking.roomType})</p>
            <p className="text-sm text-blue-800">Current Checkout: <strong>{booking.checkOutDate}</strong></p>
            <p className="text-sm text-blue-800">Total Paid So Far: <strong>₦{booking.totalCost.toFixed(2)}</strong></p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Check-Out Date *</label>
              <input
                type="date"
                required
                min={defaultDateStr}
                value={newCheckOutDate}
                onChange={(e) => setNewCheckOutDate(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Cost (₦) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={additionalCost}
                onChange={(e) => setAdditionalCost(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border font-semibold text-indigo-700"
              />
            </div>

            {additionalCost > 0 && (
              <div className="p-4 rounded-xl border bg-amber-50 border-amber-200">
                <h4 className="text-sm font-bold mb-1 text-amber-900">Payment Due</h4>
                <p className="text-lg font-black text-amber-700">
                  ₦{additionalCost.toFixed(2)}
                </p>
                
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-2 border bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="POS">Card Terminal (POS)</option>
                    <option value="TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 border border-transparent rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Extension'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
