'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface SmartPosTerminal {
  id: string;
  name: string;
  serialNumber: string;
  isActive: boolean;
}

export default function SmartPosTerminalTab() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SmartPosTerminal>>({});

  const { data: terminals = [], isLoading } = useQuery<SmartPosTerminal[]>({
    queryKey: ['smartPosTerminals'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/smart-pos');
      if (!res.ok) throw new Error('Failed to fetch terminals');
      return res.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (terminal: Partial<SmartPosTerminal>) => {
      const isNew = !terminal.id;
      const url = isNew ? '/api/proxy/admin/smart-pos' : `/api/proxy/admin/smart-pos/${terminal.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await apiClient(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(terminal),
      });
      if (!res.ok) throw new Error('Failed to save terminal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smartPosTerminals'] });
      setIsEditing(null);
      setFormData({});
    }
  });

  const handleEdit = (terminal: SmartPosTerminal) => {
    setFormData(terminal);
    setIsEditing(terminal.id);
  };

  const handleCreate = () => {
    setFormData({ name: '', serialNumber: '', isActive: true });
    setIsEditing('new');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) return <p className="text-gray-500">Loading terminals...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Smart POS Terminals</h3>
          <p className="text-sm text-gray-500">Manage physical POS terminals (e.g. Moniepoint, OPay) for accurate ledger tracking.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          + Add Terminal
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {terminals.map((terminal) => (
              <tr key={terminal.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{terminal.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{terminal.serialNumber || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${terminal.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {terminal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(terminal)} className="text-blue-600 hover:text-blue-900">Edit</button>
                </td>
              </tr>
            ))}
            {terminals.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No smart POS terminals configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{isEditing === 'new' ? 'New Terminal' : 'Edit Terminal'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-xl"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Moniepoint - Front Desk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-xl"
                  value={formData.serialNumber || ''}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="e.g. S920-12345"
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
