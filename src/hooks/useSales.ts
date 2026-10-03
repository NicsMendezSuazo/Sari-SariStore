import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Sale, SaleItem, InventoryMovement, Supplier } from '@/types';
import { generateReceiptNo, generateClientId } from '@/utils/format';

export function useSales(params?: { fromDate?: string; toDate?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });

      if (params?.fromDate) query = query.gte('created_at', params.fromDate);
      if (params?.toDate) query = query.lte('created_at', params.toDate);

      const pageSize = params?.pageSize ?? 50;
      const page = params?.page ?? 1;
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data as Sale[];
    },
    staleTime: 10000,
  });
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*), customer:customers(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as (Sale & { sale_items: SaleItem[] }) | null;
    },
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      items: { productId: string; productName: string; qty: number; unitPrice: number }[];
      customerId: string | null;
      paymentMethod: string;
      amountPaid: number;
      discount: number;
      note?: string | null;
    }) => {
      const total = params.items.reduce((s, i) => s + i.unitPrice * i.qty, 0) - params.discount;
      const receiptNo = generateReceiptNo();
      const clientId = generateClientId();

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          receipt_no: receiptNo,
          client_id: clientId,
          total_amount: total,
          amount_paid: params.amountPaid,
          change_amount: Math.max(0, params.amountPaid - total),
          discount: params.discount,
          payment_method: params.paymentMethod,
          customer_id: params.customerId,
          note: params.note || null,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = params.items.map((i) => ({
        sale_id: sale.id,
        product_id: i.productId,
        product_name: i.productName,
        qty: i.qty,
        unit_price: i.unitPrice,
        subtotal: i.unitPrice * i.qty,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // Decrement stock
      for (const item of params.items) {
        const { data: prod } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single();
        if (prod) {
          const newQty = Math.max(0, prod.stock - item.qty);
          await supabase
            .from('products')
            .update({ stock: newQty, updated_at: new Date().toISOString() })
            .eq('id', item.productId);

          await supabase.from('inventory_movements').insert({
            product_id: item.productId,
            type: 'sale',
            qty_change: -item.qty,
            new_qty: newQty,
            reason: `Sale ${receiptNo}`,
          });
        }
      }

      // If utang, add to customer balance
      if (params.paymentMethod === 'utang' && params.customerId) {
        const { data: cust } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', params.customerId)
          .single();
        if (cust) {
          await supabase
            .from('customers')
            .update({ balance: cust.balance + total })
            .eq('id', params.customerId);
        }
      }

      // Fetch the complete sale with items
      const { data: fullSale } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('id', sale.id)
        .single();

      return fullSale as Sale & { sale_items: SaleItem[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useVoidSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => {
      const { data: sale } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('id', saleId)
        .single();
      if (!sale) throw new Error('Sale not found');

      // Restore stock
      for (const item of sale.sale_items) {
        if (item.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
          if (prod) {
            const newQty = prod.stock + item.qty;
            await supabase
              .from('products')
              .update({ stock: newQty, updated_at: new Date().toISOString() })
              .eq('id', item.product_id);

            await supabase.from('inventory_movements').insert({
              product_id: item.product_id,
              type: 'void',
              qty_change: item.qty,
              new_qty: newQty,
              reason: `Void sale ${sale.receipt_no}`,
            });
          }
        }
      }

      // If utang, subtract from balance
      if (sale.payment_method === 'utang' && sale.customer_id) {
        const { data: cust } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', sale.customer_id)
          .single();
        if (cust) {
          await supabase
            .from('customers')
            .update({ balance: Math.max(0, cust.balance - sale.total_amount) })
            .eq('id', sale.customer_id);
        }
      }

      const { data, error } = await supabase
        .from('sales')
        .update({ is_voided: true })
        .eq('id', saleId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Inventory
export function useInventoryMovements() {
  return useQuery({
    queryKey: ['inventory-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, product:products(*), supplier:suppliers(*)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as InventoryMovement[];
    },
    staleTime: 30000,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .filter('stock', 'lte', 'low_stock_threshold')
        .order('stock', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });
}

export function useStockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { items: { productId: string; qty: number; cost: number }[]; supplierId?: string | null }) => {
      for (const item of params.items) {
        const { data: prod } = await supabase
          .from('products')
          .select('stock, cost')
          .eq('id', item.productId)
          .single();
        if (prod) {
          const newQty = prod.stock + item.qty;
          await supabase
            .from('products')
            .update({ stock: newQty, cost: item.cost || prod.cost, updated_at: new Date().toISOString() })
            .eq('id', item.productId);

          await supabase.from('inventory_movements').insert({
            product_id: item.productId,
            type: 'receive',
            qty_change: item.qty,
            new_qty: newQty,
            supplier_id: params.supplierId || null,
            cost: item.cost,
            reason: 'Stock received',
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory-movements'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

export function useStockAdjust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, newQty, reason }: { productId: string; newQty: number; reason: string }) => {
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      if (!prod) throw new Error('Product not found');

      const change = newQty - prod.stock;
      await supabase
        .from('products')
        .update({ stock: newQty, updated_at: new Date().toISOString() })
        .eq('id', productId);

      await supabase.from('inventory_movements').insert({
        product_id: productId,
        type: 'adjust',
        qty_change: change,
        new_qty: newQty,
        reason,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory-movements'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

// Suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Supplier[];
    },
    staleTime: 60000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
