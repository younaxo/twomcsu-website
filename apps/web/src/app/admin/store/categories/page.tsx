'use client';

import type { StoreCategory } from '@twomc/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, extractErrorMessage } from '@/lib/api';

function flatten(categories: StoreCategory[], depth = 0): Array<StoreCategory & { depth: number }> {
  return categories.flatMap((c) => [
    { ...c, depth },
    ...flatten(c.subcategories ?? [], depth + 1),
  ]);
}

export default function AdminStoreCategoriesPage() {
  const [rows, setRows] = useState<Array<StoreCategory & { depth: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<StoreCategory[]>('/admin/store/categories');
      setRows(flatten(data));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить категории'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!name.trim() || !slug.trim()) return;
    try {
      await api.post('/admin/store/categories', { name: name.trim(), slug: slug.trim() });
      toast.success('Категория создана');
      setName('');
      setSlug('');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Удалить «${title}»?`)) return;
    try {
      await api.delete(`/admin/store/categories/${id}`);
      toast.success('Удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Категории магазина</h1>
        <p className="text-sm text-muted-foreground">Дерево категорий каталога</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1">
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => void create()}>
            <Plus className="mr-2 h-4 w-4" />
            Создать
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell style={{ paddingLeft: 16 + row.depth * 16 }}>{row.name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                  <TableCell>{row.order}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void remove(row.id, row.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
