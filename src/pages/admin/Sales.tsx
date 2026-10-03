import { useState } from 'react';
import { X, Ban, Eye } from 'lucide-react';
import { useSales, useSale, useVoidSale } from '@/hooks/useSales';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatRelativeDate } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Sale } from '@/types';

export function Sales() {
  const { data: sales, isLoading } = useSales();
  const voidSale = useVoidSale();
  const [viewing, setViewing] = useState<string | null>(null);
  const { data: saleDetail } = useSale(viewing);

  const handleVoid = async (id: string) => {
    if (!confirm('Void this sale? This will restore stock and cannot be undone.')) return;
    try {
      await voidSale.mutateAsync(id);
      toast.info('Sale voided');
      setViewing(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to void sale');
    }
  };

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold">Sales History</h1>
        <p className="text-sm text-muted-foreground">{sales?.length || 0} transactions</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (sales || []).length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No sales yet.</div>
      ) : (
        <div className="space-y-2">
          {(sales || []).map((sale) => (
            <Card key={sale.id} className={cn('p-3 flex items-center gap-3', sale.is_voided && 'opacity-50')}>
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                sale.is_voided ? 'bg-muted' : sale.payment_method === 'cash' ? 'bg-success/10' : sale.payment_method === 'utang' ? 'bg-warning/10' : 'bg-primary/10'
              )}>
                <span className="text-xs font-bold uppercase">
                  {sale.payment_method.slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-mono">{sale.receipt_no}</div>
                <div className="text-xs text-muted-foreground">
                  {formatRelativeDate(sale.created_at)} · {sale.sale_items?.length || '?'} items
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums">{formatCurrency(sale.total_amount)}</div>
                {sale.is_voided && <span className="text-xs text-destructive">VOIDED</span>}
              </div>
              <button onClick={() => setViewing(sale.id)} className="p-2 rounded-lg hover:bg-muted">
                <Eye className="h-4 w-4" />
              </button>
              {!sale.is_voided && (
                <button onClick={() => handleVoid(sale.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                  <Ban className="h-4 w-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Sale detail modal */}
      {viewing && saleDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-semibold">Receipt {saleDetail.receipt_no}</h2>
                <p className="text-xs text-muted-foreground">{formatDateTime(saleDetail.created_at)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {saleDetail.is_voided && (
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
                  This sale has been voided
                </div>
              )}
              <div className="space-y-2">
                {(saleDetail as any).sale_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} x{item.qty}</span>
                    <span className="tabular-nums font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-border pt-3 space-y-1">
                {saleDetail.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums">-{formatCurrency(saleDetail.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(saleDetail.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Payment</span>
                  <span className="capitalize">{saleDetail.payment_method}</span>
                </div>
                {saleDetail.payment_method !== 'utang' && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Paid</span>
                      <span className="tabular-nums">{formatCurrency(saleDetail.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Change</span>
                      <span className="tabular-nums">{formatCurrency(saleDetail.change_amount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <Button variant="outline" onClick={() => setViewing(null)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
