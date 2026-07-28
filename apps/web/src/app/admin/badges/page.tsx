'use client';

import type { UserBadge, UserBadgeType, UserSearchResult } from '@twomc/shared';
import { userBadgeTypeOrder } from '@twomc/shared';
import { BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { UserBadgeIcon } from '@/components/shared/UserBadgeIcon';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';
import { userBadgeLabels } from '@/lib/profile';

export default function AdminBadgesPage() {
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [type, setType] = useState<UserBadgeType>('VERIFIED');
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  const openUser = async (user: UserSearchResult) => {
    setSelected(user);
    try {
      const { data } = await api.get<UserBadge[]>(`/admin/users/${user.id}/badges`);
      setBadges(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить бейджи'));
    }
  };

  const grant = async () => {
    if (!selected) return;
    try {
      const { data } = await api.post<UserBadge>(`/admin/users/${selected.id}/badges`, { type });
      setBadges((prev) => {
        const rest = prev.filter((badge) => badge.type !== data.type);
        return [...rest, data];
      });
      toast.success('Бейдж выдан');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выдать бейдж'));
    }
  };

  const revoke = async (badgeType: UserBadgeType) => {
    if (!selected) return;
    try {
      await api.delete(`/admin/users/${selected.id}/badges/${badgeType}`);
      setBadges((prev) => prev.filter((badge) => badge.type !== badgeType));
      toast.success('Бейдж снят');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось снять бейдж'));
    }
  };

  const disableComments = async () => {
    if (!selected || !disableReason.trim()) {
      toast.error('Укажите причину');
      return;
    }

    try {
      await api.post(`/admin/users/${selected.id}/comments/disable`, {
        reason: disableReason.trim(),
      });
      toast.success('Комментарии отключены');
      setDisableOpen(false);
      setDisableReason('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отключить комментарии'));
    }
  };

  const enableComments = async () => {
    if (!selected) return;
    try {
      await api.post(`/admin/users/${selected.id}/comments/enable`);
      toast.success('Комментарии включены');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось включить комментарии'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Бейджи</h1>
        <p className="text-sm text-muted-foreground">Выдача и снятие префиксов</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск игрока</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserSearchInput
            placeholder="Никнейм, email, #123 или tag"
            onSelect={(user) => void openUser(user)}
          />
        </CardContent>
      </Card>

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>{selected.username}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 rounded-md border p-2">
                  <UserBadgeIcon type={badge.type} />
                  <span className="text-sm">{userBadgeLabels[badge.type]}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void revoke(badge.type)}
                  >
                    Забрать
                  </Button>
                </div>
              ))}
              {badges.length === 0 ? (
                <AdminEmptyState
                  icon={BadgeCheck}
                  title="Бейджей нет"
                  description="Выдайте бейдж этому игроку"
                  className="w-full py-8"
                />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={type} onValueChange={(value) => setType(value as UserBadgeType)}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userBadgeTypeOrder.map((item) => (
                    <SelectItem key={item} value={item}>
                      {userBadgeLabels[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => void grant()}>
                Выдать бейдж
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button type="button" variant="destructive" onClick={() => setDisableOpen(true)}>
                Отключить комментарии
              </Button>
              <Button type="button" variant="outline" onClick={() => void enableComments()}>
                Включить комментарии
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отключить комментарии</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Причина</Label>
            <Textarea
              value={disableReason}
              maxLength={500}
              onChange={(event) => setDisableReason(event.target.value)}
              placeholder="Почему комментарии отключаются"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={() => void disableComments()}>
              Отключить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
