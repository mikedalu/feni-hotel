'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Product, ProductType, RevenueCenter } from '@/types/product';

import { DataTable } from '@/components/ui/DataTable';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    type: 'RAW_GOOD',
    revenueCenter: 'BAR',
    internalSku: '',
    manufacturerBarcode: '',
    stockQty: 0,
    lowStockThreshold: 5,
    price: 0,
    unitCost: 0,
  });

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        type: 'RAW_GOOD',
        revenueCenter: 'BAR',
        internalSku: '',
        manufacturerBarcode: '',
        stockQty: 0,
        lowStockThreshold: 5,
        price: 0,
        unitCost: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/proxy/products/${editingProduct.id}` : '/api/proxy/products';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await apiClient(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save product');
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading products...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products Catalog</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          data={products}
          columns={[
            {
              accessorKey: 'internalSku',
              header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
              meta: { className: 'font-mono text-sm' }
            },
            {
              accessorKey: 'name',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
              meta: { className: 'font-medium' }
            },
            {
              accessorKey: 'type',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
              meta: { className: 'text-sm text-gray-600' }
            },
            {
              accessorKey: 'revenueCenter',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Revenue Center" />,
              meta: { className: 'text-sm text-gray-600' }
            },
            {
              accessorKey: 'price',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
              cell: ({ row }) => `$${(row.getValue('price') as number).toFixed(2)}`,
              meta: { exportValue: (p: Product) => `$${p.price.toFixed(2)}` }
            },
            {
              accessorKey: 'stockQty',
              header: ({ column }) => <DataTableColumnHeader column={column} title="Stock (Threshold)" />,
              cell: ({ row }) => (
                row.getValue('type') === 'RAW_GOOD' ? (
                  <span className={`font-semibold ${(row.original.stockQty ?? 0) <= (row.original.lowStockThreshold ?? 0) ? 'text-red-600' : 'text-gray-900'}`}>
                    {row.original.stockQty} <span className="text-gray-400 font-normal text-xs">({row.original.lowStockThreshold})</span>
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm italic">N/A</span>
                )
              ),
              meta: { exportValue: (p: Product) => p.type === 'RAW_GOOD' ? `${p.stockQty} (${p.lowStockThreshold})` : 'N/A' }
            },
            {
              id: 'actions',
              header: 'Actions',
              meta: { headerClassName: 'text-right', className: 'text-right' },
              cell: ({ row }) => (
                <div className="flex justify-end">
                  <button 
                    onClick={() => handleOpenModal(row.original)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              )
            }
          ]}
          isLoading={loading}
          emptyMessage="No products found. Add one to get started."
          filename={`products-${new Date().toISOString().split('T')[0]}.csv`}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal SKU</label>
                  <input required type="text" value={formData.internalSku} onChange={e => setFormData({...formData, internalSku: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ProductType})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="RAW_GOOD">RAW_GOOD</option>
                    <option value="PREPARED_DISH">PREPARED_DISH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Center</label>
                  <select value={formData.revenueCenter} onChange={e => setFormData({...formData, revenueCenter: e.target.value as RevenueCenter})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="BAR">BAR</option>
                    <option value="KITCHEN">KITCHEN</option>
                    <option value="ROOMS">ROOMS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Barcode (Optional)</label>
                <input type="text" value={formData.manufacturerBarcode || ''} onChange={e => setFormData({...formData, manufacturerBarcode: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Selling)</label>
                  <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                  <input required type="number" step="0.01" min="0" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>

              {formData.type === 'RAW_GOOD' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <input required type="number" min="0" value={formData.stockQty || 0} onChange={e => setFormData({...formData, stockQty: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                    <input required type="number" min="0" value={formData.lowStockThreshold || 0} onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
