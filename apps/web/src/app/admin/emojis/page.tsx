'use client';

import type { CustomEmoji } from '@twomc/shared';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminCustomEmojis } from '@/hooks/markdown';
import { api, extractErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { resolveMediaUrl } from '@/lib/profile';

export default function AdminEmojisPage() {
  const queryClient = useQueryClient();
  const { data: emojis = [], isLoading } = useAdminCustomEmojis();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomEmoji | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('TWOMC');
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return emojis;
    return emojis.filter(
      (emoji) =>
        emoji.name.includes(q) ||
        (emoji.category ?? '').toLowerCase().includes(q),
    );
  }, [emojis, search]);

  const resetForm = () => {
    setName('');
    setCategory('TWOMC');
    setIsPremium(false);
    setIsActive(true);
    setFile(null);
    setPreviewUrl(null);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (emoji: CustomEmoji) => {
    setEditing(emoji);
    setName(emoji.name);
    setCategory(emoji.category ?? 'TWOMC');
    setIsPremium(emoji.isPremium);
    setIsActive(emoji.isActive);
    setFile(null);
    setPreviewUrl(resolveMediaUrl(emoji.imageUrl) ?? emoji.imageUrl);
    setOpen(true);
  };

  const onFileChange = (next: File | null) => {
    setFile(next);
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(
      next
        ? URL.createObjectURL(next)
        : editing
          ? (resolveMediaUrl(editing.imageUrl) ?? editing.imageUrl)
          : null,
    );
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Укажите имя эмодзи');
      return;
    }
    if (!editing && !file) {
      toast.error('Загрузите PNG или GIF');
      return;
    }

    const form = new FormData();
    form.append('name', name.trim().toLowerCase());
    form.append('category', category.trim() || 'TWOMC');
    form.append('isPremium', String(isPremium));
    if (editing) form.append('isActive', String(isActive));
    if (file) form.append('file', file);

    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/admin/emojis/${editing.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Эмодзи обновлён');
      } else {
        await api.post('/admin/emojis', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Эмодзи создан');
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCustomEmojis });
      await queryClient.invalidateQueries({ queryKey: queryKeys.customEmojis });
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить эмодзи'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (emoji: CustomEmoji) => {
    if (!window.confirm(`Удалить :${emoji.name}:?`)) return;
    try {
      await api.delete(`/admin/emojis/${emoji.id}`);
      toast.success('Эмодзи удалён');
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCustomEmojis });
      await queryClient.invalidateQueries({ queryKey: queryKeys.customEmojis });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Кастомные эмодзи</h1>
          <p className="text-sm text-muted-foreground">
            Shortcodes вида :name: для markdown и чата
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или категории"
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl glass-medium">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Превью</th>
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 font-medium">Флаги</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Загрузка...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Эмодзи не найдены
                </td>
              </tr>
            ) : (
              filtered.map((emoji) => (
                <tr key={emoji.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <Image
                      src={resolveMediaUrl(emoji.imageUrl) ?? emoji.imageUrl}
                      alt={emoji.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      unoptimized
                    />
                  </td>
                  <td className="px-4 py-3 font-mono">:{emoji.name}:</td>
                  <td className="px-4 py-3">{emoji.category ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {[
                      emoji.isActive ? 'active' : 'off',
                      emoji.isPremium ? 'premium' : null,
                      emoji.isAnimated ? 'gif' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(emoji)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => void remove(emoji)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="border-white/10 bg-[rgba(15,15,20,0.95)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать эмодзи' : 'Новый эмодзи'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Имя (shortcode)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="twomc"
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Файл PNG / GIF</Label>
              <Input
                type="file"
                accept="image/png,image/gif,image/webp"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
            {previewUrl ? (
              <div className="flex items-center gap-3 rounded-xl glass-medium p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="preview" className="h-12 w-12 object-contain" />
                <code className="text-sm">:{name || 'name'}:</code>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <Label>Premium</Label>
              <Switch checked={isPremium} onCheckedChange={setIsPremium} />
            </div>
            {editing ? (
              <div className="flex items-center justify-between">
                <Label>Активен</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
