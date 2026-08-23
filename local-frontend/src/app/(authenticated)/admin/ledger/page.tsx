'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { LedgerEntry } from '@/types/ledger';
import toast, { Toaster } from 'react-hot-toast';

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

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPnl, setGeneratingPnl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [accountName, setAccountName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (accountName) queryParams.append('accountName', accountName);
      if (startDate) queryParams.append('startDate', new Date(startDate).toISOString());
      if (endDate) queryParams.append('endDate', new Date(endDate).toISOString());

      const res = await apiClient(`/api/proxy/admin/ledger?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to load ledger data');
      const data = await res.json();
      setEntries(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load ledger data');
      }
    } finally {
      setLoading(false);
    }
  }, [accountName, startDate, endDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLedger();
  }, [fetchLedger]);

  const generatePnlReport = async () => {
    try {
      setGeneratingPnl(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await apiClient(`/api/proxy/reports/pnl/generate?${queryParams.toString()}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to generate P&L report');
      const data = await res.json();
      
      const proxyUrl = data.downloadUrl.replace('/api/', '/api/proxy/');
      
      const fileRes = await apiClient(proxyUrl);
      if (!fileRes.ok) throw new Error('Failed to download P&L report');
      
      const blob = await fileRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PnL-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('P&L Report generated successfully');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Failed to generate P&L report');
      }
    } finally {
      setGeneratingPnl(false);
    }
  };

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  // Flatten entries for the table
  const flattenedData = entries.flatMap(entry => 
    entry.lines.map(line => ({
      ...line,
      entryId: entry.id,
      entryType: entry.entryType,
      referenceId: entry.referenceId,
      processedByUsername: entry.processedByUsername,
      createdAt: entry.createdAt
    }))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">General Ledger Viewer</h1>
          <p className="text-gray-600 text-sm">View raw double-entry accounting data across the facility.</p>
        </div>
        <button
          onClick={generatePnlReport}
          disabled={generatingPnl}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {generatingPnl ? 'Generating...' : 'Generate P&L Report'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
          <select 
            value={accountName} 
            onChange={(e) => setAccountName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-48 text-sm"
          >
            <option value="">All Accounts</option>
            <option value="Sales Revenue">Sales Revenue</option>
            <option value="Inventory Asset">Inventory Asset</option>
            <option value="Cost of Goods Sold">Cost of Goods Sold</option>
            <option value="Cash">Cash</option>
            <option value="Accounts Payable">Accounts Payable</option>
          </select>
        </div>
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
          onClick={fetchLedger}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          data={flattenedData}
          columns={[
            {
              accessorKey: 'createdAt',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
              cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('createdAt'))}</span>,
              meta: { exportValue: (row: { createdAt: string }) => formatExportDate(row.createdAt) }
            },
            {
              accessorKey: 'entryType',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Entry Type" />,
              meta: { className: 'text-sm font-medium text-gray-700' }
            },
            {
              accessorKey: 'accountName',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Account" />,
              meta: { className: 'text-sm font-semibold text-gray-900' }
            },
            {
              accessorKey: 'debitAmount',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Debit (₦)" />,
              cell: ({ row }) => {
                const amount = row.getValue('debitAmount') as number;
                return amount > 0 ? <span className="text-sm font-medium text-emerald-700">₦{amount.toFixed(2)}</span> : <span className="text-sm text-gray-300">-</span>;
              },
              meta: { exportValue: (row: { debitAmount: number }) => row.debitAmount }
            },
            {
              accessorKey: 'creditAmount',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Credit (₦)" />,
              cell: ({ row }) => {
                const amount = row.getValue('creditAmount') as number;
                return amount > 0 ? <span className="text-sm font-medium text-rose-700">₦{amount.toFixed(2)}</span> : <span className="text-sm text-gray-300">-</span>;
              },
              meta: { exportValue: (row: { creditAmount: number }) => row.creditAmount }
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
          emptyMessage="No ledger entries found for the selected criteria."
          filename={`general-ledger-${new Date().toISOString().split('T')[0]}.csv`}
        />
      </div>
    </div>
  );
}
