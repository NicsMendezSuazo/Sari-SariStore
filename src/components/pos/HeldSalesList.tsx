import { useState } from 'react';
import { Pause, Trash2, Play, X } from 'lucide-react';
import { useHeldStore } from '@/stores/heldStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

export function HeldSalesList() {
  const heldSales = useHeldStore((s) => s.heldSales);
  const resume = useHeldStore((s) => s.resume);
  const remove = useHeldStore((s) => s.remove);
  const setHeldListOpen = useUIStore((s) => s.setHeldListOpen);
  const setCart = useCartStore((s) => s.clear);
  const add = useCartStore((s) => s.add);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleResume = (id: string) => {
    const sale = resume(id);
    if (!sale) return;
    if (useCartStore.getState().items.length > 0) {
      if (confirmId !== id) {
        setConfirmId(id);
        return;
      }
    }
    setCart();
    sale.items.forEach((item) => add(item.product, item.qty));
    setHeldListOpen(false);
    setConfirmId(null);
    toast.success(`Resumed: ${sale.label}`);
  };

  const handleRemove = (id: string) => {
    remove(id);
    toast.info('Held sale removed');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Held Sales ({heldSales.length})</h2>
          <button onClick={() => setHeldListOpen(false)} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {heldSales.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No held sales. Use the Hold button to park a sale.
            </div>
          ) : (
            heldSales.map((sale) => {
              const total = sale.items.reduce((s, i) => s + i.product.price * i.qty, 0);
              return (
                <div key={sale.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{sale.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {sale.items.length} items · {formatCurrency(total)}
                    </div>
                    {confirmId === sale.id && (
                      <div className="text-xs text-warning mt-1">Current cart will be replaced. Tap again to confirm.</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleResume(sale.id)}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    aria-label="Resume"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(sale.id)}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
