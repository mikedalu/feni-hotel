'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';

interface PromoRequest {
  name: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  targetRoomType: string;
  active: boolean;
}

interface PromoResponse {
  id: string;
  name: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  targetRoomType: string;
  active: boolean;
}

export default function AdminPromosSetup() {
  const queryClient = useQueryClient();
  const [newPromo, setNewPromo] = useState<PromoRequest>({
    name: '',
    discountPercentage: 10,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days from now
    targetRoomType: 'ALL',
    active: true,
  });
  const [error, setError] = useState<string | null>(null);

  const { data: promos = [], isLoading } = useQuery<PromoResponse[]>({
    queryKey: ['promos'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/promos');
      if (!res.ok) throw new Error('Failed to fetch promos');
      return res.json();
    }
  });

  const createPromoMutation = useMutation({
    mutationFn: async (payload: PromoRequest) => {
      const res = await apiClient('/api/proxy/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const parsed = JSON.parse(errorText);
          throw new Error(parsed.message || 'Failed to create promo');
        } catch {
          throw new Error('Failed to create promo');
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setNewPromo({
        name: '',
        discountPercentage: 10,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        targetRoomType: 'ALL',
        active: true,
      });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
    }
  });

  const togglePromoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/api/proxy/promos/${id}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to toggle promo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPromoMutation.mutate(newPromo);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Seasonal Promos</h2>
          <p className="text-sm text-gray-500 mt-1">Manage active discount campaigns for specific room types.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Create Promo Form */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Promo</h3>
              {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Promo Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Special"
                    value={newPromo.name}
                    onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    required
                    value={newPromo.discountPercentage}
                    onChange={(e) => setNewPromo({ ...newPromo, discountPercentage: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Room Type</label>
                  <select
                    required
                    value={newPromo.targetRoomType}
                    onChange={(e) => setNewPromo({ ...newPromo, targetRoomType: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                  >
                    <option value="ALL">All Room Types</option>
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newPromo.startDate}
                      onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      required
                      value={newPromo.endDate}
                      onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={createPromoMutation.isPending}
                  className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {createPromoMutation.isPending ? 'Creating...' : 'Create Promo'}
                </button>
              </form>
            </div>
          </div>

          {/* Promos List */}
          <div className="md:col-span-2">
            <DataTable
              data={promos}
              columns={[
                { 
                  accessorKey: 'name', 
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Campaign" />,
                  meta: { className: 'font-medium text-gray-900' }
                },
                { 
                  accessorKey: 'discountPercentage', 
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Discount" />,
                  cell: ({ row }) => <span className="font-bold text-green-600">{row.getValue('discountPercentage')}%</span>,
                  meta: { exportValue: (promo: PromoResponse) => `${promo.discountPercentage}%` }
                },
                { 
                  accessorKey: 'targetRoomType', 
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Room Type" />,
                  meta: { className: 'text-gray-500' }
                },
                { 
                  accessorKey: 'startDate',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Dates" />,
                  cell: ({ row }) => <span className="text-gray-500">{row.original.startDate} to {row.original.endDate}</span>,
                  meta: { exportValue: (promo: PromoResponse) => `${promo.startDate} to ${promo.endDate}` }
                },
                { 
                  accessorKey: 'active',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
                  cell: ({ row }) => (
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      row.getValue('active') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {row.getValue('active') ? 'Active' : 'Inactive'}
                    </span>
                  ),
                  meta: { exportValue: (promo: PromoResponse) => promo.active ? 'Active' : 'Inactive' }
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  meta: { headerClassName: 'text-right', className: 'text-right' },
                  cell: ({ row }) => (
                    <div className="flex justify-end">
                      <button
                        onClick={() => togglePromoMutation.mutate(row.original.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {row.original.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  )
                }
              ]}
              isLoading={isLoading}
              emptyMessage="No promos configured yet."
              filename={`promos-${new Date().toISOString().split('T')[0]}.csv`}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
