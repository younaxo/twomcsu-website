'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PositionSummary, RoleGroup, roleGroupOrder } from '@twomc/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(64),
  slug: z
    .string()
    .trim()
    .min(2, 'Минимум 2 символа')
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Только строчные латинские буквы, цифры и дефис'),
  displayName: z.string().trim().min(2, 'Минимум 2 символа').max(64),
  group: z.enum(roleGroupOrder as [RoleGroup, ...RoleGroup[]]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Формат #RRGGBB'),
  backgroundColor: z
    .string()
    .regex(/^$|^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, 'Формат #RRGGBB или #RRGGBBAA'),
  icon: z.string().max(255),
  priority: z.number().int().min(0, 'От 0 до 1000').max(1000, 'От 0 до 1000'),
  description: z.string().max(500),
  isVisible: z.boolean(),
  isDefault: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: '',
  slug: '',
  displayName: '',
  group: RoleGroup.PLAYER,
  color: '#95A5A6',
  backgroundColor: '',
  icon: '',
  priority: 0,
  description: '',
  isVisible: true,
  isDefault: false,
};

interface PositionFormDialogProps {
  open: boolean;
  position: PositionSummary | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PositionFormDialog({
  open,
  position,
  onOpenChange,
  onSaved,
}: PositionFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      position
        ? {
            name: position.name,
            slug: position.slug,
            displayName: position.displayName,
            group: position.group,
            color: position.color,
            backgroundColor: position.backgroundColor ?? '',
            icon: position.icon ?? '',
            priority: position.priority,
            description: position.description ?? '',
            isVisible: position.isVisible,
            isDefault: position.isDefault,
          }
        : emptyValues,
    );
  }, [form, open, position]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = schema.parse(values);

      if (position) {
        await api.patch(`/positions/${position.id}`, payload);
        toast.success('Позиция обновлена');
      } else {
        await api.post('/positions', payload);
        toast.success('Позиция создана');
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить позицию'));
    }
  });

  // slug follows the name until the position exists, after that it stays put
  const syncSlug = (name: string) => {
    if (position) {
      return;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    form.setValue('slug', slug);
    form.setValue('displayName', name);
  };

  const color = form.watch('color');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{position ? 'Редактирование позиции' : 'Новая позиция'}</DialogTitle>
          <DialogDescription>
            Права даёт только группа, позиция отвечает за оформление ника.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Название позиции"
                      onChange={(event) => {
                        field.onChange(event);
                        syncSlug(event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="строчная латиница и дефис" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Отображаемое название</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Название в бейдже" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Группа</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...roleGroupOrder].reverse().map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Приоритет</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цвет ника</FormLabel>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#95A5A6'}
                        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
                        aria-label="Выбрать цвет"
                      />
                      <FormControl>
                        <Input {...field} placeholder="#RRGGBB" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фон бейджа</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="пусто — прозрачный" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Иконка</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="эмодзи или ссылка на картинку" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Видна в списке</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">По умолчанию в группе</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {position ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
