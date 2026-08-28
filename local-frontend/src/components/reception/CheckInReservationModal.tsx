import React, { useState } from 'react';
import { BookingResponse, BookingRequest } from '@/types/booking';
import { SplitTenderInput } from '@/components/ui/SplitTenderInput';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Props {
  booking: BookingResponse;
  onClose: () => void;
  onSubmit: (data: Partial<BookingRequest>) => Promise<void>;
  isSubmitting: boolean;
}

export default function CheckInReservationModal({ booking, onClose, onSubmit, isSubmitting }: Props) {
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

  const [formData, setFormData] = useState<Partial<BookingRequest>>(() => {
    let printerIp = '';
    if (typeof window !== 'undefined') {
      printerIp = localStorage.getItem('feni_printer_ip') || '';
    }
    return {
      splitTenders: [{ id: '1', paymentMethod: 'CASH', amount: booking.totalCost }],
      totalCost: booking.totalCost,
      printerIp,
      // DSS details
      address: booking.address || '',
      nationality: booking.nationality || '',
      occupation: booking.occupation || '',
      purposeOfVisit: booking.purposeOfVisit || '',
      nextOfKinPhone: booking.nextOfKinPhone || '',
      passportNo: booking.passportNo || '',
      nin: booking.nin || '',
      arrivingFrom: booking.arrivingFrom || '',
      goingTo: booking.goingTo || '',
      stateOfOrigin: booking.stateOfOrigin || '',
      lga: booking.lga || '',
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'printerIp') {
      localStorage.setItem('feni_printer_ip', value);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const nextState = { ...prev, totalCost: val };
      if (nextState.splitTenders && nextState.splitTenders.length === 1) {
        nextState.splitTenders = [{ ...nextState.splitTenders[0], amount: val }];
      }
      return nextState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...formData };
      
      const tenderedTotal = payload.splitTenders?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      if (Math.abs(tenderedTotal - (payload.totalCost || 0)) > 0.01) {
        setError(`Sum of split tenders (₦${tenderedTotal.toFixed(2)}) does not match total cost (₦${payload.totalCost?.toFixed(2)})`);
        return;
      }

      if (payload.splitTenders) {
        payload.splitTenders = payload.splitTenders.map(({ id, ...rest }: any) => {
           if (rest.paymentMethod === 'CASH') {
              return { ...rest, smartPosTerminalId: undefined };
           }
           return rest;
        }) as any;
      }
      
      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Check In Reservation</h3>
          <p className="text-sm text-gray-500 mt-1">
            {booking.guestFirstName} {booking.guestLastName} • Room {booking.roomNumber}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 border-b border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-6">
            
            {/* Payment Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Payment</h4>
              
              <div className="mb-4">
                <SplitTenderInput 
                  tenders={formData.splitTenders as any || []} 
                  setTenders={(tenders) => setFormData(prev => ({ ...prev, splitTenders: tenders }))} 
                  total={formData.totalCost || 0} 
                  activeTerminals={activeTerminals} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Cost (₦) *</label>
                  <input
                    type="number"
                    name="totalCost"
                    required
                    min="0"
                    step="0.01"
                    value={formData.totalCost}
                    onChange={handleTotalCostChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-bold text-indigo-700"
                  />
                  {booking.totalCost !== formData.totalCost && (
                    <p className="text-xs text-amber-600 mt-1">Cost differs from reservation (₦{booking.totalCost})</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Printer IP (Optional)</label>
                  <input
                    type="text"
                    name="printerIp"
                    value={formData.printerIp}
                    onChange={handleChange}
                    placeholder="e.g. 192.168.1.100"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* DSS Details Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Additional Details (DSS)</h4>
              <p className="text-xs text-gray-500 mb-4">Complete any missing details for reporting.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Home Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Nationality</label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">State of Origin</label>
                  <input type="text" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">LGA</label>
                  <input type="text" name="lga" value={formData.lga} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Occupation</label>
                  <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Purpose of Visit</label>
                  <input type="text" name="purposeOfVisit" value={formData.purposeOfVisit} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Next of Kin Phone</label>
                  <input type="tel" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Passport / ID No.</label>
                  <input type="text" name="passportNo" value={formData.passportNo} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">NIN (National ID)</label>
                  <input type="text" name="nin" value={formData.nin} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Arriving From</label>
                  <input type="text" name="arrivingFrom" value={formData.arrivingFrom} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Going To</label>
                  <input type="text" name="goingTo" value={formData.goingTo} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 sm:text-sm" />
                </div>
              </div>
            </div>

          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Complete Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
