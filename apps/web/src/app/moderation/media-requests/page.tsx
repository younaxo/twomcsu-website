'use client';

import type { MediaBadgeRequestAdmin } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clapperboard } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, extractErrorMessage } from '@/lib/api';
import { mediaGroupLabels } from '@/lib/profile';

export default function AdminMediaRequestsPage() {
  const [rows, setRows] = useState<MediaBadgeRequestAdmin[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<MediaBadgeRequestAdmin[]>('/admin/media-requests');
      setRows(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, '╨¥╨╡ ╤â╨┤╨░╨╗╨╛╤ü╤î ╨╖╨░╨│╤Ç╤â╨╖╨╕╤é╤î ╨╖╨░╤Å╨▓╨║╨╕'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/media-requests/${id}`, { status });
      toast.success(status === 'APPROVED' ? '╨ù╨░╤Å╨▓╨║╨░ ╨╛╨┤╨╛╨▒╤Ç╨╡╨╜╨░' : '╨ù╨░╤Å╨▓╨║╨░ ╨╛╤é╨║╨╗╨╛╨╜╨╡╨╜╨░');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, '╨¥╨╡ ╤â╨┤╨░╨╗╨╛╤ü╤î ╨╛╨▒╤Ç╨░╨▒╨╛╤é╨░╤é╤î ╨╖╨░╤Å╨▓╨║╤â'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">╨£╨╡╨┤╨╕╨░-╨╖╨░╤Å╨▓╨║╨╕</h1>
        <p className="text-sm text-muted-foreground">╨£╨╛╨┤╨╡╤Ç╨░╤å╨╕╤Å ╨╖╨░╤Å╨▓╨╛╨║ ╨╜╨░ ╨╝╨╡╨┤╨╕╨░-╨▒╨╡╨╣╨┤╨╢</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>╨₧╤ç╨╡╤Ç╨╡╨┤╤î</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <AdminEmptyState
              icon={Clapperboard}
              title="╨ù╨░╤Å╨▓╨╛╨║ ╨╜╨╡╤é"
              description="╨¥╨╛╨▓╤ï╤à ╨╝╨╡╨┤╨╕╨░-╨╖╨░╤Å╨▓╨╛╨║ ╨┐╨╛╨║╨░ ╨╜╨╡╤é"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>╨ÿ╨│╤Ç╨╛╨║</TableHead>
                  <TableHead>╨ƒ╨╗╨░╤é╤ä╨╛╤Ç╨╝╨░</TableHead>
                  <TableHead>╨Ü╨░╨╜╨░╨╗</TableHead>
                  <TableHead>╨í╤é╨░╤é╤â╤ü</TableHead>
                  <TableHead>╨ö╨░╤é╨░</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <ColoredUsername user={row.user} size="sm" />
                    </TableCell>
                    <TableCell>{mediaGroupLabels[row.mediaGroup]}</TableCell>
                    <TableCell>
                      <a href={row.channelUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        ╤ü╤ü╤ï╨╗╨║╨░
                      </a>
                    </TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      {format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {row.status === 'PENDING' ? (
                        <>
                          <Button type="button" size="sm" onClick={() => void review(row.id, 'APPROVED')}>
                            ╨₧╨┤╨╛╨▒╤Ç╨╕╤é╤î
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void review(row.id, 'REJECTED')}
                          >
                            ╨₧╤é╨║╨╗╨╛╨╜╨╕╤é╤î
                          </Button>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
