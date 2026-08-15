'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BookingResponse, ChangeRoomRequest } from '@/types/booking';
import Link from 'next/link';
import { PlusIcon, QrCodeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ChangeRoomModal from '@/components/reception/ChangeRoomModal';
import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';

export default function ReceptionDashboardPage() {
  const queryClient = useQueryClient();
  const [changingRoomFor, setChangingRoomFor] = React.useState<BookingResponse | null>(null);

  const { data: bookings = [], isLoading, error } = useQuery<BookingResponse[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiClient(`/api/proxy/bookings/${bookingId}/checkout`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to checkout booking');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const changeRoomMutation = useMutation({
    mutationFn: async (data: ChangeRoomRequest) => {
      if (!changingRoomFor) return;
      const res = await apiClient(`/api/proxy/bookings/${changingRoomFor.id}/change-room`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to change room');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setChangingRoomFor(null);
    },
  });

  const downloadDssMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient(`/api/proxy/reports/shift-summary/generate`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to generate DSS report');
      }
      const data = await res.json();
      
      const proxyUrl = data.downloadUrl.replace('/api/', '/api/proxy/');
      
      const fileRes = await apiClient(proxyUrl);
      if (!fileRes.ok) throw new Error('Failed to download DSS report');
      
      const blob = await fileRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DSS-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  });

  const downloadInvoiceMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiClient(`/api/proxy/reports/booking-invoice/${bookingId}/generate`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to generate invoice');
      }
      const data = await res.json();
      
      const proxyUrl = data.downloadUrl.replace('/api/', '/api/proxy/');
      
      const fileRes = await apiClient(proxyUrl);
      if (!fileRes.ok) throw new Error('Failed to download invoice');
      
      const blob = await fileRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  });

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FRONT_DESK']}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Reception Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Manage current bookings and guest check-ins</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => downloadDssMutation.mutate()}
              disabled={downloadDssMutation.isPending}
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <DocumentTextIcon className="h-5 w-5" />
              {downloadDssMutation.isPending ? 'Generating...' : 'Daily DSS Report'}
            </button>
            
            <Link
              href="/reception/manual-booking"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Walk-in / Manual Booking
            </Link>
            
            <Link
              href="/reception/checkin"
              className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl font-semibold shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <QrCodeIcon className="h-5 w-5" />
              Self Check-in Portal
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
            Error loading bookings. Please try again.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <DataTable
            data={bookings}
            columns={[
              {
                accessorKey: 'guestFirstName', // For sorting purposes, we can pick one key
                header: ({ column }) => <DataTableColumnHeader column={column} title="Guest" />,
                cell: ({ row }) => (
                  <>
                    <div className="text-sm font-medium text-gray-900">
                      {row.original.guestFirstName} {row.original.guestLastName}
                    </div>
                    <div className="text-xs text-gray-500">{row.original.guestPhone}</div>
                  </>
                ),
                meta: { exportValue: (booking: BookingResponse) => `${booking.guestFirstName} ${booking.guestLastName}` }
              },
              {
                accessorKey: 'roomNumber',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Room" />,
                cell: ({ row }) => (
                  <>
                    <div className="text-sm font-medium text-gray-900">{row.original.roomNumber}</div>
                    <div className="text-xs text-gray-500">{row.original.roomType}</div>
                  </>
                ),
                meta: { exportValue: (booking: BookingResponse) => booking.roomNumber }
              },
              {
                accessorKey: 'checkInDate',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Dates" />,
                cell: ({ row }) => (
                  <div className="text-sm text-gray-900">{row.original.checkInDate} to {row.original.checkOutDate}</div>
                ),
                meta: { exportValue: (booking: BookingResponse) => `${booking.checkInDate} to ${booking.checkOutDate}` }
              },
              {
                accessorKey: 'status',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
                cell: ({ row }) => (
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    row.getValue('status') === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                    row.getValue('status') === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-800' :
                    row.getValue('status') === 'RESERVED' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {(row.getValue('status') as string) || 'CHECKED_IN'}
                  </span>
                )
              },
              {
                id: 'actions',
                header: 'Actions',
                meta: { headerClassName: 'text-right', className: 'text-right' },
                cell: ({ row }) => {
                  const booking = row.original;
                  return (
                    <div className="flex justify-end gap-3">
                      {booking.status === 'CHECKED_IN' && (
                        <>
                          <button
                            onClick={() => setChangingRoomFor(booking)}
                            className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                          >
                            Change Room
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to checkout this booking?')) {
                                checkoutMutation.mutate(booking.id);
                              }
                            }}
                            disabled={checkoutMutation.isPending}
                            className="text-indigo-600 hover:text-indigo-900 font-medium text-sm disabled:opacity-50"
                          >
                            Checkout
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => downloadInvoiceMutation.mutate(booking.id)}
                        disabled={downloadInvoiceMutation.isPending}
                        className="text-green-600 hover:text-green-900 font-medium text-sm disabled:opacity-50"
                      >
                        Download Invoice
                      </button>
                    </div>
                  )
                }
              }
            ]}
            isLoading={isLoading}
            emptyMessage="No bookings found."
            filename={`bookings-${new Date().toISOString().split('T')[0]}.csv`}
          />
        </div>

        {changingRoomFor && (
          <ChangeRoomModal
            booking={changingRoomFor}
            onClose={() => setChangingRoomFor(null)}
            onSubmit={async (data) => {
              await changeRoomMutation.mutateAsync(data);
            }}
            isSubmitting={changeRoomMutation.isPending}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}
