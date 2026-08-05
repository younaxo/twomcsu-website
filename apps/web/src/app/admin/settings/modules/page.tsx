'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader, AdminTable } from '@/components/admin';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api, extractErrorMessage } from '@/lib/api';

type ModuleRow = {
  id: string;
  module: string;
  isEnabled: boolean;
  reason: string | null;
};

const moduleLabels: Record<string, string> = {
  store: 'Магазин',
  chat: 'Чат',
  friends: 'Друзья',
  comments: 'Комментарии',
  reports: 'Репорты',
  wiki: 'Вики',
  tickets: 'Обращения',
  marketplace: 'Маркетплейс',
  forum: 'Форум',
};

export default function AdminModulesPage() {
  const [items, setItems] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<ModuleRow[]>('/system/modules');
      setItems(data);
      setReasons(Object.fromEntries(data.map((m) => [m.module, m.reason ?? ''])));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить модули'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (module: string, isEnabled: boolean) => {
    setPending(module);
    try {
      const { data } = await api.patch<ModuleRow>(`/admin/modules/${module}`, {
        isEnabled,
        reason: isEnabled ? null : reasons[module] || null,
      });
      setItems((prev) => prev.map((m) => (m.module === module ? data : m)));
      toast.success(isEnabled ? 'Модуль включён' : 'Модуль отключён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить модуль'));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Модули"
        description="Включение и отключение отдельных разделов сайта"
      />
      <AdminTable
        columns={[
          {
            id: 'module',
            header: 'Модуль',
            cell: (r) => moduleLabels[r.module] ?? r.module,
          },
          {
            id: 'reason',
            header: 'Причина отключения',
            cell: (r) => (
              <Input
                className="h-8 max-w-xs"
                value={reasons[r.module] ?? ''}
                disabled={r.isEnabled}
                placeholder="Необязательно"
                onChange={(e) =>
                  setReasons((prev) => ({ ...prev, [r.module]: e.target.value }))
                }
                onBlur={() => {
                  if (!r.isEnabled && reasons[r.module] !== (r.reason ?? '')) {
                    void update(r.module, false);
                  }
                }}
              />
            ),
          },
          {
            id: 'enabled',
            header: 'Включён',
            cell: (r) => (
              <Switch
                checked={r.isEnabled}
                disabled={pending === r.module || loading}
                onCheckedChange={(checked) => void update(r.module, checked)}
              />
            ),
          },
        ]}
        data={items}
        rowKey={(r) => r.id}
        isLoading={loading}
      />
    </div>
  );
}
