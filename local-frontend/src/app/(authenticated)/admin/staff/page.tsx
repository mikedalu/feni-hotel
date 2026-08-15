'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import ProtectedRoute from '@/components/ProtectedRoute';
import { StaffUser, CreateStaffUserRequest } from '@/types/admin';
import CreateStaffModal from '@/components/admin/CreateStaffModal';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';
import { PlusIcon, KeyIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<StaffUser | null>(null);

  const { data: staffList = [], isLoading, error } = useQuery<StaffUser[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    }
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: CreateStaffUserRequest) => {
      const res = await apiClient('/api/proxy/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || 'Failed to create staff');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsCreateModalOpen(false);
    }
  });

  const deactivateStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/api/proxy/admin/staff/${id}/deactivate`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to deactivate staff');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string, newPassword: string }) => {
      const res = await apiClient(`/api/proxy/admin/staff/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordUser(null);
    }
  });

  const handleCreateSubmit = async (data: CreateStaffUserRequest) => {
    await createStaffMutation.mutateAsync(data);
  };

  const handleResetSubmit = async (id: string, newPassword: string) => {
    await resetPasswordMutation.mutateAsync({ id, newPassword });
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Staff Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage local facility access and roles</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Staff
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
            Error loading staff list. Please try again.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <DataTable
            data={staffList}
            columns={[
              {
                accessorKey: 'username',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
                cell: ({ row }) => <div className="text-sm font-medium text-gray-900">{row.getValue('username')}</div>
              },
              {
                accessorKey: 'role',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
                cell: ({ row }) => (
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {row.getValue('role')}
                  </span>
                )
              },
              {
                accessorKey: 'active',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
                cell: ({ row }) => (
                  row.getValue('active') ? (
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Deactivated
                    </span>
                  )
                ),
                meta: { exportValue: (staff: StaffUser) => staff.active ? 'Active' : 'Deactivated' }
              },
              {
                id: 'actions',
                header: 'Actions',
                meta: { headerClassName: 'text-right', className: 'text-right' },
                cell: ({ row }) => {
                  const staff = row.original;
                  return (
                    <div className="flex justify-end gap-3">
                      {staff.active && (
                        <button
                          onClick={() => setResetPasswordUser(staff)}
                          className="text-amber-600 hover:text-amber-900 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Reset Pass</span>
                        </button>
                      )}
                      {staff.active && staff.username !== 'admin' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to deactivate ${staff.username}?`)) {
                              deactivateStaffMutation.mutate(staff.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <NoSymbolIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Deactivate</span>
                        </button>
                      )}
                    </div>
                  )
                }
              }
            ]}
            isLoading={isLoading}
            emptyMessage="No staff users found."
            filename={`staff-list-${new Date().toISOString().split('T')[0]}.csv`}
          />
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateStaffModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          isSubmitting={createStaffMutation.isPending}
        />
      )}

      {resetPasswordUser && (
        <ResetPasswordModal
          user={resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          onSubmit={handleResetSubmit}
          isSubmitting={resetPasswordMutation.isPending}
        />
      )}

    </ProtectedRoute>
  );
}
