import { Minus, Plus, Trash2, ShoppingCart, Pause, X, User } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useHeldStore } from '@/stores/heldStore';
import { useUIStore } from '@/stores/uiStore';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface CartPanelProps {
  variant: 'desktop' | 'mobile';
}

export function CartPanel({ variant }: CartPanelProps) {
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const discount = useCartStore((s) => s.discount);
  const incrementQty = useCartStore((s) => s.incrementQty);
  const decrementQty = useCartStore((s) => s.decrementQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const hold = useHeldStore((s) => s.hold);
  const setPaymentOpen = useUIStore((s) => s.setPaymentOpen);
  const setHeldListOpen = useUIStore((s) => s.setHeldListOpen);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const [holdLabel, setHoldLabel] = useState('');

  const subtotal = getSubtotal();
  const total = getTotal();
  const count = getItemCount();

  const handleHold = () => {
    if (items.length === 0) return;
    const label = holdLabel.trim() || `Sale ${new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
    hold(label, items, customer?.id || null);
    clear();
    setHoldLabel('');
    setCartOpen(false);
    toast.success(`Sale held: ${label}`);
  };

  if (variant === 'mobile') {
    return (
      <>
        {/* Mobile: slide-up drawer */}
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setCartOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-card rounded-t-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">Cart ({count})</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {customer && (
              <div className="px-4 py-2 bg-warning/10 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">{customer.name}</span>
                  {customer.balance > 0 && (
                    <span className="text-xs text-warning">Bal: {formatCurrency(customer.balance)}</span>
                  )}
                </div>
                <button onClick={() => useCartStore.getState().setCustomer(null)} className="text-xs text-muted-foreground">
                  Remove
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
              {items.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Cart is empty. Tap products to add.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(item.product.price)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => decrementQty(item.product.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                      <button onClick={() => incrementQty(item.product.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="w-20 text-right text-sm font-bold tabular-nums">
                      {formatCurrency(item.product.price * item.qty)}
                    </div>
                    <button onClick={() => remove(item.product.id)} className="p-1.5 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totals and actions */}
            <div className="border-t border-border p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums text-destructive">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="tabular-nums text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={handleHold} disabled={items.length === 0}>
                  <Pause className="h-4 w-4 mr-1" /> Hold
                </Button>
                <Button variant="outline" size="sm" onClick={() => { clear(); toast.info('Cart cleared'); }} disabled={items.length === 0}>
                  <Trash2 className="h-4 w-4 mr-1" /> Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setCartOpen(false); setHeldListOpen(true); }}
                >
                  Held ({useHeldStore.getState().heldSales.length})
                </Button>
              </div>

              <Button
                onClick={() => setPaymentOpen(true)}
                disabled={items.length === 0}
                className="w-full h-12 text-base"
              >
                Pay {formatCurrency(total)}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop cart panel
  return (
    <div className="w-[380px] bg-card border-l border-border flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">Cart ({count})</span>
        </div>
        <button
          onClick={() => { clear(); toast.info('Cart cleared'); }}
          disabled={items.length === 0}
          className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          Clear all
        </button>
      </div>

      {customer && (
        <div className="px-4 py-2 bg-warning/10 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">{customer.name}</span>
            {customer.balance > 0 && (
              <span className="text-xs text-warning">Bal: {formatCurrency(customer.balance)}</span>
            )}
          </div>
          <button onClick={() => useCartStore.getState().setCustomer(null)} className="text-xs text-muted-foreground hover:text-foreground">
            Remove
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Cart is empty. Click products or scan barcodes to add.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.product.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(item.product.price)} each
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => decrementQty(item.product.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                <button onClick={() => incrementQty(item.product.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="w-20 text-right text-sm font-bold tabular-nums">
                {formatCurrency(item.product.price * item.qty)}
              </div>
              <button onClick={() => remove(item.product.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums text-destructive">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleHold} disabled={items.length === 0} className="flex-1">
            <Pause className="h-4 w-4 mr-1" /> Hold
          </Button>
          <Button
            variant="outline"
            onClick={() => setHeldListOpen(true)}
            className="flex-1"
          >
            Held ({useHeldStore.getState().heldSales.length})
          </Button>
        </div>

        <Button
          onClick={() => setPaymentOpen(true)}
          disabled={items.length === 0}
          className="w-full h-12 text-base"
        >
          Pay {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}
