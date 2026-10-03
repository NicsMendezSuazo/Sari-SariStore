import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types';

export function useCustomers(params?: { search?: string; shortcutsOnly?: boolean }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      let query = supabase.from('customers').select('*').order('name');
      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }
      if (params?.shortcutsOnly) {
        query = query.eq('is_shortcut', true).order('shortcut_order');
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
    staleTime: 30000,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useToggleShortcut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isShortcut, shortcutOrder }: { id: string; isShortcut: boolean; shortcutOrder?: number }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ is_shortcut: isShortcut, shortcut_order: shortcutOrder ?? 0 })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, amount }: { customerId: string; amount: number }) => {
      const { data: customer, error: fe } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .single();
      if (fe) throw fe;
      const newBalance = Math.max(0, customer.balance - amount);
      const { data, error } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', customerId)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}
