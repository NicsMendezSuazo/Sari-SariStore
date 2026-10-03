import { useState } from 'react';
import { X, Search, Package } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

export function ScannerModal() {
  const setScannerOpen = useUIStore((s) => s.setScannerOpen);
  const [code, setCode] = useState('');
  const add = useCartStore((s) => s.add);
  const { data: products } = useProducts();

  const handleLookup = () => {
    if (!code.trim()) return;
    const product = (products || []).find((p) => p.barcode === code.trim());
    if (product) {
      add(product);
      if (navigator.vibrate) navigator.vibrate(50);
      toast.success(`${product.name} added`);
      setScannerOpen(false);
    } else {
      toast.error(`No product with barcode ${code.trim()}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Scan / Lookup</h2>
          <button onClick={() => setScannerOpen(false)} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Enter a barcode or product code to quickly add to cart.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="Enter barcode..."
              autoFocus
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button onClick={handleLookup} disabled={!code.trim()} className="w-full h-12">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
