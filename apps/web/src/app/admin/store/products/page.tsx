'use client';

import type { StoreProduct } from '@twomc/shared';
import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatPrice, PRODUCT_TYPE_LABELS } from '@/lib/store';

export default function AdminStoreProductsPage() {
  const [items, setItems] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{
        items: StoreProduct[];
        totalPages: number;
      }>('/store/products', {
        params: { page, limit: 30, search: search || undefined, sort: 'newest' },
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить товары'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (product: StoreProduct) => {
    try {
      await api.patch(`/admin/store/products/${product.id}`, {
        isActive: !product.isActive,
      });
      toast.success(product.isActive ? 'Скрыт' : 'Активирован');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const remove = async (product: StoreProduct) => {
    if (!window.confirm(`Удалить «${product.name}»?`)) return;
    try {
      await api.delete(`/admin/store/products/${product.id}`);
      toast.success('Удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Товары</h1>
        <p className="text-sm text-muted-foreground">Каталог магазина</p>
      </div>

      <Input
        placeholder="Поиск…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-sm"
      />

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => {
                const variant = product.variants[0];
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{product.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PRODUCT_TYPE_LABELS[product.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      {variant ? formatPrice(variant.price) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={product.isActive ? 'secondary' : 'outline'}
                        onClick={() => void toggleActive(product)}
                      >
                        {product.isActive ? 'Активен' : 'Скрыт'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void remove(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="self-center text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </div>
  );
}
