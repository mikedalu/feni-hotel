import { Product } from "@/types/pos";

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  selectedCategory: string;
}

export default function ProductGrid({ products, onProductClick, selectedCategory }: ProductGridProps) {
  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 overflow-y-auto">
      {filteredProducts.map((product) => (
        <button
          key={product.id}
          onClick={() => onProductClick(product)}
          className={`
            relative p-4 rounded-xl border-2 text-left transition-all duration-200
            hover:shadow-lg hover:-translate-y-1 active:translate-y-0
            flex flex-col justify-between min-h-[120px]
            ${product.productType === "PREPARED_DISH" 
              ? "bg-orange-50 border-orange-200 hover:border-orange-400" 
              : "bg-blue-50 border-blue-200 hover:border-blue-400"}
          `}
        >
          <div>
            <h3 className="font-bold text-gray-800 line-clamp-2">{product.name}</h3>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {product.category}
            </span>
          </div>
          
          <div className="flex justify-between items-end mt-4">
            <span className="text-lg font-bold text-gray-900">
              ₦{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {product.productType === "RAW_GOOD" && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                (product.stockQty || 0) > 10 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {product.stockQty} in stock
              </span>
            )}
          </div>
        </button>
      ))}
      
      {filteredProducts.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-lg font-medium">No products found</p>
        </div>
      )}
    </div>
  );
}
