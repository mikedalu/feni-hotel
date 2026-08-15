'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import ProtectedRoute from '@/components/ProtectedRoute';
import { RoomResponse, RoomRequest } from '@/types/room';
import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';
import { PencilSquareIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AdminRoomsSetup() {
  const queryClient = useQueryClient();
  const [newRoom, setNewRoom] = useState<RoomRequest>({ roomNumber: '', roomType: 'Standard', basePrice: 0 });
  const [error, setError] = useState<string | null>(null);
  
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: rooms = [], isLoading } = useQuery<RoomResponse[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/rooms');
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    }
  });

  const createRoomMutation = useMutation({
    mutationFn: async (payload: RoomRequest) => {
      const res = await apiClient('/api/proxy/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to create room');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setNewRoom({ roomNumber: '', roomType: 'Standard', basePrice: 0 });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
    }
  });

  const updateRoomMutation = useMutation({
    mutationFn: async (payload: RoomResponse) => {
      const res = await apiClient(`/api/proxy/rooms/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomNumber: payload.roomNumber, 
          roomType: payload.roomType, 
          basePrice: payload.basePrice 
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update room');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setEditingRoom(null);
      setEditError(null);
    },
    onError: (err: any) => setEditError(err.message)
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/api/proxy/rooms/${id}/toggle-active`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle room status');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoomMutation.mutate(newRoom);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      updateRoomMutation.mutate(editingRoom);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Room Management</h2>
          <p className="text-sm text-gray-500 mt-1">Configure physical hotel rooms for check-in availability.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Add Room Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Room</h3>
              {error && <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select
                    required
                    value={newRoom.roomType}
                    onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newRoom.basePrice || ''}
                    onChange={(e) => setNewRoom({ ...newRoom, basePrice: parseFloat(e.target.value) || 0 })}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  className="mt-2 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {createRoomMutation.isPending ? 'Adding...' : 'Add Room'}
                </button>
              </form>
            </div>
          </div>

          {/* Rooms List */}
          <div className="lg:col-span-3">
            <DataTable
              data={rooms}
              columns={[
                {
                  accessorKey: 'roomNumber',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Room" />,
                  meta: { className: 'font-semibold text-gray-900' }
                },
                {
                  accessorKey: 'roomType',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
                  meta: { className: 'text-gray-600' }
                },
                {
                  accessorKey: 'currentPrice',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
                  cell: ({ row }) => (
                    <div className="font-medium text-gray-900">
                      ₦{(row.getValue('currentPrice') as number)?.toFixed(2)} 
                      {(row.getValue('currentPrice') as number) < row.original.basePrice && (
                        <span className="ml-2 text-xs text-red-500 line-through">₦{row.original.basePrice?.toFixed(2)}</span>
                      )}
                    </div>
                  ),
                  meta: { exportValue: (room: RoomResponse) => `₦${room.currentPrice?.toFixed(2)}` }
                },
                {
                  accessorKey: 'status',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
                  cell: ({ row }) => (
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full border ${
                        row.getValue('status') === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' :
                        row.getValue('status') === 'DIRTY' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        row.getValue('status') === 'OCCUPIED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {row.getValue('status') as string}
                      </span>
                      {!row.original.active && (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full border bg-gray-100 text-gray-600 border-gray-300">
                          Deactivated
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  id: 'actions',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
                  cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setEditingRoom(row.original)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Edit Room"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to ${row.original.active ? 'deactivate' : 'activate'} Room ${row.original.roomNumber}?`)) {
                            toggleActiveMutation.mutate(row.original.id);
                          }
                        }}
                        className={`p-1.5 rounded-md transition-colors ${row.original.active ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'}`}
                        title={row.original.active ? 'Deactivate Room' : 'Activate Room'}
                      >
                        {row.original.active ? <NoSymbolIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  )
                }
              ]}
              isLoading={isLoading}
              emptyMessage="No rooms configured yet."
              filename={`rooms-${new Date().toISOString().split('T')[0]}.csv`}
            />
          </div>
        </div>
      </div>

      {/* Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Room</h3>
            {editError && <div className="text-red-600 text-sm mb-6 p-3 bg-red-50 rounded-lg">{editError}</div>}
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input 
                  type="text" 
                  required 
                  value={editingRoom.roomNumber} 
                  onChange={e => setEditingRoom({...editingRoom, roomNumber: e.target.value})} 
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select 
                  required 
                  value={editingRoom.roomType} 
                  onChange={e => setEditingRoom({...editingRoom, roomType: e.target.value})} 
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                >
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₦)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  required 
                  value={editingRoom.basePrice} 
                  onChange={e => setEditingRoom({...editingRoom, basePrice: parseFloat(e.target.value) || 0})} 
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white" 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => { setEditingRoom(null); setEditError(null); }} 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateRoomMutation.isPending} 
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {updateRoomMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
