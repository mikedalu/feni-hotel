"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, CartItem, PosSaleRequest } from "@/types/pos";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import ProductGrid from "@/components/pos/ProductGrid";
import CartSidebar from "@/components/pos/CartSidebar";
import CheckoutModal from "@/components/pos/CheckoutModal";
import { apiClient } from "@/lib/apiClient";
import toast, { Toaster } from "react-hot-toast";

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
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

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient("/api/proxy/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      
      // Map revenueCenter to category for UI
      return data.map((p: Product & { revenueCenter: string }) => ({
        ...p,
        category: p.revenueCenter === "BAR" ? "Drinks" : p.revenueCenter === "KITCHEN" ? "Kitchen" : "Other"
      }));
    }
  });

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQuantity };
      }
      return item;
    }).filter(item => item.cartQuantity > 0));
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Handle barcode scanning
  useBarcodeScanner({
    onScan: (barcode) => {
      // In a real scenario, the barcode is either the internalSku or the manufacturer barcode.
      // Here we just use internalSku as a proxy for the barcode string for mock purposes.
      const product = products.find(p => p.internalSku === barcode);
      if (product) {
        addToCart(product);
        toast.success(`Added ${product.name} to cart`);
      } else {
        toast.error(`Product not found for barcode: ${barcode}`);
      }
    }
  });

  const handleCheckout = async (splitTenders: { paymentMethod: string; amount: number; smartPosTerminalId?: string }[], selectedPrinterIp: string) => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const request = {
      items: cart.map(item => ({
        skuOrBarcode: item.internalSku,
        quantity: item.cartQuantity
      })),
      splitTenders,
      printerIp: selectedPrinterIp.trim() || undefined
    };

    try {
      const res = await apiClient("/api/proxy/pos/sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        let errorMsg = "Checkout failed";
        try {
          const errData = await res.json();
          if (errData && errData.message) {
            errorMsg = errData.message;
          }
        } catch {
          // ignore parsing error if it's not JSON
        }
        throw new Error(errorMsg);
      }
      
      setCart([]);
      setIsCheckoutModalOpen(false);
      toast.success("Sale completed successfully!");
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to complete sale.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintPreReceipt = async (printerIp: string) => {
    if (cart.length === 0 || !printerIp) return;
    setIsProcessing(true);
    
    try {
      const request: PosSaleRequest = {
        items: cart.map(item => ({
          skuOrBarcode: item.internalSku,
          quantity: item.cartQuantity
        })),
        paymentMethod: "CASH", // Not used for printing, but required by DTO
        printerIp: printerIp.trim()
      };

      const res = await apiClient("/api/proxy/pos/print-pre-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        let errorMsg = "Failed to print pre-receipt";
        try {
          const errData = await res.json();
          if (errData && errData.message) {
            errorMsg = errData.message;
          }
        } catch {}
        throw new Error(errorMsg);
      }
      
      toast.success("Bill sent to printer successfully!");
    } catch (err: unknown) {
      console.error("Print bill error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to print bill");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const request = {
      items: cart.map(item => ({
        skuOrBarcode: item.internalSku,
        quantity: item.cartQuantity
      })),
      paymentMethod: "CASH", // Required by DTO but doesn't affect invoice
      printerIp: undefined
    };

    try {
      const res = await apiClient("/api/proxy/reports/pos-invoice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        let errorMsg = "Failed to generate invoice";
        try {
          const errData = await res.json();
          if (errData && errData.message) {
            errorMsg = errData.message;
          }
        } catch {}
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      
      // Download the PDF
      const downloadUrl = data.downloadUrl.replace('/api/reports', '/api/proxy/reports');
      const pdfRes = await apiClient(downloadUrl);
      if (!pdfRes.ok) throw new Error('Failed to download invoice PDF');
      
      const blob = await pdfRes.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = data.downloadUrl.split('/').pop() || 'pos-invoice.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
      toast.success("Invoice downloaded successfully!");
      
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to download invoice.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-1 bg-gray-100 overflow-hidden text-gray-900">
      <Toaster position="top-right" />
      
      {/* Left side: Product Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Category Tabs */}
        <div className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center z-10">
          <div className="text-xl font-bold text-gray-800">Point of Sale</div>
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner overflow-x-auto max-w-[60vw]">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all
                  ${selectedCategory === cat 
                    ? "bg-white text-blue-700 shadow-md scale-105" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 font-medium">Loading products...</div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-500 font-medium">Error loading products.</div>
          ) : (
            <ProductGrid 
              products={products} 
              selectedCategory={selectedCategory} 
              onProductClick={addToCart} 
            />
          )}
        </main>
      </div>

      {/* Right side: Cart Sidebar */}
      <aside className="w-full max-w-sm lg:max-w-md h-full z-20">
        <CartSidebar 
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={() => setCart([])}
          onCheckout={() => setIsCheckoutModalOpen(true)}
          onPrintPreReceipt={handlePrintPreReceipt}
          onDownloadInvoice={handleDownloadInvoice}
          isProcessing={isProcessing}
        />
      </aside>

      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        total={cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0)}
        onConfirm={handleCheckout}
        printerIp={printerIp}
        setPrinterIp={handlePrinterIpChange}
        isProcessing={isProcessing}
      />
    </div>
  );
}
