'use client';

import React, { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { QrCodeIcon, PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

interface IntakeItem {
  internalSku: string;
  quantity: number;
}

export default function InventoryIntakePage() {
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [manualSku, setManualSku] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [printerIp, setPrinterIp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScan = useCallback((barcode: string) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(item => item.internalSku === barcode);
      if (existingIdx >= 0) {
        const newItems = [...prev];
        newItems[existingIdx].quantity += 1;
        toast.success(`Incremented quantity for ${barcode}`);
        return newItems;
      }
      toast.success(`Scanned ${barcode}`);
      return [...prev, { internalSku: barcode, quantity: 1 }];
    });
  }, []);

  useBarcodeScanner({ onScan: handleScan });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim()) return;
    
    setItems((prev) => {
      const existingIdx = prev.findIndex(item => item.internalSku === manualSku.trim());
      if (existingIdx >= 0) {
        const newItems = [...prev];
        newItems[existingIdx].quantity += manualQty;
        return newItems;
      }
      return [...prev, { internalSku: manualSku.trim(), quantity: manualQty }];
    });
    
    setManualSku('');
    setManualQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('No items to submit');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items,
        printerIp: printerIp.trim() || null
      };

      const res = await apiClient('/api/inventory/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Submission failed');
      
      toast.success('Inventory intake successful');
      setItems([]);
      setPrinterIp('');
    } catch (error) {
      toast.error('Failed to submit inventory intake');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventory Intake</h2>
        <p className="text-sm text-gray-500 mt-1">Scan or manually enter items to add them to stock.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Entry Form & Settings */}
        <div className="space-y-6 lg:col-span-1">
          {/* Scanner helper card */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <QrCodeIcon className="w-48 h-48" />
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10">Scanner Ready</h3>
            <p className="text-indigo-100 text-sm relative z-10">
              Ensure focus is outside of input fields. You can start scanning barcodes with your hardware scanner now.
            </p>
          </div>

          {/* Manual Entry */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Manual Entry</h3>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">SKU / Barcode</label>
                <input
                  type="text"
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Enter SKU..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={manualQty}
                  onChange={(e) => setManualQty(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <button
                type="submit"
                disabled={!manualSku.trim()}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:opacity-50"
              >
                <PlusIcon className="w-5 h-5" /> Add to List
              </button>
            </form>
          </div>

          {/* Printer Settings */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Label Printing</h3>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Printer IP (Optional)</label>
              <input
                type="text"
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
                className="mt-1 block w-full rounded-xl border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="192.168.1.100"
              />
              <p className="mt-2 text-xs text-gray-500">
                If provided, labels will be printed to this ZPL printer for items lacking a manufacturer barcode.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Intake List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Scanned Items ({items.reduce((acc, val) => acc + val.quantity, 0)})</h3>
              <button
                onClick={handleSubmit}
                disabled={items.length === 0 || isSubmitting}
                className="inline-flex items-center gap-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all"
              >
                <CheckCircleIcon className="h-5 w-5" />
                {isSubmitting ? 'Submitting...' : 'Complete Intake'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                  <QrCodeIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p>No items scanned yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <li key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.internalSku}</p>
                          <p className="text-xs font-medium text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-gray-400 hover:text-rose-600 transition-colors p-2 rounded-xl hover:bg-rose-50"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
