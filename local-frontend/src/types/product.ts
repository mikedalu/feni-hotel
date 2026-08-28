export type ProductType = 'RAW_GOOD' | 'PREPARED_DISH';
export type RevenueCenter = 'ROOMS' | 'BAR' | 'KITCHEN' | 'OTHER';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  revenueCenter: RevenueCenter;
  manufacturerBarcode?: string;
  internalSku: string;
  stockQty?: number;
  lowStockThreshold?: number;
  price: number;
  unitCost: number;
  baseUnit?: string;
  bulkUnit?: string;
  conversionRatio?: number;
  taxBracketIds?: string[];
  taxBrackets?: { id: string; name: string; rate: number; isActive: boolean }[];
  imageUrl?: string;
  inventoryStocks?: { id: string; quantity: number; locationId: string; locationName: string; }[];
}
