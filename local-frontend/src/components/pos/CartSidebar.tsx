import { CartItem } from "@/types/pos";
import { useState, useEffect } from "react";

interface CartSidebarProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (paymentMethod: "CASH" | "POS" | "TRANSFER", printerIp: string) => Promise<void>;
  onPrintPreReceipt: (printerIp: string) => Promise<void>;
  onDownloadInvoice: () => Promise<void>;
  isProcessing: boolean;
}

export default function CartSidebar({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onPrintPreReceipt,
  onDownloadInvoice,
  isProcessing
}: CartSidebarProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "POS" | "TRANSFER">("CASH");
  const [printerIp, setPrinterIp] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("feni_pos_printer_ip") || "";
    }
    return "";
  });

  const handlePrinterIpChange = (val: string) => {
    setPrinterIp(val);
    localStorage.setItem("feni_pos_printer_ip", val);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  return (
    <div className="flex flex-col h-full bg-white border-l shadow-xl w-full max-w-md">
      <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Current Order
        </h2>
        <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-bold">
          {itemCount} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-lg">Cart is empty</p>
            <p className="text-sm text-gray-400 text-center mt-2">
              Scan a barcode or tap a product to add items
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl border items-center shadow-sm">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                <p className="text-sm text-gray-500 font-medium">
                  ₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
                <button 
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md font-bold text-gray-600 transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-gray-900">
                  {item.cartQuantity}
                </span>
                <button 
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md font-bold text-gray-600 transition-colors"
                >
                  +
                </button>
              </div>
              
              <div className="text-right ml-2 min-w-[80px]">
                <p className="font-bold text-gray-900">
                  ₦{(item.price * item.cartQuantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <button 
                  onClick={() => onRemoveItem(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium mt-1 flex items-center justify-end w-full"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4 bg-gray-50 space-y-4">
        {cart.length > 0 && (
          <button 
            onClick={onClearCart}
            className="w-full text-center text-sm font-medium text-red-500 hover:text-red-700 p-2"
          >
            Clear Cart
          </button>
        )}

        <div className="flex justify-between items-center text-xl font-bold text-gray-900">
          <span>Total:</span>
          <span className="text-2xl text-blue-600">
            ₦{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 block">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {(["CASH", "POS", "TRANSFER"] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-3 rounded-lg font-bold text-sm transition-colors ${
                  paymentMethod === method 
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2" 
                    : "bg-white border-2 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 block">Printer IP (Optional)</label>
          <input 
            type="text" 
            placeholder="192.168.1.100" 
            value={printerIp}
            onChange={(e) => handlePrinterIpChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => onCheckout(paymentMethod, printerIp)}
          disabled={cart.length === 0 || isProcessing}
          className={`
            w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg
            ${cart.length === 0 || isProcessing
              ? "bg-gray-400 cursor-not-allowed shadow-none"
              : "bg-green-600 hover:bg-green-700 hover:-translate-y-1 active:translate-y-0"
            }
          `}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Sale...
            </span>
          ) : (
            `Charge ₦${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          )}
        </button>

        <button
          onClick={() => onPrintPreReceipt(printerIp)}
          disabled={cart.length === 0 || !printerIp || isProcessing}
          className={`
            w-full py-3 rounded-xl font-bold text-gray-700 border-2 transition-all
            ${cart.length === 0 || !printerIp || isProcessing
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }
          `}
        >
          Print Bill (Receipt)
        </button>

        <button
          onClick={onDownloadInvoice}
          disabled={cart.length === 0 || isProcessing}
          className={`
            w-full py-3 rounded-xl font-bold text-gray-700 border-2 transition-all
            ${cart.length === 0 || isProcessing
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }
          `}
        >
          Download Invoice (PDF)
        </button>
      </div>
    </div>
  );
}
