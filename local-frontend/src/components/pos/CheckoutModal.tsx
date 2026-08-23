import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface SmartPosTerminal {
  id: string;
  name: string;
  isActive: boolean;
}

interface SplitTender {
  id: string;
  paymentMethod: 'CASH' | 'POS' | 'TRANSFER';
  amount: number;
  smartPosTerminalId?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (splitTenders: Omit<SplitTender, 'id'>[], printerIp: string) => Promise<void>;
  printerIp: string;
  setPrinterIp: (ip: string) => void;
  isProcessing: boolean;
}

export default function CheckoutModal({ isOpen, onClose, total, onConfirm, printerIp, setPrinterIp, isProcessing }: CheckoutModalProps) {
  const [tenders, setTenders] = useState<SplitTender[]>([
    { id: '1', paymentMethod: 'CASH', amount: total }
  ]);

  const { data: terminals = [] } = useQuery<SmartPosTerminal[]>({
    queryKey: ['smartPosTerminals'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/smart-pos');
      if (!res.ok) throw new Error('Failed to fetch terminals');
      return res.json();
    },
    enabled: isOpen
  });

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevTotal, setPrevTotal] = useState(total);

  if (isOpen !== prevIsOpen || (isOpen && total !== prevTotal)) {
    setPrevIsOpen(isOpen);
    setPrevTotal(total);
    if (isOpen) {
      setTenders([{ id: '1', paymentMethod: 'CASH', amount: total }]);
    }
  }

  if (!isOpen) return null;

  const activeTerminals = terminals.filter(t => t.isActive);
  
  const currentTotal = tenders.reduce((sum, t) => sum + (t.amount || 0), 0);
  const remaining = total - currentTotal;
  const isBalanced = Math.abs(remaining) < 0.01;

  const handleAddTender = () => {
    setTenders([
      ...tenders,
      { id: Date.now().toString(), paymentMethod: 'POS', amount: remaining > 0 ? remaining : 0 }
    ]);
  };

  const handleUpdateTender = (id: string, field: keyof SplitTender, value: string | number) => {
    setTenders(tenders.map(t => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const handleRemoveTender = (id: string) => {
    setTenders(tenders.filter(t => t.id !== id));
  };

  const handleSubmit = () => {
    if (!isBalanced) return;
    onConfirm(tenders, printerIp);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Complete Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex justify-between items-center p-4 bg-blue-50 text-blue-900 rounded-xl">
            <span className="font-bold">Grand Total:</span>
            <span className="text-2xl font-extrabold">₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Payment Tenders</h3>
              <button 
                onClick={handleAddTender}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center"
              >
                + Split Tender
              </button>
            </div>

            {tenders.map((tender) => (
              <div key={tender.id} className="p-4 border rounded-xl space-y-3 bg-white shadow-sm relative group">
                {tenders.length > 1 && (
                  <button 
                    onClick={() => handleRemoveTender(tender.id)}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-200"
                  >
                    ×
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Method</label>
                    <select 
                      value={tender.paymentMethod}
                      onChange={e => handleUpdateTender(tender.id, 'paymentMethod', e.target.value)}
                      className="w-full border p-2 rounded-lg bg-gray-50 font-medium"
                    >
                      <option value="CASH">Cash</option>
                      <option value="POS">POS / Card</option>
                      <option value="TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (₦)</label>
                    <input 
                      type="number"
                      value={tender.amount === 0 ? '' : tender.amount}
                      onChange={e => handleUpdateTender(tender.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full border p-2 rounded-lg font-bold text-right"
                    />
                  </div>
                </div>

                {(tender.paymentMethod === 'POS' || tender.paymentMethod === 'TRANSFER') && activeTerminals.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Smart POS Terminal</label>
                    <select 
                      value={tender.smartPosTerminalId || ''}
                      onChange={e => handleUpdateTender(tender.id, 'smartPosTerminalId', e.target.value)}
                      className="w-full border p-2 rounded-lg bg-gray-50"
                    >
                      <option value="">-- Select Terminal (Optional) --</option>
                      {activeTerminals.map(term => (
                        <option key={term.id} value={term.id}>{term.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">Printer IP (Optional)</label>
            <input 
              type="text" 
              placeholder="192.168.1.100" 
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
              {isBalanced ? '✓ Fully Tendered' : `Balance Remaining: ₦${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </span>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!isBalanced || isProcessing}
            className={`
              w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-md
              ${!isBalanced || isProcessing
                ? "bg-gray-400 cursor-not-allowed shadow-none"
                : "bg-green-600 hover:bg-green-700 hover:-translate-y-1 active:translate-y-0"
              }
            `}
          >
            {isProcessing ? "Processing..." : "Complete Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
