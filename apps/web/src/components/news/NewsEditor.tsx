'use client';

import {
  NEWS_CATEGORY_LABELS,
  NewsCategory,
  NewsStatus,
  type CreateNewsPayload,
  type NewsAdminItem,
} from '@twomc/shared';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateNews,
  useUpdateNews,
  useUploadNewsImage,
} from '@/hooks/news';
import { NewsContent } from './NewsContent';

function slugifyClient(title: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return title
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

interface NewsEditorProps {
  initial?: NewsAdminItem;
}

export function NewsEditor({ initial }: NewsEditorProps) {
  const router = useRouter();
  const create = useCreateNews();
  const update = useUpdateNews(initial?.id ?? '');
  const upload = useUploadNewsImage();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [category, setCategory] = useState<NewsCategory>(
    initial?.category ?? NewsCategory.ANNOUNCEMENT,
  );
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [allowComments, setAllowComments] = useState(initial?.allowComments ?? true);
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? '');
  const [scheduledFor, setScheduledFor] = useState(
    initial?.scheduledFor ? initial.scheduledFor.slice(0, 16) : '',
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = useRef(false);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyClient(title));
    }
  }, [title, slugTouched]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const buildPayload = useCallback(
    (status: NewsStatus): CreateNewsPayload => ({
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      content,
      category,
      coverImage: coverImage.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      allowComments,
      isPinned,
      isFeatured,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      status,
      scheduledFor: status === NewsStatus.SCHEDULED ? scheduledFor || null : null,
    }),
    [
      title,
      slug,
      excerpt,
      content,
      category,
      coverImage,
      tags,
      allowComments,
      isPinned,
      isFeatured,
      metaTitle,
      metaDescription,
      scheduledFor,
    ],
  );

  const persist = async (status: NewsStatus, navigate = true) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Заголовок и контент обязательны');
      return;
    }

    setSaveState('saving');
    try {
      const payload = buildPayload(status);
      if (initial?.id) {
        await update.mutateAsync(payload);
        toast.success('Сохранено');
      } else {
        const created = await create.mutateAsync(payload);
        toast.success('Новость создана');
        if (navigate) {
          router.replace(`/admin/news/${created.id}/edit`);
        }
      }
      dirty.current = false;
      setSaveState('saved');
    } catch {
      setSaveState('error');
      toast.error('Ошибка сохранения');
    }
  };

  useEffect(() => {
    if (!initial?.id) return;
    const timer = setInterval(() => {
      if (!dirty.current) return;
      void persist(NewsStatus.DRAFT, false);
    }, 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id, buildPayload]);

  const onCoverFile = async (file: File | null) => {
    if (!file) return;
    try {
      const url = await upload.mutateAsync(file);
      setCoverImage(url);
      dirty.current = true;
      toast.success('Обложка загружена');
    } catch {
      toast.error('Не удалось загрузить обложку');
    }
  };

  const onContentImage = async (file: File) => {
    try {
      const url = await upload.mutateAsync(file);
      setContent((prev) => `${prev}\n\n![image](${url})\n`);
      dirty.current = true;
    } catch {
      toast.error('Не удалось загрузить изображение');
    }
  };

  const markDirty = () => {
    dirty.current = true;
    setSaveState('idle');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-white">
            {initial ? 'Редактирование новости' : 'Новая новость'}
          </h1>
          <span className="text-xs text-muted-foreground">
            {saveState === 'saving'
              ? 'Сохранение...'
              : saveState === 'saved'
                ? 'Сохранено'
                : saveState === 'error'
                  ? 'Ошибка'
                  : ''}
          </span>
        </div>

        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder="Заголовок *"
        />
        <Input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
            markDirty();
          }}
          placeholder="URL slug"
        />
        <Textarea
          value={excerpt}
          onChange={(e) => {
            setExcerpt(e.target.value.slice(0, 300));
            markDirty();
          }}
          placeholder="Краткое описание (до 300 символов)"
          rows={3}
        />

        <div
          className="grid gap-3 md:grid-cols-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file?.type.startsWith('image/')) {
              void onContentImage(file);
            }
          }}
        >
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              markDirty();
            }}
            placeholder="Markdown контент..."
            rows={22}
            className="font-mono text-sm"
          />
          <div className="max-h-[560px] overflow-auto rounded-xl glass-medium p-4">
            <p className="mb-2 text-xs text-muted-foreground">Превью</p>
            <NewsContent content={content || '_Пусто_'} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void persist(NewsStatus.DRAFT)}>
            Сохранить как черновик
          </Button>
          <Button type="button" onClick={() => void persist(NewsStatus.PUBLISHED)}>
            Опубликовать
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!scheduledFor) {
                toast.error('Укажите дату в блоке планирования');
                return;
              }
              void persist(NewsStatus.SCHEDULED);
            }}
          >
            Запланировать
          </Button>
          {initial?.status === NewsStatus.PUBLISHED ? (
            <Button type="button" variant="ghost" onClick={() => void persist(NewsStatus.DRAFT)}>
              Снять с публикации
            </Button>
          ) : null}
          {initial ? (
            <Button type="button" variant="ghost" onClick={() => void persist(NewsStatus.ARCHIVED)}>
              В архив
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/news')}>
            Отмена
          </Button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-2xl glass-medium p-4">
          <p className="text-sm font-semibold text-white">Обложка</p>
          {coverImage ? (
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image src={coverImage} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => void onCoverFile(e.target.files?.[0] ?? null)}
          />
          <Input
            value={coverImage}
            onChange={(e) => {
              setCoverImage(e.target.value);
              markDirty();
            }}
            placeholder="Или URL обложки"
          />
        </div>

        <div className="space-y-3 rounded-2xl glass-medium p-4">
          <p className="text-sm font-semibold text-white">Категория</p>
          <select
            className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as NewsCategory);
              markDirty();
            }}
          >
            {Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 rounded-2xl glass-medium p-4">
          <p className="text-sm font-semibold text-white">Теги</p>
          <Input
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              markDirty();
            }}
            placeholder="через запятую"
          />
        </div>

        <div className="space-y-3 rounded-2xl glass-medium p-4">
          <p className="text-sm font-semibold text-white">Настройки</p>
          <label className="flex items-center justify-between gap-2 text-sm">
            Разрешить комментарии
            <Switch checked={allowComments} onCheckedChange={(v) => { setAllowComments(v); markDirty(); }} />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm">
            Закрепить
            <Switch checked={isPinned} onCheckedChange={(v) => { setIsPinned(v); markDirty(); }} />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm">
            Featured (на главной)
            <Switch checked={isFeatured} onCheckedChange={(v) => { setIsFeatured(v); markDirty(); }} />
          </label>
        </div>

        <div className="space-y-3 rounded-2xl glass-medium p-4">
          <p className="text-sm font-semibold text-white">SEO</p>
          <Input
            value={metaTitle}
            onChange={(e) => { setMetaTitle(e.target.value); markDirty(); }}
            placeholder="Meta title"
          />
          <Textarea
            value={metaDescription}
            onChange={(e) => { setMetaDescription(e.target.value); markDirty(); }}
            placeholder="Meta description"
            rows={3}
          />
        </div>

        <div className="space-y-3 rounded-2xl glass-medium p-4">
          <p className="text-sm font-semibold text-white">Планирование</p>
          <Input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => { setScheduledFor(e.target.value); markDirty(); }}
          />
        </div>
      </aside>
    </div>
  );
}
