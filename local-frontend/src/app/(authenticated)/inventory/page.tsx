'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Product } from '@/types/product';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';
import toast, { Toaster } from 'react-hot-toast';
import { QrCodeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Intake cart state
  const [cart, setCart] = useState<{ product: Product, quantity: number, isBulkIntake?: boolean, totalCost?: number | '' }[]>([]);
  const [printerIp, setPrinterIp] = useState('');
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/api/proxy/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const processScan = (barcode: string) => {
    const product = products.find(p => p.manufacturerBarcode === barcode || p.internalSku === barcode);
    if (product) {
      if (product.type !== 'RAW_GOOD') {
        toast.error('Cannot intake non-raw goods.');
        return;
      }
      addToCart(product);
      toast.success(`Scanned ${product.name}`);
    } else {
      toast.error(`Barcode not found: ${barcode}`);
    }
  }

  useBarcodeScanner({
    onScan: processScan
  });
  

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, isBulkIntake: false, totalCost: '' }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: qty } : item));
  };

  const handleIntake = async () => {
    if (cart.length === 0) return;

    try {
      const res = await apiClient('/api/proxy/inventory/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({ 
            internalSku: item.product.internalSku, 
            quantity: item.quantity,
            isBulkIntake: item.isBulkIntake,
            totalCost: item.totalCost === '' ? null : item.totalCost
          })),
          printerIp: printerIp.trim() || null
        })
      });

      if (!res.ok) throw new Error('Intake failed');
      
      toast.success('Inventory intake completed successfully');
      setCart([]);
      fetchProducts(); // Refresh stock quantities
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An error occurred');
      }
    }
  };

  const handleDownloadReport = async () => {
    try {
      // 1. Generate the report (returns the download URL)
      const res = await apiClient('/api/proxy/reports/inventory/generate', {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      
      // 2. Fetch the actual PDF using apiClient (so the auth token is included)
      const downloadUrl = data.downloadUrl.replace('/api/reports', '/api/proxy/reports');
      const pdfRes = await apiClient(downloadUrl);
      if (!pdfRes.ok) throw new Error('Failed to download report PDF');
      
      const blob = await pdfRes.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      // 3. Trigger a hidden download link
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = data.downloadUrl.split('/').pop() || 'inventory-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An error occurred');
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading inventory data...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Toaster position="top-right" />
      {/* Left Column: Intake Cart */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Scanner helper card */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <QrCodeIcon className="w-48 h-48" />
          </div>
          <h3 className="text-xl font-bold mb-2 relative z-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Scanner Ready
          </h3>
          <p className="text-indigo-100 text-sm relative z-10 max-w-md">
            Ensure focus is outside of input fields. You can start scanning barcodes with your hardware scanner now.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCartIcon className="w-6 h-6 text-indigo-600" />
              Intake Cart
            </h2>
          </div>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <DataTable
              data={cart}
              columns={[
                { 
                  accessorKey: 'product.name',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
                  meta: { className: 'font-medium' }
                },
                { 
                  accessorKey: 'product.internalSku',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
                  meta: { className: 'text-gray-500 font-mono text-sm' }
                },
                {
                  accessorKey: 'quantity',
                  header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
                  cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" 
                        value={row.original.quantity} 
                        onChange={e => updateQuantity(row.original.product.id, parseInt(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                      />
                    </div>
                  )
                },
                {
                  id: 'uom',
                  header: 'Intake Mode',
                  cell: ({ row }) => {
                    const item = row.original;
                    return (
                      <div className="flex flex-col gap-1">
                        <select 
                          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                          value={item.isBulkIntake ? 'bulk' : 'base'}
                          onChange={e => {
                            const isBulk = e.target.value === 'bulk';
                            setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, isBulkIntake: isBulk } : i));
                          }}
                        >
                          <option value="base">{item.product.baseUnit || 'Base Unit'}</option>
                          <option value="bulk">{item.product.bulkUnit || 'Bulk Unit'} (x{item.product.conversionRatio || 1})</option>
                        </select>
                        {item.isBulkIntake && (
                          <div className="flex flex-col gap-1">
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder={`Total Cost per ${item.product.bulkUnit || 'Bulk Unit'} (₦)`}
                              value={item.totalCost}
                              onChange={e => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, totalCost: val } : i));
                              }}
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full placeholder:text-xs"
                              title={`Optional: Enter the total cost paid for one ${item.product.bulkUnit || 'bulk unit'} to recalculate unit cost.`}
                            />
                            {item.totalCost !== '' && item.totalCost !== undefined && item.product.conversionRatio && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                ≈ ₦{(item.totalCost / item.product.conversionRatio).toFixed(2)} per {item.product.baseUnit || 'unit'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                },
                {
                  id: 'action',
                  header: 'Action',
                  meta: { headerClassName: 'text-right', className: 'text-right' },
                  cell: ({ row }) => (
                    <div className="flex justify-end">
                      <button 
                        onClick={() => removeFromCart(row.original.product.id)} 
                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )
                }
              ]}
              emptyMessage="Scan items or select from the catalog to begin intake."
              filename={`inventory-intake-${new Date().toISOString().split('T')[0]}.csv`}
            />
          </div>

          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Printer IP (for SKU labels)" 
              value={printerIp}
              onChange={e => setPrinterIp(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition-colors"
            />
            <button 
              onClick={handleIntake}
              disabled={cart.length === 0}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Complete Intake
            </button>
          </div>
        </div>

        {/* Product Catalog Reference */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Manual Selection</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.filter(p => p.type === 'RAW_GOOD').map(p => (
              <button
                key={p.id}
                onClick={() => {
                  addToCart(p);
                  toast.success(`Added ${p.name}`);
                }}
                className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md text-left transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/50 transition-colors" />
                <div className="relative z-10">
                  <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{p.internalSku}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      Stock: {p.stockQty}
                    </span>
                    <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      + Add
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Actions & Reports */}
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg text-white">
          <h2 className="text-xl font-bold mb-2">Inventory Report</h2>
          <p className="text-gray-400 text-sm mb-6">
            Generate a full report of current stock levels, low-stock alerts, and total inventory valuation.
          </p>
          <button 
            onClick={handleDownloadReport}
            className="w-full py-3 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl shadow-sm transition-colors"
          >
            Download PDF Report
          </button>
        </div>

        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
          <h3 className="text-orange-800 font-bold mb-4">Low Stock Alerts</h3>
          <ul className="space-y-3">
            {products
              .filter(p => p.type === 'RAW_GOOD' && p.stockQty !== undefined && p.lowStockThreshold !== undefined && p.stockQty <= p.lowStockThreshold)
              .map(p => (
                <li key={p.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-orange-600 font-bold">{p.stockQty} left</span>
                </li>
              ))}
            {products.filter(p => p.type === 'RAW_GOOD' && p.stockQty !== undefined && p.lowStockThreshold !== undefined && p.stockQty <= p.lowStockThreshold).length === 0 && (
              <li className="text-sm text-gray-500 italic">No low stock items.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
  
}
