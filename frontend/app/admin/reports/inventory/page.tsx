import React from 'react';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';

// Initialize Prisma

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

export default async function InventoryReportPage() {
  const products = await prisma.product.findMany({
    where: { type: 'RAW_GOOD' },
    orderBy: { name: 'asc' },
  });

  const lowStockProducts = products.filter(
    (p: any) => p.lowStockThreshold !== null && p.stockQty !== null && p.stockQty <= p.lowStockThreshold
  );

  const totalInventoryValue = products.reduce((acc: any, p: any) => {
    return acc + (Number(p.cost) * (p.stockQty || 0));
  }, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory Levels</h1>
          <p className="text-gray-500 mt-1">Hotel stock and value report</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Items</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Inventory Value</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider">Low Stock Alerts</h3>
          </div>
          <p className="text-3xl font-bold text-red-700 mt-2">{lowStockProducts.length}</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              Inventory data is completely synced from the local facility. Wait for Feni Hotel to sync its inventory data up to the cloud.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Product</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">SKU</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock Qty</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Unit Cost</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Value</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product: any) => {
                    const isLowStock = product.lowStockThreshold !== null && product.stockQty !== null && product.stockQty <= product.lowStockThreshold;
                    const value = Number(product.cost) * (product.stockQty || 0);

                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-flex">
                            {product.internalSku}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stockQty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          ${Number(product.cost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${value.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <TrendingDown className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Adequate
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-gray-50">
              {products.map((product: any) => {
                const isLowStock = product.lowStockThreshold !== null && product.stockQty !== null && product.stockQty <= product.lowStockThreshold;
                const value = Number(product.cost) * (product.stockQty || 0);

                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{product.name}</h4>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                          {product.internalSku}
                        </span>
                      </div>
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800">
                          Adequate
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-500">Qty</p>
                        <p className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{product.stockQty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unit Cost</p>
                        <p className="font-semibold text-gray-900">${Number(product.cost).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="font-semibold text-gray-900">${value.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
