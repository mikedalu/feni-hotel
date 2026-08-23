import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { RoomTypeResponse, RoomTypeRequest } from '@/types/room';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface RoomTypesModalProps {
  onClose: () => void;
}

export default function RoomTypesModal({ onClose }: RoomTypesModalProps) {
  const queryClient = useQueryClient();
  const [newRoomType, setNewRoomType] = useState<RoomTypeRequest>({ name: '', basePrice: 0 });
  const [editingType, setEditingType] = useState<RoomTypeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: roomTypes = [], isLoading } = useQuery<RoomTypeResponse[]>({
    queryKey: ['roomTypes'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/room-types');
      if (!res.ok) throw new Error('Failed to fetch room types');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: RoomTypeRequest) => {
      const res = await apiClient('/api/proxy/admin/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to create room type');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes'] });
      setNewRoomType({ name: '', basePrice: 0 });
      setError(null);
    },
    onError: (err: unknown) => {
      if (err instanceof Error) setError(err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: RoomTypeResponse) => {
      const res = await apiClient(`/api/proxy/admin/room-types/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload.name, basePrice: payload.basePrice }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to update room type');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes'] });
      setEditingType(null);
      setError(null);
    },
    onError: (err: unknown) => {
      if (err instanceof Error) setError(err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/api/proxy/admin/room-types/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete room type');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes'] });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newRoomType);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate(editingType);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Manage Room Types</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="text-red-600 text-sm mb-6 p-3 bg-red-50 rounded-lg">{error}</div>}
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{editingType ? 'Edit Room Type' : 'Add New Room Type'}</h4>
            <form onSubmit={editingType ? handleUpdate : handleCreate} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 mb-1">Type Name</label>
                <input 
                  type="text" 
                  required 
                  value={editingType ? editingType.name : newRoomType.name} 
                  onChange={e => editingType ? setEditingType({...editingType, name: e.target.value}) : setNewRoomType({...newRoomType, name: e.target.value})} 
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white" 
                  placeholder="e.g. Standard"
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">Base Price (₦)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  required 
                  value={editingType ? editingType.basePrice : newRoomType.basePrice || ''} 
                  onChange={e => editingType ? setEditingType({...editingType, basePrice: parseFloat(e.target.value) || 0}) : setNewRoomType({...newRoomType, basePrice: parseFloat(e.target.value) || 0})} 
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white" 
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {editingType && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingType(null); setError(null); }} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending} 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex-1 sm:flex-none whitespace-nowrap"
                >
                  {editingType ? 'Save Changes' : 'Add Type'}
                </button>
              </div>
            </form>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : roomTypes.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No room types found.</td></tr>
                ) : (
                  roomTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₦{type.basePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => setEditingType(type)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <PencilSquareIcon className="w-5 h-5 inline-block" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${type.name}?`)) {
                              deleteMutation.mutate(type.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-5 h-5 inline-block" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
