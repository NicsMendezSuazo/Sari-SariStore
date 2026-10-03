import { useRef, useEffect } from 'react';
import { ShoppingCart, Pause, Trash2, Banknote } from 'lucide-react';
import { ProductArea } from '@/components/pos/ProductArea';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptView } from '@/components/pos/ReceiptView';
import { HeldSalesList } from '@/components/pos/HeldSalesList';
import { ScannerModal } from '@/components/pos/ScannerModal';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCartStore } from '@/stores/cartStore';
import { useHeldStore } from '@/stores/heldStore';
import { useUIStore } from '@/stores/uiStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function POS() {
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartOpen = useUIStore((s) => s.cartOpen);
  const paymentOpen = useUIStore((s) => s.paymentOpen);
  const scannerOpen = useUIStore((s) => s.scannerOpen);
  const heldListOpen = useUIStore((s) => s.heldListOpen);
  const receiptData = useUIStore((s) => s.receiptData);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const setPaymentOpen = useUIStore((s) => s.setPaymentOpen);

  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const clear = useCartStore((s) => s.clear);
  const hold = useHeldStore((s) => s.hold);

  const total = getTotal();
  const count = getItemCount();

  // Desktop hotkeys
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'F1') { e.preventDefault(); setPaymentOpen(true); }
      if (e.key === 'F4') {
        e.preventDefault();
        if (items.length > 0) {
          hold(`Sale ${new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`, items, null);
          clear();
          toast.success('Sale held');
        }
      }
      if (e.key === 'F5') { e.preventDefault(); clear(); toast.info('Cart cleared'); }
      if (e.key === 'Escape') {
        if (paymentOpen) setPaymentOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobile, items, paymentOpen, setPaymentOpen, hold, clear]);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <ProductArea searchInputRef={searchInputRef} />
        </div>

        {/* Sticky checkout bar */}
        <div className="sticky bottom-16 left-0 right-0 bg-card border-t border-border p-3 flex items-center gap-3 shadow-lg z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs text-muted-foreground">{count} item{count !== 1 ? 's' : ''}</div>
              <div className="text-base font-bold text-primary tabular-nums">{formatCurrency(total)}</div>
            </div>
          </button>
          <button
            onClick={() => setPaymentOpen(true)}
            disabled={count === 0}
            className={cn(
              'h-12 px-6 rounded-xl font-semibold text-sm transition-all flex items-center gap-2',
              count > 0 ? 'bg-primary text-primary-foreground active:scale-95' : 'bg-muted text-muted-foreground'
            )}
          >
            <Banknote className="h-5 w-5" />
            Pay
          </button>
        </div>

        {/* Modals */}
        {cartOpen && <CartPanel variant="mobile" />}
        {paymentOpen && <PaymentModal />}
        {scannerOpen && <ScannerModal />}
        {heldListOpen && <HeldSalesList />}
        {receiptData && <ReceiptView />}
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <ProductArea searchInputRef={searchInputRef} />
      </div>
      <CartPanel variant="desktop" />

      {/* Desktop hotkey hints */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-4 text-xs text-muted-foreground bg-card/80 backdrop-blur px-4 py-1.5 rounded-full border border-border">
        <span><kbd className="font-mono">F1</kbd> Pay</span>
        <span><kbd className="font-mono">F4</kbd> Hold</span>
        <span><kbd className="font-mono">F5</kbd> Clear</span>
        <span><kbd className="font-mono">/</kbd> Search</span>
        <span><kbd className="font-mono">Esc</kbd> Close</span>
      </div>

      {/* Modals */}
      {paymentOpen && <PaymentModal />}
      {scannerOpen && <ScannerModal />}
      {heldListOpen && <HeldSalesList />}
      {receiptData && <ReceiptView />}
    </div>
  );
}
