import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Star, Banknote } from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useToggleShortcut, useRecordPayment } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types';

export function Customers() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [payCustomer, setPayCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useCustomers({ search: search || undefined });
  const createCust = useCreateCustomer();
  const updateCust = useUpdateCustomer();
  const deleteCust = useDeleteCustomer();
  const toggleShortcut = useToggleShortcut();
  const recordPayment = useRecordPayment();

  const handleSave = async (data: Partial<Customer>) => {
    try {
      if (editing) {
        await updateCust.mutateAsync({ id: editing.id, ...data });
        toast.success('Customer updated');
      } else {
        await createCust.mutateAsync(data);
        toast.success('Customer created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCust.mutateAsync(id);
      toast.info('Customer deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const totalOutstanding = (customers || []).reduce((s, c) => s + c.balance, 0);

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {customers?.length || 0} customers · {formatCurrency(totalOutstanding)} outstanding
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Customer
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (customers || []).length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No customers yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(customers || []).map((c) => (
            <Card key={c.id} className="p-3 flex items-center gap-3">
              <button
                onClick={() => toggleShortcut.mutate({ id: c.id, isShortcut: !c.is_shortcut })}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0',
                  c.is_shortcut ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground hover:text-warning'
                )}
              >
                <Star className={cn('h-4 w-4', c.is_shortcut && 'fill-warning')} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                <div className={cn('text-xs font-bold tabular-nums', c.balance > 0 ? 'text-warning' : 'text-success')}>
                  Bal: {formatCurrency(c.balance)}
                </div>
              </div>
              {c.balance > 0 && (
                <button
                  onClick={() => setPayCustomer(c)}
                  className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20"
                  title="Record payment"
                >
                  <Banknote className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-2 rounded-lg hover:bg-muted">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <CustomerForm
          customer={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={createCust.isPending || updateCust.isPending}
        />
      )}

      {payCustomer && (
        <PaymentForm
          customer={payCustomer}
          onClose={() => setPayCustomer(null)}
          onConfirm={async (amount) => {
            try {
              await recordPayment.mutateAsync({ customerId: payCustomer.id, amount });
              toast.success('Payment recorded');
              setPayCustomer(null);
            } catch (e: any) {
              toast.error(e.message || 'Failed to record payment');
            }
          }}
          saving={recordPayment.isPending}
        />
      )}
    </div>
  );
}

function CustomerForm({ customer, onSave, onClose, saving }: {
  customer: Customer | null;
  onSave: (data: Partial<Customer>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{customer ? 'Edit Customer' : 'New Customer'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
          </div>
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => name.trim() && onSave({ name: name.trim(), phone: phone.trim() || null })} disabled={!name.trim() || saving} className="flex-1">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ customer, onClose, onConfirm, saving }: {
  customer: Customer;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  saving: boolean;
}) {
  const [amount, setAmount] = useState(customer.balance.toString());

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Record Payment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm font-medium">{customer.name}</div>
          <div className="text-sm text-warning">Outstanding: {formatCurrency(customer.balance)}</div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount Received</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal" autoFocus />
          </div>
          <div className="text-xs text-muted-foreground">
            New balance: {formatCurrency(Math.max(0, customer.balance - (parseFloat(amount) || 0)))}
          </div>
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onConfirm(parseFloat(amount) || 0)} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Record Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
