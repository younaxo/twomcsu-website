'use client';

import type { Achievement } from '@twomc/shared';
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_RARITY_LABELS,
  AchievementCategory,
  AchievementConditionType,
  AchievementRarity,
} from '@twomc/shared';
import { Plus, RefreshCw, Trash2, Trophy, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { api, extractErrorMessage } from '@/lib/api';

type DraftAchievement = {
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  isSecret: boolean;
  conditionType: AchievementConditionType;
  conditionValue: string;
  rewardRubies: string;
  rewardTitle: string;
  rewardMessage: string;
};

const emptyDraft: DraftAchievement = {
  name: '',
  slug: '',
  description: '',
  iconUrl: '',
  category: AchievementCategory.GAME,
  rarity: AchievementRarity.COMMON,
  isSecret: false,
  conditionType: AchievementConditionType.MANUAL,
  conditionValue: '',
  rewardRubies: '50',
  rewardTitle: '',
  rewardMessage: '',
};

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [draft, setDraft] = useState<DraftAchievement>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [isCreating, setCreating] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Achievement[]>('/admin/achievements');
      setAchievements(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить достижения'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ...draft,
        conditionValue: draft.conditionValue ? Number(draft.conditionValue) : null,
        rewardRubies: Number(draft.rewardRubies) || 0,
        rewardTitle: draft.rewardTitle || null,
        rewardMessage: draft.rewardMessage || null,
      };
      if (editId) {
        await api.patch(`/admin/achievements/${editId}`, payload);
        toast.success('Достижение обновлено');
      } else {
        await api.post('/admin/achievements', payload);
        toast.success('Достижение создано');
      }
      setDraft(emptyDraft);
      setEditId(null);
      setCreating(false);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить достижение?')) return;
    try {
      await api.delete(`/admin/achievements/${id}`);
      toast.success('Достижение удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить'));
    }
  };

  const startEdit = (achievement: Achievement) => {
    setDraft({
      name: achievement.name,
      slug: achievement.slug,
      description: achievement.description,
      iconUrl: achievement.iconUrl,
      category: achievement.category,
      rarity: achievement.rarity,
      isSecret: achievement.isSecret,
      conditionType: achievement.conditionType,
      conditionValue: achievement.conditionValue?.toString() ?? '',
      rewardRubies: achievement.rewardRubies.toString(),
      rewardTitle: achievement.rewardTitle ?? '',
      rewardMessage: achievement.rewardMessage ?? '',
    });
    setEditId(achievement.id);
    setCreating(true);
  };

  const uploadIcon = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post<{ url: string }>('/admin/achievements/upload-icon', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDraft((prev) => ({ ...prev, iconUrl: data.url }));
      toast.success('Иконка загружена');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить иконку'));
    }
  };

  const checkAllUsers = async () => {
    try {
      await api.post('/admin/achievements/check-all-users');
      toast.success('Проверка запущена');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось запустить проверку'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Достижения</h1>
          <p className="text-sm text-muted-foreground">Управление каталогом достижений</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void checkAllUsers()}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Проверить всех
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setDraft(emptyDraft);
              setEditId(null);
              setCreating(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Создать
          </Button>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Каталог ({achievements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <AdminEmptyState
              icon={Trophy}
              title="Нет достижений"
              description="Создайте первое достижение"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Редкость</TableHead>
                  <TableHead>Условие</TableHead>
                  <TableHead>Получений</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => startEdit(a)}
                  >
                    <TableCell className="font-medium">
                      {a.isSecret ? <span className="text-muted-foreground">[С]</span> : null}{' '}
                      {a.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.slug}</TableCell>
                    <TableCell>{ACHIEVEMENT_CATEGORY_LABELS[a.category]}</TableCell>
                    <TableCell>{ACHIEVEMENT_RARITY_LABELS[a.rarity]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.conditionType}
                      {a.conditionValue != null ? ` / ${a.conditionValue}` : ''}
                    </TableCell>
                    <TableCell>{a.unlockedCount}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          void remove(a.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit form */}
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? 'Редактировать достижение' : 'Новое достижение'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Описание</Label>
                <Input
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label>URL иконки</Label>
                <div className="flex gap-2">
                  <Input
                    value={draft.iconUrl}
                    onChange={(e) => setDraft({ ...draft, iconUrl: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => iconInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadIcon(file);
                    }}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft({ ...draft, category: v as AchievementCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AchievementCategory).map((c) => (
                      <SelectItem key={c} value={c}>
                        {ACHIEVEMENT_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rarity */}
              <div className="space-y-2">
                <Label>Редкость</Label>
                <Select
                  value={draft.rarity}
                  onValueChange={(v) => setDraft({ ...draft, rarity: v as AchievementRarity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AchievementRarity).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ACHIEVEMENT_RARITY_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition type */}
              <div className="space-y-2">
                <Label>Тип условия</Label>
                <Select
                  value={draft.conditionType}
                  onValueChange={(v) =>
                    setDraft({ ...draft, conditionType: v as AchievementConditionType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AchievementConditionType).map((ct) => (
                      <SelectItem key={ct} value={ct}>
                        {ct}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition value */}
              <div className="space-y-2">
                <Label>Значение условия</Label>
                <Input
                  type="number"
                  value={draft.conditionValue}
                  onChange={(e) => setDraft({ ...draft, conditionValue: e.target.value })}
                  placeholder="Оставьте пустым для MANUAL"
                />
              </div>

              {/* Reward rubies */}
              <div className="space-y-2">
                <Label>Рубины (награда)</Label>
                <Input
                  type="number"
                  value={draft.rewardRubies}
                  onChange={(e) => setDraft({ ...draft, rewardRubies: e.target.value })}
                />
              </div>

              {/* Reward title */}
              <div className="space-y-2">
                <Label>Титул (награда)</Label>
                <Input
                  value={draft.rewardTitle}
                  onChange={(e) => setDraft({ ...draft, rewardTitle: e.target.value })}
                  placeholder="Необязательно"
                />
              </div>

              {/* Reward message */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Сообщение при получении</Label>
                <Input
                  value={draft.rewardMessage}
                  onChange={(e) => setDraft({ ...draft, rewardMessage: e.target.value })}
                  placeholder="Необязательно"
                />
              </div>

              {/* Secret */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isSecret}
                  onChange={(e) => setDraft({ ...draft, isSecret: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                Секретное достижение
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={() => void save()} disabled={isBusy}>
                {isBusy ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreating(false);
                  setEditId(null);
                  setDraft(emptyDraft);
                }}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
