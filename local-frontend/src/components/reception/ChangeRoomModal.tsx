import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { BookingResponse, ChangeRoomRequest, SplitTenderRequest } from '@/types/booking';
import { RoomResponse } from '@/types/room';
import { SplitTenderInput } from '@/components/ui/SplitTenderInput';

interface ChangeRoomModalProps {
  booking: BookingResponse;
  onClose: () => void;
  onSubmit: (data: ChangeRoomRequest) => Promise<void>;
  isSubmitting: boolean;
}

export default function ChangeRoomModal({ booking, onClose, onSubmit, isSubmitting }: ChangeRoomModalProps) {
  const [newRoomType, setNewRoomType] = useState<string>('');
  const [newRoomNumber, setNewRoomNumber] = useState<string>('');
  const [newTotalCost, setNewTotalCost] = useState<number>(booking.totalCost);
  const [splitTenders, setSplitTenders] = useState<SplitTenderRequest[]>([{ id: '1', paymentMethod: 'POS', amount: 0 }]);
  const [error, setError] = useState<string | null>(null);

  const { data: terminals = [] } = useQuery({
    queryKey: ['smartPosTerminals'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/smart-pos');
      if (!res.ok) return [];
      return res.json();
    }
  });
  const activeTerminals = terminals.filter((t: { id: string; name: string; isActive: boolean }) => t.isActive);

  const { data: rooms = [], isLoading } = useQuery<RoomResponse[]>({
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

  const difference = newTotalCost - booking.totalCost;

  React.useEffect(() => {
    if (splitTenders.length === 1) {
      setSplitTenders(prev => [{ ...prev[0], amount: Math.abs(difference) }]);
    }
  }, [difference]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomType || !newRoomNumber) {
      setError('Please select a new room type and number');
      return;
    }
    setError(null);
    try {
      const payload: ChangeRoomRequest = {
        newRoomType,
        newRoomNumber,
        newTotalCost,
        splitTenders: [],
      };

      if (difference !== 0) {
        const tenderedTotal = splitTenders.reduce((sum, t) => sum + (t.amount || 0), 0);
        if (Math.abs(tenderedTotal - Math.abs(difference)) > 0.01) {
          setError(`Sum of split tenders (₦${tenderedTotal.toFixed(2)}) does not match difference (₦${Math.abs(difference).toFixed(2)})`);
          return;
        }
        payload.splitTenders = splitTenders.map(({ id, ...rest }) => rest);
      }

      await onSubmit(payload);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to change room');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Change Room for {booking.guestFirstName}</h3>
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
            <p className="text-sm text-blue-800">Total Cost: <strong>₦{booking.totalCost.toFixed(2)}</strong></p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Room Type *</label>
              <select
                value={newRoomType}
                onChange={(e) => {
                  setNewRoomType(e.target.value);
                  setNewRoomNumber('');
                }}
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
              >
                <option value="">-- Select Type --</option>
                {availableRoomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Room Number *</label>
              <select
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                required
                disabled={!newRoomType}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border disabled:bg-gray-100"
              >
                <option value="">-- Select Room --</option>
                {availableRooms
                  .filter(r => r.roomType === newRoomType)
                  .map(r => (
                    <option key={r.id} value={r.roomNumber}>{r.roomNumber}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Total Cost (₦) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={newTotalCost}
                onChange={(e) => setNewTotalCost(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border font-semibold text-indigo-700"
              />
            </div>

            {difference !== 0 && (
              <div className={`p-4 rounded-xl border ${difference > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <h4 className={`text-sm font-bold mb-1 ${difference > 0 ? 'text-amber-900' : 'text-green-900'}`}>
                  {difference > 0 ? 'Upgrade Charge (Due)' : 'Downgrade Refund (Owed)'}
                </h4>
                <p className={`text-lg font-black ${difference > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  ₦{Math.abs(difference).toFixed(2)}
                </p>
                
                <div className="mt-3">
                  <SplitTenderInput 
                    tenders={splitTenders as any} 
                    setTenders={(tenders) => setSplitTenders(tenders)} 
                    total={Math.abs(difference)} 
                    activeTerminals={activeTerminals} 
                  />
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
              disabled={isSubmitting || isLoading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 border border-transparent rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
