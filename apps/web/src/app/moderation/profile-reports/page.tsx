'use client';

import type { ProfileReport } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ShieldAlert } from 'lucide-react';
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
import { profileReportLabels } from '@/lib/profile';

export default function AdminProfileReportsPage() {
  const [rows, setRows] = useState<ProfileReport[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<ProfileReport[]>('/admin/profile-reports');
      setRows(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, '╨¥╨╡ ╤â╨┤╨░╨╗╨╛╤ü╤î ╨╖╨░╨│╤Ç╤â╨╖╨╕╤é╤î ╨╢╨░╨╗╨╛╨▒╤ï'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: 'RESOLVED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/profile-reports/${id}`, { status });
      toast.success(status === 'RESOLVED' ? '╨û╨░╨╗╨╛╨▒╨░ ╨╖╨░╨║╤Ç╤ï╤é╨░' : '╨û╨░╨╗╨╛╨▒╨░ ╨╛╤é╨║╨╗╨╛╨╜╨╡╨╜╨░');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, '╨¥╨╡ ╤â╨┤╨░╨╗╨╛╤ü╤î ╨╛╨▒╤Ç╨░╨▒╨╛╤é╨░╤é╤î ╨╢╨░╨╗╨╛╨▒╤â'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">╨û╨░╨╗╨╛╨▒╤ï ╨╜╨░ ╨┐╤Ç╨╛╤ä╨╕╨╗╨╕</h1>
        <p className="text-sm text-muted-foreground">╨£╨╛╨┤╨╡╤Ç╨░╤å╨╕╤Å ╨╢╨░╨╗╨╛╨▒</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>╨₧╤ç╨╡╤Ç╨╡╨┤╤î</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <AdminEmptyState
              icon={ShieldAlert}
              title="╨û╨░╨╗╨╛╨▒ ╨╜╨╡╤é"
              description="╨₧╤ç╨╡╤Ç╨╡╨┤╤î ╨╝╨╛╨┤╨╡╤Ç╨░╤å╨╕╨╕ ╨┐╤â╤ü╤é╨░"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>╨ƒ╤Ç╨╛╤ä╨╕╨╗╤î</TableHead>
                  <TableHead>╨₧╤é ╨║╨╛╨│╨╛</TableHead>
                  <TableHead>╨ƒ╤Ç╨╕╤ç╨╕╨╜╨░</TableHead>
                  <TableHead>╨í╤é╨░╤é╤â╤ü</TableHead>
                  <TableHead>╨ö╨░╤é╨░</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <ColoredUsername user={row.profile} size="sm" />
                    </TableCell>
                    <TableCell>
                      <ColoredUsername user={row.reporter} size="sm" />
                    </TableCell>
                    <TableCell>{profileReportLabels[row.reason]}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      {format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {row.status === 'PENDING' ? (
                        <>
                          <Button type="button" size="sm" onClick={() => void review(row.id, 'RESOLVED')}>
                            ╨ù╨░╨║╤Ç╤ï╤é╤î
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
