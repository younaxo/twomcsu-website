'use client';

import type { TopicDetails } from '@twomc/shared';
import {
  RoleGroup,
  TOPIC_PLACEHOLDER_CONTENT,
  TopicCategory,
  TopicVisibility,
  hasRoleGroup,
} from '@twomc/shared';
import { Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
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
import {
  useDeleteTopicAttachment,
  useSaveTopic,
  useUploadTopicAttachment,
} from '@/hooks/useTopics';
import { extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { slugifyTopicTitle, TOPIC_CATEGORY_LABELS, TOPIC_VISIBILITY_LABELS } from '@/lib/topic';

interface TopicEditorProps {
  topicId?: string;
  initial?: TopicDetails;
}

type FormState = {
  title: string;
  slug: string;
  category: TopicCategory;
  visibility: TopicVisibility;
  icon: string;
  color: string;
  description: string;
  content: string;
  order: number;
  isActive: boolean;
  isPinned: boolean;
};

const defaultForm: FormState = {
  title: '',
  slug: '',
  category: TopicCategory.RULES,
  visibility: TopicVisibility.PUBLIC,
  icon: '',
  color: '#3B82F6',
  description: '',
  content: TOPIC_PLACEHOLDER_CONTENT,
  order: 0,
  isActive: true,
  isPinned: false,
};

export function TopicEditor({ topicId, initial }: TopicEditorProps) {
  const router = useRouter();
  const saveTopic = useSaveTopic();
  const uploadAttachment = useUploadTopicAttachment();
  const deleteAttachment = useDeleteTopicAttachment();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [attachments, setAttachments] = useState(initial?.attachments ?? []);

  useEffect(() => {
    if (!initial) return;

    setForm({
      title: initial.title,
      slug: initial.slug,
      category: initial.category,
      visibility: initial.visibility,
      icon: initial.icon ?? '',
      color: initial.color ?? '#3B82F6',
      description: initial.description ?? '',
      content: initial.content,
      order: initial.order,
      isActive: initial.isActive,
      isPinned: initial.isPinned,
    });
    setAttachments(initial.attachments);
  }, [initial]);

  const syncTitle = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: topicId ? prev.slug : slugifyTopicTitle(title) || prev.slug,
    }));
  };

  const save = async () => {
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      category: form.category,
      visibility: form.visibility,
      icon: form.icon.trim() || undefined,
      color: form.color || undefined,
      description: form.description.trim() || undefined,
      content: form.content,
      order: form.order,
      isActive: form.isActive,
      isPinned: form.isPinned,
    };

    try {
      const saved = await saveTopic.mutateAsync({ id: topicId, payload });
      toast.success(topicId ? 'Тема обновлена' : 'Тема создана');
      router.push(`/admin/topics/${saved.id}/edit`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить тему'));
    }
  };

  const onUpload = async (file: File) => {
    if (!topicId) {
      toast.error('Сначала сохраните тему, затем загрузите вложения');
      return;
    }

    try {
      const updated = await uploadAttachment.mutateAsync({ id: topicId, file });
      setAttachments(updated.attachments);
      toast.success('Файл загружен');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить файл'));
    }
  };

  const onDeleteAttachment = async (attachmentId: string) => {
    if (!topicId) return;

    try {
      const updated = await deleteAttachment.mutateAsync({ id: topicId, attachmentId });
      setAttachments(updated.attachments);
      toast.success('Вложение удалено');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить вложение'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{topicId ? 'Редактирование темы' : 'Новая тема'}</h1>
          <p className="text-sm text-muted-foreground">Markdown поддерживается</p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/admin/topics">К списку</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl glass-medium p-5">
          <div className="space-y-2">
            <Label>Заголовок</Label>
            <Input value={form.title} onChange={(e) => syncTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, category: value as TopicCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOPIC_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Видимость</Label>
              <Select
                value={form.visibility}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, visibility: value as TopicVisibility }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOPIC_VISIBILITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Иконка (emoji или URL)</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Цвет</Label>
              <Input
                type="color"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Краткое описание</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Порядок</Label>
            <Input
              type="number"
              value={form.order}
              onChange={(e) =>
                setForm((p) => ({ ...p, order: Number.parseInt(e.target.value, 10) || 0 }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Активна</Label>
            <Switch
              checked={form.isActive}
              onCheckedChange={(isActive) => setForm((p) => ({ ...p, isActive }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Закреплена</Label>
            <Switch
              checked={form.isPinned}
              onCheckedChange={(isPinned) => setForm((p) => ({ ...p, isPinned }))}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl glass-medium p-5">
          <Label>Содержимое</Label>
          <MarkdownEditor
            value={form.content}
            onChange={(content) => setForm((p) => ({ ...p, content }))}
            minHeight={320}
            maxHeight={800}
            showPreview
            placeholder="Markdown содержимое темы..."
          />
        </div>
      </div>

      {topicId ? (
        <section className="space-y-3 rounded-2xl glass-medium p-5">
          <Label>Вложения</Label>
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
              e.target.value = '';
            }}
          />
          {attachments.length > 0 ? (
            <ul className="space-y-2">
              {attachments.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm"
                >
                  <a
                    href={resolveMediaUrl(file.fileUrl) ?? file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    {file.fileName}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void onDeleteAttachment(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Вложений пока нет</p>
          )}
        </section>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" />
          Вложения можно добавить после сохранения темы
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => void save()}
          disabled={!form.title.trim() || !form.slug.trim() || saveTopic.isPending}
        >
          Сохранить
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/admin/topics">Отмена</Link>
        </Button>
      </div>
    </div>
  );
}
