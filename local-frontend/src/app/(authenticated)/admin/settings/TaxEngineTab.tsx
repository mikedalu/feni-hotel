'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface TaxBracket {
  id: string;
  name: string;
  rate: number;
  liabilityAccountName: string;
  isActive: boolean;
}

export default function TaxEngineTab() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TaxBracket>>({});

  const { data: taxBrackets = [], isLoading } = useQuery<TaxBracket[]>({
    queryKey: ['taxBrackets'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/tax-brackets');
      if (!res.ok) throw new Error('Failed to fetch tax brackets');
      return res.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (bracket: Partial<TaxBracket>) => {
      const isNew = !bracket.id;
      const url = isNew ? '/api/proxy/admin/tax-brackets' : `/api/proxy/admin/tax-brackets/${bracket.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await apiClient(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bracket),
      });
      if (!res.ok) throw new Error('Failed to save tax bracket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxBrackets'] });
      setIsEditing(null);
      setFormData({});
    }
  });

  const handleEdit = (bracket: TaxBracket) => {
    setFormData(bracket);
    setIsEditing(bracket.id);
  };

  const handleCreate = () => {
    setFormData({ name: '', rate: 0, liabilityAccountName: 'Taxes Payable', isActive: true });
    setIsEditing('new');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) return <p className="text-gray-500">Loading tax engine...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tax Brackets</h3>
          <p className="text-sm text-gray-500">Configure multi-state tax rates for products.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          + Add Tax Bracket
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liability Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {taxBrackets.map((bracket) => (
              <tr key={bracket.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bracket.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bracket.rate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bracket.liabilityAccountName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bracket.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {bracket.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(bracket)} className="text-blue-600 hover:text-blue-900">Edit</button>
                </td>
              </tr>
            ))}
            {taxBrackets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No tax brackets configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{isEditing === 'new' ? 'New Tax Bracket' : 'Edit Tax Bracket'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-xl"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Lagos Consumption Tax"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-xl"
                  value={formData.rate || 0}
                  onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Liability Account Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-xl"
                  value={formData.liabilityAccountName || ''}
                  onChange={e => setFormData({ ...formData, liabilityAccountName: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="mr-2"
                  checked={formData.isActive || false}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
