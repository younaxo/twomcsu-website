'use client';

import type { Award, UserSearchResult } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AwardIcon } from '@/components/shared/AwardIcon';
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
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

  const search = async () => {
    if (query.trim().length < 2) return;
    try {
      const { data } = await api.get<UserSearchResult[]>('/users/search', {
        params: { q: query.trim() },
      });
      setResults(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось найти игроков'));
    }
  };

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
          <div className="flex gap-2">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Никнейм" />
            <Button type="button" onClick={() => void search()}>
              Найти
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.map((row) => (
              <Button
                key={row.id}
                type="button"
                size="sm"
                variant={selectedUser?.id === row.id ? 'default' : 'outline'}
                onClick={() => setSelectedUser(row)}
              >
                {row.username}
              </Button>
            ))}
          </div>
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
