import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';

export function useProducts(params?: { search?: string; categoryId?: string | null; favoritesOnly?: boolean }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('name');

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }
      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
      }
      if (params?.favoritesOnly) {
        query = query.eq('is_favorite', true).order('favorite_order');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 30000,
  });
}

export function useProductByBarcode(code: string | null) {
  return useQuery({
    queryKey: ['product-scan', code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('barcode', code)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!code,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isFavorite, favoriteOrder }: { id: string; isFavorite: boolean; favoriteOrder?: number }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ is_favorite: isFavorite, favorite_order: favoriteOrder ?? 0 })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// Categories

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 60000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, sort_order }: { id: string; name?: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ name, sort_order })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
