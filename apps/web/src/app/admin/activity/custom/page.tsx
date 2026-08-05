'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCustomActivity } from '@/hooks/activity';

export default function AdminActivityCustomPage() {
  const create = useCreateCustomActivity();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [type, setType] = useState<'CUSTOM' | 'EVENT_ANNOUNCED'>('CUSTOM');
  const [isPinned, setIsPinned] = useState(true);

  const submit = async () => {
    if (!title.trim()) {
      toast.error('Укажите заголовок');
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
        type,
        isPinned,
      });
      toast.success('Активность создана');
      setTitle('');
      setDescription('');
      setImageUrl('');
      setActionUrl('');
    } catch {
      toast.error('Не удалось создать');
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <AdminPageHeader
        title="Кастомная активность"
        description="Объявления и ивенты в ленте"
      />

      <div className="space-y-4 rounded-2xl glass-medium p-5">
        <div className="space-y-2">
          <Label htmlFor="title">Заголовок</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">URL изображения</Label>
          <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actionUrl">Ссылка</Label>
          <Input id="actionUrl" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Тип</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOM">Объявление</SelectItem>
              <SelectItem value="EVENT_ANNOUNCED">Ивент</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="pinned">Закрепить</Label>
          <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} />
        </div>
        <Button type="button" onClick={() => void submit()} disabled={create.isPending}>
          Создать
        </Button>
      </div>
    </div>
  );
}
