'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { LedgerEntry } from '@/types/ledger';
import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';

const formatDate = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatExportDate = (isoString: string) => {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface TransactionRow {
  id: string;
  createdAt: string;
  entryType: string;
  referenceId: string;
  processedByUsername: string | null;
  totalAmount: number;
  paymentDetails: string;
}

export default function TransactionsPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', new Date(startDate).toISOString());
      if (endDate) queryParams.append('endDate', new Date(endDate).toISOString());

      const res = await apiClient(`/api/proxy/admin/ledger?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to load transaction data');
      const data = await res.json();
      setEntries(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load transaction data');
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, [fetchTransactions]);

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  // Group and map entries into transaction rows
  const transactionRows: TransactionRow[] = entries.map(entry => {
    // Total transaction volume is the sum of all debits
    const totalAmount = entry.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);

    // Extract payment lines (Debits representing incoming money or Credits for refunds)
    const paymentAccountPrefixes = ['Cash', 'Card Payments', 'Bank Transfers', 'Customer Deposits'];
    const paymentLines = entry.lines.filter(line => 
      paymentAccountPrefixes.some(prefix => line.accountName.startsWith(prefix))
    );

    let paymentDetails = 'N/A';
    if (paymentLines.length > 0) {
      paymentDetails = paymentLines.map(line => {
        const amount = line.debitAmount > 0 ? line.debitAmount : -line.creditAmount;
        return `${line.accountName}: ₦${amount.toFixed(2)}`;
      }).join(' | ');
    } else if (entry.entryType === 'INVENTORY_INTAKE') {
       paymentDetails = 'Accounts Payable';
    }

    return {
      id: entry.id,
      createdAt: entry.createdAt,
      entryType: entry.entryType,
      referenceId: entry.referenceId,
      processedByUsername: entry.processedByUsername,
      totalAmount,
      paymentDetails
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions & Payments</h1>
        <p className="text-gray-600 text-sm">A simplified, easy-to-digest view of business transactions and payments collected.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button 
          onClick={fetchTransactions}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          data={transactionRows}
          columns={[
            {
              accessorKey: 'createdAt',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
              cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{formatDate(row.getValue('createdAt'))}</span>,
              meta: { exportValue: (row: { createdAt: string }) => formatExportDate(row.createdAt) }
            },
            {
              accessorKey: 'entryType',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
              cell: ({ row }) => {
                 const type = row.getValue('entryType') as string;
                 let badgeClass = "bg-gray-100 text-gray-800";
                 if (type.includes('BOOKING')) badgeClass = "bg-blue-100 text-blue-800";
                 if (type.includes('POS')) badgeClass = "bg-purple-100 text-purple-800";
                 if (type.includes('INVENTORY')) badgeClass = "bg-orange-100 text-orange-800";
                 
                 return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass}`}>{type.replace(/_/g, ' ')}</span>;
              },
            },
            {
              accessorKey: 'totalAmount',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Total (₦)" />,
              cell: ({ row }) => <span className="text-sm font-bold text-gray-900">₦{(row.getValue('totalAmount') as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
              meta: { exportValue: (row: { totalAmount: number }) => row.totalAmount }
            },
            {
              accessorKey: 'paymentDetails',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Payment Breakdown" />,
              cell: ({ row }) => <span className="text-xs text-gray-600 font-medium">{row.getValue('paymentDetails')}</span>
            },
            {
              accessorKey: 'processedByUsername',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Staff" />,
              cell: ({ row }) => <span className="text-xs text-gray-500">{row.getValue('processedByUsername') || 'System'}</span>
            },
            {
              accessorKey: 'referenceId',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Ref ID" />,
              cell: ({ row }) => <span className="text-xs font-mono text-gray-400" title={row.getValue('referenceId') as string}>{(row.getValue('referenceId') as string).substring(0, 8)}...</span>,
              meta: { exportValue: (row: { referenceId: string }) => row.referenceId }
            }
          ]}
          isLoading={loading}
          emptyMessage="No transactions found for the selected criteria."
          filename={`transactions-summary-${new Date().toISOString().split('T')[0]}.csv`}
        />
      </div>
    </div>
  );
}
