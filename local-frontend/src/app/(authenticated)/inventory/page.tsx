'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Product } from '@/types/product';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Intake cart state
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [printerIp, setPrinterIp] = useState('');
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/api/proxy/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processScan = (barcode: string) => {
    const product = products.find(p => p.manufacturerBarcode === barcode || p.internalSku === barcode);
    if (product) {
      if (product.type !== 'RAW_GOOD') {
        alert('Cannot intake non-raw goods.');
        return;
      }
      addToCart(product);
    } else {
      alert(`Barcode not found: ${barcode}`);
    }
  }

  useBarcodeScanner({
    onScan: processScan
  });
  

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
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
          items: cart.map(item => ({ internalSku: item.product.internalSku, quantity: item.quantity })),
          printerIp: printerIp.trim() || null
        })
      });

      if (!res.ok) throw new Error('Intake failed');
      
      alert('Inventory intake completed successfully');
      setCart([]);
      fetchProducts(); // Refresh stock quantities
    } catch (err: any) {
      alert(err.message);
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
      
    } catch (err: any) {
      console.log(err, "Error downloading pdf")
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading inventory data...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Intake Cart */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Inventory Intake</h2>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Scanner Ready
            </div>
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
                    <input 
                      type="number" 
                      min="1" 
                      value={row.original.quantity} 
                      onChange={e => updateQuantity(row.original.product.id, parseInt(e.target.value))}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                    />
                  )
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
                onClick={() => addToCart(p)}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-semibold text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">Stock: {p.stockQty}</div>
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
