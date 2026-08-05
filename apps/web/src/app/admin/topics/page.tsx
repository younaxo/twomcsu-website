'use client';

import type { TopicCategory, TopicSummary } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { FileText, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTopics, useDeleteTopic, usePinTopic } from '@/hooks/useTopics';
import { extractErrorMessage } from '@/lib/api';
import { TOPIC_CATEGORY_LABELS, TOPIC_VISIBILITY_LABELS } from '@/lib/topic';

export default function AdminTopicsPage() {
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;
  const topics = useAdminTopics(isOwner);
  const deleteTopic = useDeleteTopic();
  const pinTopic = usePinTopic();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const rows = topics.data ?? [];
    const needle = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false;
      if (!needle) return true;
      return (
        row.title.toLowerCase().includes(needle) ||
        row.slug.toLowerCase().includes(needle) ||
        (row.description ?? '').toLowerCase().includes(needle)
      );
    });
  }, [topics.data, categoryFilter, search]);

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Управление темами доступно только владельцу.
      </p>
    );
  }

  const remove = async (item: TopicSummary) => {
    if (!window.confirm(`Удалить тему «${item.title}»?`)) return;

    try {
      await deleteTopic.mutateAsync(item.id);
      toast.success('Тема удалена');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить тему'));
    }
  };

  const togglePin = async (item: TopicSummary) => {
    try {
      await pinTopic.mutateAsync({ id: item.id, pin: !item.isPinned });
      toast.success(item.isPinned ? 'Закрепление снято' : 'Тема закреплена');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось изменить закрепление'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Темы</h1>
          <p className="text-sm text-muted-foreground">Правила, документы и внутренние материалы</p>
        </div>
        <Button asChild>
          <Link href="/admin/topics/new">
            <Plus className="mr-2 h-4 w-4" />
            Создать
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или slug"
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {Object.entries(TOPIC_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="Нет тем"
          description="Создайте первую тему"
          action={
            <Button asChild>
              <Link href="/admin/topics/new">
                <Plus className="mr-2 h-4 w-4" />
                Создать
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="glass-medium border-white/5">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Видимость</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/admin/topics/${item.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.slug}</p>
                    </TableCell>
                    <TableCell>{TOPIC_CATEGORY_LABELS[item.category as TopicCategory]}</TableCell>
                    <TableCell>{TOPIC_VISIBILITY_LABELS[item.visibility]}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.isActive ? (
                          <Badge variant="secondary">активна</Badge>
                        ) : (
                          <Badge variant="outline">скрыта</Badge>
                        )}
                        {item.isPinned ? <Badge variant="outline">закреплена</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void togglePin(item)}
                          aria-label={item.isPinned ? 'Открепить' : 'Закрепить'}
                        >
                          {item.isPinned ? (
                            <PinOff className="h-4 w-4" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void remove(item)}
                          aria-label="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
