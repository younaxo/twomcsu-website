'use client';
/* eslint-disable @next/next/no-img-element */

import { DecorationAvailability, decorationAvailabilityLabels } from '@twomc/shared';
import { Gift, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Switch } from '@/components/ui/switch';
import { api, extractErrorMessage } from '@/lib/api';

type AdminDecoration = {
  id: string;
  name: string;
  imageUrl: string;
  availability: DecorationAvailability;
  isActive: boolean;
  _count: { owners: number };
};
type OwnershipUser = {
  id: string;
  username: string;
  selectedDecorationId: string | null;
  ownedDecorations: Array<{ decorationId: string; decoration: AdminDecoration }>;
};

export default function AdminDecorationsPage() {
  const [decorations, setDecorations] = useState<AdminDecoration[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [user, setUser] = useState<OwnershipUser | null>(null);
  const [selected, setSelected] = useState('');
  const load = useCallback(async () => {
    try {
      setDecorations((await api.get<AdminDecoration[]>('/admin/decorations')).data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить украшения'));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const findUser = async () => {
    try {
      setUser(
        (
          await api.get<OwnershipUser>('/admin/decorations/ownerships', {
            params: { user: identifier },
          })
        ).data,
      );
    } catch (error) {
      setUser(null);
      toast.error(extractErrorMessage(error, 'Пользователь не найден'));
    }
  };
  const grant = async () => {
    if (!selected || !identifier) return;
    try {
      await api.post('/admin/decorations/grant', { user: identifier, decorationId: selected });
      toast.success('Украшение выдано');
      await Promise.all([load(), findUser()]);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выдать украшение'));
    }
  };
  const revoke = async (decorationId: string) => {
    if (!user || !window.confirm('Отозвать украшение у пользователя?')) return;
    try {
      await api.delete(`/admin/decorations/${decorationId}/users/${user.id}`);
      toast.success('Украшение отозвано');
      await Promise.all([load(), findUser()]);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отозвать украшение'));
    }
  };
  const update = async (
    id: string,
    patch: Partial<Pick<AdminDecoration, 'availability' | 'isActive'>>,
  ) => {
    try {
      await api.patch(`/admin/decorations/${id}`, patch);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить украшение'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Украшения профиля</h1>
        <p className="text-sm text-muted-foreground">
          Каталог, доступность и ручная выдача всех украшений
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Выдать пользователю
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ник, #ID, тег или email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void findUser()}
            />
            <Button variant="secondary" onClick={() => void findUser()}>
              <Search className="mr-2 h-4 w-4" />
              Найти
            </Button>
          </div>
          {user ? (
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-medium">{user.username}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.ownedDecorations.length ? (
                  user.ownedDecorations.map((owned) => (
                    <span
                      key={owned.decorationId}
                      className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
                    >
                      <img
                        src={owned.decoration.imageUrl}
                        alt=""
                        className="h-8 w-8 object-contain"
                      />
                      {owned.decoration.name}
                      <button onClick={() => void revoke(owned.decorationId)} aria-label="Отозвать">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Украшений пока нет</span>
                )}
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите украшение" />
              </SelectTrigger>
              <SelectContent>
                {decorations.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => void grant()} disabled={!selected || !identifier}>
              Выдать
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {decorations.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="mx-auto aspect-square max-h-52 w-full object-contain"
              />
              <h3 className="mt-3">{item.name}</h3>
              <p className="text-xs text-muted-foreground">Выдано: {item._count.owners}</p>
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Доступность</Label>
                  <Select
                    value={item.availability}
                    onValueChange={(availability: DecorationAvailability) =>
                      void update(item.id, { availability })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(DecorationAvailability).map((value) => (
                        <SelectItem key={value} value={value}>
                          {decorationAvailabilityLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center justify-between text-sm">
                  Активно
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(isActive) => void update(item.id, { isActive })}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
