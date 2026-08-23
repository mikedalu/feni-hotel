import React, { useState } from 'react';
import { BookingResponse } from '@/types/booking';

export interface DepositRequest {
  amount: number;
  paymentMethod: string;
}

interface ManageDepositsModalProps {
  booking: BookingResponse;
  onClose: () => void;
  onAddDeposit: (data: DepositRequest) => Promise<void>;
  onRefundDeposit: (data: DepositRequest) => Promise<void>;
  isSubmitting: boolean;
}

export default function ManageDepositsModal({ booking, onClose, onAddDeposit, onRefundDeposit, isSubmitting }: ManageDepositsModalProps) {
  const [action, setAction] = useState<'ADD' | 'REFUND'>('ADD');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    setError(null);
    try {
      if (action === 'ADD') {
        await onAddDeposit({ amount, paymentMethod });
      } else {
        await onRefundDeposit({ amount, paymentMethod });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process deposit action');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Manage Deposits for {booking.guestFirstName}</h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Room {booking.roomNumber}</span>
        </div>
        
        <div className="px-6 py-4 border-b border-gray-100 flex gap-4">
          <button
            type="button"
            onClick={() => setAction('ADD')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${action === 'ADD' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Add Deposit
          </button>
          <button
            type="button"
            onClick={() => setAction('REFUND')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${action === 'REFUND' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Refund Deposit
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border font-semibold text-indigo-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
              >
                <option value="CASH">Cash</option>
                <option value="POS">Card Terminal (POS)</option>
                <option value="TRANSFER">Bank Transfer</option>
              </select>
            </div>
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
              className={`px-5 py-2.5 text-sm font-bold text-white border border-transparent rounded-xl shadow-sm disabled:opacity-50 transition-colors ${action === 'ADD' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isSubmitting ? 'Processing...' : (action === 'ADD' ? 'Confirm Deposit' : 'Process Refund')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
