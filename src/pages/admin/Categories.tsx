import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Category } from '@/types';

export function Categories() {
  const { data: categories, isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateCat.mutateAsync({ id: editing.id, name: name.trim() });
        toast.success('Category updated');
      } else {
        await createCat.mutateAsync(name.trim());
        toast.success('Category created');
      }
      setShowForm(false);
      setEditing(null);
      setName('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteCat.mutateAsync(id);
      toast.info('Category deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories?.length || 0} categories</p>
        </div>
        <Button onClick={() => { setEditing(null); setName(''); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (categories || []).length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No categories yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(categories || []).map((cat) => (
            <Card key={cat.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 text-sm font-medium">{cat.name}</div>
              <button
                onClick={() => { setEditing(cat); setName(cat.name); setShowForm(true); }}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={!name.trim() || createCat.isPending} className="flex-1">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
