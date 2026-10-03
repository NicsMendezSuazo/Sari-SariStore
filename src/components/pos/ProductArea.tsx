import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Camera, X, Star } from 'lucide-react';
import type { Product } from '@/types';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useCartStore } from '@/stores/cartStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductAreaProps {
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function ProductArea({ searchInputRef }: ProductAreaProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(true);
  const isMobile = useIsMobile();
  const add = useCartStore((s) => s.add);
  const setScannerOpen = useUIStore((s) => s.setScannerOpen);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || internalRef;

  const { data: allProducts } = useProducts();
  const { data: categories } = useCategories();
  const { data: shortcutCustomers } = useCustomers({ shortcutsOnly: true });

  const favorites = (allProducts || []).filter((p) => p.is_favorite).sort((a, b) => a.favorite_order - b.favorite_order);
  const filteredProducts = (allProducts || []).filter((p) => {
    if (search) return p.name.toLowerCase().includes(search.toLowerCase());
    if (activeCategory) return p.category_id === activeCategory;
    return true;
  });

  const handleAddToCart = useCallback((product: Product) => {
    add(product);
    if (navigator.vibrate) navigator.vibrate(30);
    toast.success(`${product.name} added`, { duration: 800 });
  }, [add]);

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputRef]);

  const showAllSection = !search && !activeCategory;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 bg-card border-b border-border sticky top-0 z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowFavorites(!e.target.value);
              }}
              placeholder="Search or scan..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setShowFavorites(true); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button
            onClick={() => setScannerOpen(true)}
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Scan barcode"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Favorites */}
        {showFavorites && showAllSection && favorites.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <h3 className="text-sm font-semibold">Favorites</h3>
            </div>
            <div className={cn(
              'grid gap-2',
              isMobile ? 'grid-cols-4' : 'grid-cols-8'
            )}>
              {favorites.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 hover:border-primary hover:shadow-sm active:scale-95 transition-all relative',
                    isMobile ? 'h-20' : 'h-24'
                  )}
                >
                  {product.stock <= product.low_stock_threshold && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                  )}
                  <span className="text-xs font-medium text-center line-clamp-2 leading-tight">
                    {product.name}
                  </span>
                  <span className="text-xs font-bold text-primary mt-1 tabular-nums">
                    {formatCurrency(product.price)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Customer Shortcuts */}
        {showFavorites && showAllSection && shortcutCustomers && shortcutCustomers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold">Shortcuts</h3>
            </div>
            <div className={cn(
              'grid gap-2',
              isMobile ? 'grid-cols-3' : 'grid-cols-6'
            )}>
              {shortcutCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    useCartStore.getState().setCustomer(customer);
                    useCartStore.getState().setPaymentMethod('utang');
                    toast.success(`Customer: ${customer.name}`, { duration: 1000 });
                  }}
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 hover:border-primary active:scale-95 transition-all h-16"
                >
                  <span className="text-xs font-medium text-center line-clamp-1">{customer.name}</span>
                  <span className={cn(
                    'text-xs font-bold tabular-nums',
                    customer.balance > 0 ? 'text-warning' : 'text-success'
                  )}>
                    {formatCurrency(customer.balance)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Category tabs */}
        {showAllSection && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold">All Products</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  !activeCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                )}
              >
                All
              </button>
              {(categories || []).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Product grid */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {search ? `No products found for "${search}"` : 'No products yet. Add some in the Products page.'}
              </p>
            </div>
          ) : (
            <div className={cn(
              'grid gap-2',
              isMobile ? 'grid-cols-3' : 'grid-cols-6'
            )}>
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 hover:border-primary hover:shadow-sm active:scale-95 transition-all relative',
                    isMobile ? 'h-20' : 'h-24'
                  )}
                >
                  {product.stock <= product.low_stock_threshold && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" title="Low stock" />
                  )}
                  <span className="text-xs font-medium text-center line-clamp-2 leading-tight">
                    {product.name}
                  </span>
                  <span className="text-xs font-bold text-primary mt-1 tabular-nums">
                    {formatCurrency(product.price)}
                  </span>
                  {product.stock > 0 && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {product.stock} {product.unit}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
