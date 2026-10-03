import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Settings, Sale } from '@/types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
    staleTime: 60000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Settings> & { id: string }) => {
      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', updates.id)
        .select()
        .single();
      if (error) throw error;
      return data as Settings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useInitSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { storeName: string; ownerName: string; pin: string }) => {
      const { data, error } = await supabase
        .from('settings')
        .insert({
          store_name: params.storeName,
          owner_name: params.ownerName,
          pin: params.pin,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Settings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todaySales, error: se } = await supabase
        .from('sales')
        .select('total_amount, is_voided, payment_method')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());
      if (se) throw se;

      const validSales = (todaySales || []).filter((s: any) => !s.is_voided);
      const todayTotal = validSales.reduce((s: number, r: any) => s + Number(r.total_amount), 0);
      const todayCount = validSales.length;
      const cashTotal = validSales
        .filter((r: any) => r.payment_method === 'cash')
        .reduce((s: number, r: any) => s + Number(r.total_amount), 0);
      const gcashTotal = validSales
        .filter((r: any) => r.payment_method === 'gcash')
        .reduce((s: number, r: any) => s + Number(r.total_amount), 0);
      const utangTotal = validSales
        .filter((r: any) => r.payment_method === 'utang')
        .reduce((s: number, r: any) => s + Number(r.total_amount), 0);

      // Last 7 days sales
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data: weekSales } = await supabase
        .from('sales')
        .select('total_amount, created_at, is_voided')
        .gte('created_at', sevenDaysAgo.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: true });

      const validWeekSales = (weekSales || []).filter((s: any) => !s.is_voided);
      const dailyMap = new Map<string, number>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        dailyMap.set(d.toISOString().slice(0, 10), 0);
      }
      for (const s of validWeekSales) {
        const day = (s as any).created_at.slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) || 0) + Number((s as any).total_amount));
      }
      const dailyData = Array.from(dailyMap.entries()).map(([date, total]) => ({
        date,
        total,
      }));

      // Outstanding utang
      const { data: customers } = await supabase
        .from('customers')
        .select('balance')
        .gt('balance', 0);
      const outstandingUtang = (customers || []).reduce((s: number, c: any) => s + Number(c.balance), 0);

      // Low stock count
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .filter('stock', 'lte', 'low_stock_threshold');

      return {
        todayTotal,
        todayCount,
        cashTotal,
        gcashTotal,
        utangTotal,
        dailyData,
        outstandingUtang,
        lowStockCount: lowStockCount || 0,
      };
    },
    staleTime: 30000,
  });
}

export function useReports(period: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['reports', period],
    queryFn: async () => {
      const now = new Date();
      let fromDate = new Date();
      if (period === 'daily') fromDate.setDate(fromDate.getDate() - 30);
      if (period === 'weekly') fromDate.setDate(fromDate.getDate() - 84);
      if (period === 'monthly') fromDate.setMonth(fromDate.getMonth() - 12);

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, created_at, payment_method, is_voided')
        .gte('created_at', fromDate.toISOString())
        .lt('created_at', now.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;

      return (data || []).filter((s: any) => !s.is_voided) as Sale[];
    },
    staleTime: 60000,
  });
}

export function useOutstandingUtang() {
  return useQuery({
    queryKey: ['utang-outstanding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .gt('balance', 0)
        .order('balance', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });
}
