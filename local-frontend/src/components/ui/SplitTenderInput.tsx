import React from 'react';

export interface SplitTenderUI {
  id: string;
  paymentMethod: string;
  amount: number;
  smartPosTerminalId?: string;
}

interface SplitTenderInputProps {
  tenders: SplitTenderUI[];
  setTenders: (tenders: SplitTenderUI[]) => void;
  total: number;
  activeTerminals: { id: string; name: string }[];
}

export function SplitTenderInput({ tenders, setTenders, total, activeTerminals }: SplitTenderInputProps) {
  const currentTotal = tenders.reduce((sum, t) => sum + (t.amount || 0), 0);
  const remaining = total - currentTotal;

  const handleAddTender = () => {
    setTenders([
      ...tenders,
      { id: Date.now().toString(), paymentMethod: 'POS', amount: remaining > 0 ? remaining : 0 }
    ]);
  };

  const handleUpdateTender = (id: string, field: keyof SplitTenderUI, value: string | number) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-700">Payment Tenders</h3>
        <button 
          type="button"
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
              type="button"
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
                className="w-full border p-2 rounded-lg bg-gray-50 font-medium text-sm"
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
                min="0"
                step="0.01"
                value={tender.amount === 0 ? '' : tender.amount}
                onChange={e => handleUpdateTender(tender.id, 'amount', parseFloat(e.target.value) || 0)}
                className="w-full border p-2 rounded-lg font-bold text-blue-700 bg-blue-50 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {(tender.paymentMethod === 'POS' || tender.paymentMethod === 'TRANSFER') && activeTerminals.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Terminal (Optional)</label>
              <select 
                value={tender.smartPosTerminalId || ''}
                onChange={e => handleUpdateTender(tender.id, 'smartPosTerminalId', e.target.value)}
                className="w-full border p-2 rounded-lg bg-gray-50 text-sm"
              >
                <option value="">-- Any Terminal --</option>
                {activeTerminals.map(term => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}

      <div className={`p-3 rounded-lg flex justify-between font-bold text-sm ${Math.abs(remaining) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        <span>Balance Remaining:</span>
        <span>₦{remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
