'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import ProtectedRoute from '@/components/ProtectedRoute';
import { RoomResponse, RoomStatusUpdateRequest } from '@/types/room';
import { CheckCircleIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, HandRaisedIcon } from '@heroicons/react/24/outline';

export default function HousekeepingDashboard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');

  const { data: rooms = [], isLoading, error } = useQuery<RoomResponse[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/rooms');
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const payload: RoomStatusUpdateRequest = { status: status as 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'OUT_OF_ORDER' };
      const res = await apiClient(`/api/proxy/rooms/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update room status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const filteredRooms = filter === 'ALL' ? rooms : rooms.filter(r => r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
      case 'OCCUPIED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DIRTY': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OUT_OF_ORDER': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'OCCUPIED': return <HandRaisedIcon className="w-6 h-6 text-blue-600" />;
      case 'DIRTY': return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />;
      case 'OUT_OF_ORDER': return <WrenchScrewdriverIcon className="w-6 h-6 text-red-600" />;
      default: return null;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FRONT_DESK', 'HOUSEKEEPER']}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Housekeeping Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor room statuses and mark rooms as cleaned.</p>
          </div>
          
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {['ALL', 'DIRTY', 'AVAILABLE', 'OCCUPIED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
            Error loading rooms. Please check your connection.
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading rooms...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredRooms.map(room => (
              <div key={room.id} className={`relative rounded-2xl border p-6 flex flex-col items-center justify-between shadow-sm transition-all hover:shadow-md ${!room.active ? 'bg-gray-50 border-gray-300 opacity-60 grayscale' : getStatusColor(room.status)}`}>
                {!room.active && (
                  <div className="absolute top-2 right-2 bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Deactivated
                  </div>
                )}
                <div className="flex w-full justify-between items-start mb-4">
                  {getStatusIcon(room.status)}
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">{room.status}</span>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-4xl font-black">{room.roomNumber}</h3>
                  <p className="text-sm font-medium opacity-80 mt-1">{room.roomType}</p>
                </div>

                <div className="w-full flex flex-col gap-2">
                  {!room.active ? (
                    <div className="w-full text-center text-sm font-semibold text-gray-500 py-2 border border-transparent">
                      Inactive Room
                    </div>
                  ) : (
                    <>
                      {room.status === 'DIRTY' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: room.id, status: 'AVAILABLE' })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-white text-yellow-800 border border-yellow-300 rounded-lg py-2 text-sm font-bold shadow-sm hover:bg-yellow-50 transition-colors"
                        >
                          Mark as Clean
                        </button>
                      )}
                      {room.status === 'AVAILABLE' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: room.id, status: 'OUT_OF_ORDER' })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-white/50 text-green-800 border border-green-300/50 rounded-lg py-2 text-sm font-bold shadow-sm hover:bg-white transition-colors"
                        >
                          Report Issue
                        </button>
                      )}
                      {room.status === 'OUT_OF_ORDER' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: room.id, status: 'AVAILABLE' })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-white text-red-800 border border-red-300 rounded-lg py-2 text-sm font-bold shadow-sm hover:bg-red-50 transition-colors"
                        >
                          Mark Repaired
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
