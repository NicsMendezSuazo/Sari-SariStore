import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, ShoppingBag, Check } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Button } from '@/components/ui/button';
import type { Sale, SaleItem } from '@/types';

export function ReceiptView() {
  const receiptData = useUIStore((s) => s.receiptData);
  const setReceiptData = useUIStore((s) => s.setReceiptData);

  if (!receiptData) return null;

  const sale = receiptData as Sale & { sale_items: SaleItem[]; storeName?: string };
  const receiptContent = `${sale.storeName || 'Sari-Sari Store'}|${sale.receipt_no}|${sale.total_amount}|${sale.created_at}`;
  const paymentLabel = sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1);

  const handleShare = async () => {
    const text = `Receipt ${sale.receipt_no}\nTotal: ${formatCurrency(sale.total_amount)}\n${sale.storeName || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Receipt', text });
      } catch {
        // User cancelled
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 no-print">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-success" />
            </div>
            <h2 className="font-semibold">Sale Complete</h2>
          </div>
          <button onClick={() => setReceiptData(null)} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt */}
        <div className="print-receipt p-6 text-center">
          <div className="font-bold text-lg">{sale.storeName || 'Sari-Sari Store'}</div>
          <div className="text-xs text-muted-foreground mb-3">{formatDateTime(sale.created_at)}</div>

          <div className="border-t border-b border-dashed border-border py-3 my-3 text-left">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Receipt No:</span>
              <span className="font-mono">{sale.receipt_no}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <span>Payment:</span>
              <span className="font-medium">{paymentLabel}</span>
            </div>

            <div className="space-y-1.5">
              {sale.sale_items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{item.product_name}</span>
                    <span className="text-muted-foreground ml-1">x{item.qty}</span>
                  </div>
                  <span className="tabular-nums font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-sm mb-4">
            {sale.discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span className="tabular-nums">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(sale.total_amount)}</span>
            </div>
            {sale.payment_method !== 'utang' && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span className="tabular-nums">{formatCurrency(sale.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Change</span>
                  <span className="tabular-nums">{formatCurrency(sale.change_amount)}</span>
                </div>
              </>
            )}
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-white rounded-xl">
              <QRCodeSVG value={receiptContent} size={120} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Scan to verify receipt</div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-2 no-print">
          <Button variant="outline" onClick={handleShare} className="flex-1">
            <ShoppingBag className="h-4 w-4 mr-1" /> Share
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button onClick={() => setReceiptData(null)} className="flex-1">
            New Sale
          </Button>
        </div>
      </div>
    </div>
  );
}
