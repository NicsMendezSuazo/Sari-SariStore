import { useState, useEffect } from 'react';
import { Banknote, Smartphone, User as UserIcon, X, Delete, Check } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useCreateSale } from '@/hooks/useSales';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/types';

export function PaymentModal() {
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const discount = useCartStore((s) => s.discount);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  const getTotal = useCartStore((s) => s.getTotal);
  const clear = useCartStore((s) => s.clear);
  const setPaymentOpen = useUIStore((s) => s.setPaymentOpen);
  const setReceiptData = useUIStore((s) => s.setReceiptData);
  const createSale = useCreateSale();
  const { data: settings } = useSettings();

  const [amountPaid, setAmountPaid] = useState('');
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);

  const total = getTotal();

  useEffect(() => {
    setAmountPaid(total.toFixed(2));
  }, [total]);

  const change = Math.max(0, (parseFloat(amountPaid) || 0) - total);

  const handleKeypad = (key: string) => {
    if (key === 'del') {
      setAmountPaid((p) => p.slice(0, -1));
      return;
    }
    if (key === 'clear') {
      setAmountPaid('');
      return;
    }
    if (key === '.') {
      if (amountPaid.includes('.')) return;
      setAmountPaid((p) => (p === '' ? '0.' : p + '.'));
      return;
    }
    setAmountPaid((p) => {
      if (p === '0') return key;
      if (p.includes('.') && p.split('.')[1].length >= 2) return p;
      return p + key;
    });
  };

  const quickAmounts = [total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, 100, 200, 500].filter(
    (v, i, arr) => arr.indexOf(v) === i && v > 0
  );

  const handleConfirm = async () => {
    const paid = parseFloat(amountPaid) || 0;
    if (paymentMethod === 'cash' && paid < total) {
      toast.error('Amount paid is less than total');
      return;
    }
    if (paymentMethod === 'utang' && !customer) {
      toast.error('Select a customer for utang');
      return;
    }
    if ((paymentMethod === 'gcash' || paymentMethod === 'maya') && !reference.trim()) {
      toast.error('Enter a reference number');
      return;
    }

    setProcessing(true);
    try {
      const result = await createSale.mutateAsync({
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          qty: i.qty,
          unitPrice: i.product.price,
        })),
        customerId: customer?.id || null,
        paymentMethod,
        amountPaid: paymentMethod === 'utang' ? 0 : paid,
        discount,
        note: (paymentMethod === 'gcash' || paymentMethod === 'maya') ? `Ref: ${reference}` : null,
      });

      setPaymentOpen(false);
      setReceiptData({ ...result, storeName: settings?.store_name || 'Sari-Sari Store' });
      clear();
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      toast.success('Sale completed!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };

  const methods: { value: PaymentMethod; label: string; icon: any; color: string }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote, color: 'bg-success text-success-foreground' },
    { value: 'gcash', label: 'GCash', icon: Smartphone, color: 'bg-primary text-primary-foreground' },
    { value: 'maya', label: 'Maya', icon: Smartphone, color: 'bg-primary text-primary-foreground' },
    { value: 'utang', label: 'Utang', icon: UserIcon, color: 'bg-warning text-warning-foreground' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Payment</h2>
          <button onClick={() => setPaymentOpen(false)} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Total */}
          <div className="text-center py-3 bg-secondary rounded-xl">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-3xl font-bold text-primary tabular-nums">{formatCurrency(total)}</div>
            {customer && paymentMethod === 'utang' && (
              <div className="text-xs text-warning mt-1">
                Current balance: {formatCurrency(customer.balance)}
              </div>
            )}
          </div>

          {/* Payment methods */}
          <div className="grid grid-cols-4 gap-2">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all',
                    paymentMethod === m.value
                      ? 'border-primary ' + m.color
                      : 'border-border bg-background hover:border-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash payment: keypad + quick amounts */}
          {paymentMethod === 'cash' && (
            <>
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amt, i) => (
                  <button
                    key={i}
                    onClick={() => setAmountPaid(amt.toFixed(2))}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/70 transition-colors tabular-nums"
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Amount Paid</div>
                  <div className="text-xl font-bold tabular-nums">{formatCurrency(parseFloat(amountPaid) || 0)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Change</div>
                  <div className="text-xl font-bold text-success tabular-nums">{formatCurrency(change)}</div>
                </div>
              </div>

              {/* Numeric keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeypad(k)}
                    className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all text-lg font-semibold"
                  >
                    {k}
                  </button>
                ))}
                <button onClick={() => handleKeypad('.')} className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all text-lg font-semibold">
                  .
                </button>
                <button onClick={() => handleKeypad('0')} className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all text-lg font-semibold">
                  0
                </button>
                <button onClick={() => handleKeypad('del')} className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all flex items-center justify-center">
                  <Delete className="h-5 w-5" />
                </button>
              </div>
            </>
          )}

          {/* GCash / Maya: reference number */}
          {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
            <div className="space-y-3">
              {settings && (
                <div className="p-3 rounded-xl bg-primary/10 text-center">
                  <div className="text-xs text-muted-foreground">Send to {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} number</div>
                  <div className="text-lg font-bold">{paymentMethod === 'gcash' ? settings.gcash_number || 'Not set' : settings.maya_number || 'Not set'}</div>
                </div>
              )}
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Reference number"
                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="p-3 rounded-xl border border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount to collect</span>
                <span className="text-xl font-bold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Utang: customer info */}
          {paymentMethod === 'utang' && (
            <div className="space-y-3">
              {customer ? (
                <div className="p-3 rounded-xl bg-warning/10 space-y-1">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">Current balance: {formatCurrency(customer.balance)}</div>
                  <div className="text-sm font-medium text-warning">
                    New balance: {formatCurrency(customer.balance + total)}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-warning text-center text-sm text-muted-foreground">
                  Select a customer from Shortcuts or the Customers page first.
                </div>
              )}
            </div>
          )}

          {/* Confirm button */}
          <Button
            onClick={handleConfirm}
            disabled={processing || (paymentMethod === 'utang' && !customer)}
            className="w-full h-12 text-base"
          >
            {processing ? (
              'Processing...'
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Confirm Sale
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
