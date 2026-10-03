import { useState } from 'react';
import { Plus, Minus, X, Package, AlertTriangle, ArrowDownToLine } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useLowStock, useStockIn, useStockAdjust, useInventoryMovements } from '@/hooks/useSales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { toast } from 'sonner';
import type { Product } from '@/types';

export function Inventory() {
  const [tab, setTab] = useState<'stock' | 'lowstock' | 'history'>('stock');
  const { data: products } = useProducts();
  const { data: lowStock } = useLowStock();
  const { data: movements } = useInventoryMovements();
  const stockIn = useStockIn();
  const stockAdjust = useStockAdjust();

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [newQty, setNewQty] = useState('');
  const [reason, setReason] = useState('');
  const [showStockIn, setShowStockIn] = useState(false);

  const handleAdjust = async () => {
    if (!adjustProduct) return;
    try {
      await stockAdjust.mutateAsync({
        productId: adjustProduct.id,
        newQty: parseInt(newQty) || 0,
        reason: reason || 'Manual adjustment',
      });
      toast.success('Stock adjusted');
      setAdjustProduct(null);
      setNewQty('');
      setReason('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage stock levels</p>
        </div>
        <Button onClick={() => setShowStockIn(true)}>
          <ArrowDownToLine className="h-4 w-4 mr-1" /> Stock In
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {[
          { key: 'stock', label: 'All Products' },
          { key: 'lowstock', label: 'Low Stock' },
          { key: 'history', label: 'History' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(products || []).map((p: Product) => (
            <Card key={p.id} className="p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                p.stock <= p.low_stock_threshold ? 'bg-destructive/10' : 'bg-primary/10'
              }`}>
                <Package className={`h-5 w-5 ${p.stock <= p.low_stock_threshold ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  Stock: <span className={p.stock <= p.low_stock_threshold ? 'text-destructive font-bold' : ''}>{p.stock} {p.unit}</span>
                </div>
                <div className="text-xs text-muted-foreground">Cost: {formatCurrency(p.cost)}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setAdjustProduct(p); setNewQty(p.stock.toString()); }}>
                Adjust
              </Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'lowstock' && (
        <div className="space-y-2">
          {(lowStock || []).length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-success" />
              All products are well-stocked.
            </div>
          ) : (
            (lowStock || []).map((p: any) => (
              <Card key={p.id} className="p-3 flex items-center gap-3 border-destructive/30">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">Only {p.stock} {p.unit} left (threshold: {p.low_stock_threshold})</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setAdjustProduct(p); setNewQty(p.stock.toString()); }}>
                  Restock
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {(movements || []).length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">No inventory movements yet.</div>
          ) : (
            (movements || []).map((m: any) => (
              <Card key={m.id} className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  m.qty_change > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {m.qty_change > 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.product?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.type}: {m.qty_change > 0 ? '+' : ''}{m.qty_change} → {m.new_qty} {m.reason && `· ${m.reason}`}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(m.created_at)}</div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Adjust modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Adjust Stock</h2>
              <button onClick={() => setAdjustProduct(null)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm font-medium">{adjustProduct.name}</div>
              <div className="text-xs text-muted-foreground">Current: {adjustProduct.stock} {adjustProduct.unit}</div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">New Quantity</label>
                <Input value={newQty} onChange={(e) => setNewQty(e.target.value)} type="number" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Reason</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Damaged, Lost, Counted" />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" onClick={() => setAdjustProduct(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleAdjust} disabled={stockAdjust.isPending} className="flex-1">Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Stock In modal */}
      {showStockIn && (
        <StockInModal
          products={products || []}
          onClose={() => setShowStockIn(false)}
          onConfirm={async (items) => {
            try {
              await stockIn.mutateAsync({ items });
              toast.success('Stock received');
              setShowStockIn(false);
            } catch (e: any) {
              toast.error(e.message || 'Failed to receive stock');
            }
          }}
          saving={stockIn.isPending}
        />
      )}
    </div>
  );
}

function StockInModal({ products, onClose, onConfirm, saving }: {
  products: Product[];
  onClose: () => void;
  onConfirm: (items: { productId: string; qty: number; cost: number }[]) => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [items, setItems] = useState<{ productId: string; productName: string; qty: number; cost: number }[]>([]);

  const handleAdd = () => {
    const product = products.find((p) => p.id === selected);
    if (!product || !qty) return;
    setItems([...items, { productId: selected, productName: product.name, qty: parseInt(qty), cost: parseFloat(cost) || 0 }]);
    setSelected('');
    setQty('');
    setCost('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Receive Stock</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Select product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input value={qty} onChange={(e) => setQty(e.target.value)} type="number" placeholder="Quantity" />
            <Input value={cost} onChange={(e) => setCost(e.target.value)} type="number" placeholder="Cost per unit" />
          </div>
          <Button onClick={handleAdd} disabled={!selected || !qty} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>

          {items.length > 0 && (
            <div className="space-y-2 pt-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border text-sm">
                  <span>{item.productName} x{item.qty}</span>
                  <span className="text-muted-foreground">{formatCurrency(item.cost * item.qty)}</span>
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onConfirm(items)} disabled={items.length === 0 || saving} className="flex-1">
            {saving ? 'Saving...' : 'Receive'}
          </Button>
        </div>
      </div>
    </div>
  );
}
