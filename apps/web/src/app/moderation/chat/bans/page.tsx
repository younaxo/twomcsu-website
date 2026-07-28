'use client';

import { Ban } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, extractErrorMessage } from '@/lib/api';

type BanRow = {
  id: string;
  reason: string;
  bannedUntil: string | null;
  user: { id: string; username: string };
};

export default function AdminChatBansPage() {
  const [items, setItems] = useState<BanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<BanRow[]>('/admin/chat/bans');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, '╨¥╨╡ ╤â╨┤╨░╨╗╨╛╤ü╤î ╨╖╨░╨│╤Ç╤â╨╖╨╕╤é╤î ╨▒╨░╨╜╤ï'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unban = async (id: string) => {
    try {
      await api.delete(`/admin/chat/bans/${id}`);
      toast.success('╨æ╨░╨╜ ╤ü╨╜╤Å╤é');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="╨æ╨░╨╜╤ï ╤ç╨░╤é╨░" description="╨É╨║╤é╨╕╨▓╨╜╤ï╨╡ ╨▒╨╗╨╛╨║╨╕╤Ç╨╛╨▓╨║╨╕" />
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <AdminEmptyState icon={Ban} title="╨É╨║╤é╨╕╨▓╨╜╤ï╤à ╨▒╨░╨╜╨╛╨▓ ╨╜╨╡╤é" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>╨ÿ╨│╤Ç╨╛╨║</TableHead>
                <TableHead>╨ƒ╤Ç╨╕╤ç╨╕╨╜╨░</TableHead>
                <TableHead>╨ö╨╛</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.user.username}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                  <TableCell>
                    {row.bannedUntil
                      ? new Date(row.bannedUntil).toLocaleString('ru-RU')
                      : '╨¥╨░╨▓╤ü╨╡╨│╨┤╨░'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => void unban(row.id)}>
                      ╨í╨╜╤Å╤é╤î
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
