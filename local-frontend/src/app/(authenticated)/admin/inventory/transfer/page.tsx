"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  type: string;
}

interface Product {
  id: string;
  name: string;
  internalSku: string;
}

export default function InventoryTransferPage() {
  const [sourceId, setSourceId] = useState<string>('');
  const [destId, setDestId] = useState<string>('');
  const [items, setItems] = useState<{ internalSku: string; quantity: number }[]>([
    { internalSku: '', quantity: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: locations = [], isLoading: locLoading } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/inventory/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      return res.json();
    }
  });

  const { data: products = [], isLoading: prodLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const handleAddItem = () => {
    setItems([...items, { internalSku: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'internalSku' | 'quantity', value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId) {
      toast.error('Source and destination locations are required');
      return;
    }
    if (sourceId === destId) {
      toast.error('Source and destination cannot be the same');
      return;
    }
    if (items.some(i => !i.internalSku || i.quantity < 1)) {
      toast.error('All items must have a valid SKU and quantity > 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/api/proxy/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLocationId: sourceId,
          destinationLocationId: destId,
          items: items
        })
      });

      if (!res.ok) {
        let errorMsg = 'Transfer failed';
        try {
          const errData = await res.json();
          if (errData && errData.message) errorMsg = errData.message;
        } catch {}
        throw new Error(errorMsg);
      }

      toast.success('Inventory transferred successfully!');
      setSourceId('');
      setDestId('');
      setItems([{ internalSku: '', quantity: 1 }]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (locLoading || prodLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Toaster position="top-right" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Transfer</h1>
        <p className="text-gray-500 mt-2">Move stock between facility locations</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Source Location</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Select source...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Destination Location</label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Select destination...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <label className="block text-sm font-bold text-gray-700">Items to Transfer</label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1 rounded-md"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border">
                <div className="flex-1">
                  <select
                    value={item.internalSku}
                    onChange={(e) => handleItemChange(index, 'internalSku', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2 outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.internalSku}>{p.name} ({p.internalSku})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2 outline-none focus:border-blue-500"
                    required
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md
              ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}
            `}
          >
            {isSubmitting ? 'Transferring...' : 'Complete Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
}
