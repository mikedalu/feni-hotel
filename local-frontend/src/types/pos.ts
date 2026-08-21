export interface Product {
  id: string;
  name: string;
  category: string;
  productType: "RAW_GOOD" | "PREPARED_DISH";
  price: number;
  internalSku: string;
  hasManufacturerBarcode: boolean;
  stockQty?: number;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface PosSaleRequest {
  items: {
    skuOrBarcode: string;
    quantity: number;
  }[];
  paymentMethod: "CASH" | "POS" | "TRANSFER";
  printerIp?: string;
}
