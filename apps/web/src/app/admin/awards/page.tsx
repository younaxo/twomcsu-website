'use client';

import type { Award, UserSearchResult } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { AwardIcon } from '@/components/shared/AwardIcon';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
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
import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/lib/api';

export default function AdminAwardsPage() {
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;
  const [awards, setAwards] = useState<Award[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [awardId, setAwardId] = useState('');
  const [draft, setDraft] = useState({
    name: '',
    slug: '',
    description: '',
    iconUrl: '/awards/star.png',
    rarity: 'common',
  });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Award[]>('/admin/awards');
      setAwards(data);
      if (!awardId && data[0]) setAwardId(data[0].id);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить награды'));
    }
  }, [awardId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    try {
      await api.post('/admin/awards', draft);
      toast.success('Награда создана');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось создать награду'));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить награду?')) return;
    try {
      await api.delete(`/admin/awards/${id}`);
      toast.success('Награда удалена');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить награду'));
    }
  };

  const assign = async () => {
    if (!selectedUser || !awardId) return;
    try {
      await api.post(`/admin/users/${selectedUser.id}/awards/${awardId}`);
      toast.success('Награда выдана');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выдать награду'));
    }
  };

  const revoke = async () => {
    if (!selectedUser || !awardId) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}/awards/${awardId}`);
      toast.success('Награда снята');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось снять награду'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Награды</h1>
        <p className="text-sm text-muted-foreground">Каталог наград и выдача игрокам</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Каталог</CardTitle>
        </CardHeader>
        <CardContent>
          {awards.length === 0 ? (
            <AdminEmptyState
              icon={Trophy}
              title="Нет наград"
              description="Создайте первую награду в каталоге"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Иконка</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Rarity</TableHead>
                  {isOwner ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {awards.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>
                      <AwardIcon award={award} size={28} />
                    </TableCell>
                    <TableCell>{award.name}</TableCell>
                    <TableCell>{award.slug}</TableCell>
                    <TableCell>{award.rarity ?? '—'}</TableCell>
                    {isOwner ? (
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => void remove(award.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Создать награду</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Описание</Label>
              <Input
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon URL</Label>
              <Input
                value={draft.iconUrl}
                onChange={(event) => setDraft({ ...draft, iconUrl: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Input
                value={draft.rarity}
                onChange={(event) => setDraft({ ...draft, rarity: event.target.value })}
              />
            </div>
            <Button type="button" className="sm:col-span-2" onClick={() => void create()}>
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Выдать игроку</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserSearchInput
            placeholder="Никнейм, email, #123 или tag"
            onSelect={setSelectedUser}
          />
          {selectedUser ? (
            <p className="text-sm text-muted-foreground">
              Выбран: <span className="font-medium text-foreground">{selectedUser.username}</span>{' '}
              <span className="text-muted-foreground">#{selectedUser.shortId}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Select value={awardId} onValueChange={setAwardId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Награда" />
              </SelectTrigger>
              <SelectContent>
                {awards.map((award) => (
                  <SelectItem key={award.id} value={award.id}>
                    {award.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={() => void assign()} disabled={!selectedUser}>
              Выдать
            </Button>
            <Button type="button" variant="outline" onClick={() => void revoke()} disabled={!selectedUser}>
              Забрать
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
