'use client';

import Link from 'next/link';
import { RoleGroup } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Download, Eye, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  BulkActionsBar,
  ColumnsSelector,
  ExportDialog,
  FilterPanel,
  SavedFiltersMenu,
} from '@/components/admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminUsers,
  useBulkUpdateUsers,
  useCreateSavedFilter,
  useDeleteSavedFilter,
  useExportUsers,
  useSavedFilters,
} from '@/hooks/admin';
import type { AdminUserListItem, AdminUsersFilters } from '@/hooks/admin';
import { api } from '@/lib/api';

const PAGE_KEY = 'admin/users';

const ROLE_OPTIONS = [
  { value: 'all', label: 'Все роли' },
  { value: RoleGroup.PLAYER, label: 'Игрок' },
  { value: RoleGroup.HELPER, label: 'Хелпер' },
  { value: RoleGroup.MODERATOR, label: 'Модератор' },
  { value: RoleGroup.ADMIN, label: 'Админ' },
  { value: RoleGroup.OWNER, label: 'Владелец' },
];

const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Игрок',
  HELPER: 'Хелпер',
  MODERATOR: 'Модератор',
  ADMIN: 'Админ',
  OWNER: 'Владелец',
};

const COLUMN_OPTIONS = [
  { id: 'avatar', label: 'Аватар', required: true },
  { id: 'username', label: 'Ник / ID', required: true },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Роль' },
  { id: 'position', label: 'Позиция' },
  { id: 'registration', label: 'Регистрация' },
  { id: 'lastLogin', label: 'Последний вход' },
  { id: 'status', label: 'Статус' },
  { id: 'orders', label: 'Заказы' },
  { id: 'reports', label: 'Обращения' },
];

const EXPORT_COLUMNS = [
  { id: 'username', label: 'Никнейм' },
  { id: 'email', label: 'Email' },
  { id: 'roleGroup', label: 'Роль' },
  { id: 'createdAt', label: 'Регистрация' },
  { id: 'lastLoginAt', label: 'Последний вход' },
  { id: 'isBanned', label: 'Забанен' },
];

const DEFAULT_VISIBLE = COLUMN_OPTIONS.map((c) => c.id);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [isBanned, setIsBanned] = useState<boolean | undefined>(undefined);
  const [positionId, setPositionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE);
  const [exportOpen, setExportOpen] = useState(false);
  const [savedFilterId, setSavedFilterId] = useState<string>();
  const [positions, setPositions] = useState<Array<{ id: string; displayName: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  const filters: AdminUsersFilters = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      role: role === 'all' ? undefined : role,
      isBanned,
      positionId: positionId || undefined,
      departmentId: departmentId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort,
      order,
    }),
    [page, limit, search, role, isBanned, positionId, departmentId, dateFrom, dateTo, sort, order],
  );

  const list = useAdminUsers(filters);
  const savedFilters = useSavedFilters(PAGE_KEY);
  const createSavedFilter = useCreateSavedFilter(PAGE_KEY);
  const deleteSavedFilter = useDeleteSavedFilter(PAGE_KEY);
  const bulkUpdate = useBulkUpdateUsers();
  const exportUsers = useExportUsers();

  useEffect(() => {
    void (async () => {
      try {
        const [posRes, depRes] = await Promise.all([
          api.get<Array<{ id: string; displayName: string }>>('/positions/manage'),
          api.get<Array<{ id: string; name: string }>>('/admin/departments'),
        ]);
        setPositions(posRes.data);
        setDepartments(depRes.data);
      } catch {
        /* optional filters */
      }
    })();
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setRole('all');
    setIsBanned(undefined);
    setPositionId('');
    setDepartmentId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setSavedFilterId(undefined);
  }, []);

  const applySavedFilter = (sf: { id: string; filters: Record<string, unknown> }) => {
    setSavedFilterId(sf.id);
    const f = sf.filters;
    setSearch(typeof f.search === 'string' ? f.search : '');
    setRole(typeof f.role === 'string' ? f.role : 'all');
    setIsBanned(typeof f.isBanned === 'boolean' ? f.isBanned : undefined);
    setPositionId(typeof f.positionId === 'string' ? f.positionId : '');
    setDepartmentId(typeof f.departmentId === 'string' ? f.departmentId : '');
    setDateFrom(typeof f.dateFrom === 'string' ? f.dateFrom : '');
    setDateTo(typeof f.dateTo === 'string' ? f.dateTo : '');
    setPage(1);
  };

  const saveCurrentFilter = (name: string) => {
    createSavedFilter.mutate(
      {
        name,
        filters: {
          search,
          role: role === 'all' ? undefined : role,
          isBanned,
          positionId: positionId || undefined,
          departmentId: departmentId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      },
      {
        onSuccess: () => toast.success('Фильтр сохранён'),
        onError: () => toast.error('Не удалось сохранить фильтр'),
      },
    );
  };

  const handleBulkBan = () => {
    bulkUpdate.mutate(
      { userIds: selectedIds, action: 'ban', data: { banReason: 'Массовый бан' } },
      {
        onSuccess: (res) => {
          toast.success(`Забанено: ${res.affected}`);
          setSelectedIds([]);
        },
        onError: () => toast.error('Не удалось выполнить действие'),
      },
    );
  };

  const handleBulkUnban = () => {
    bulkUpdate.mutate(
      { userIds: selectedIds, action: 'unban' },
      {
        onSuccess: (res) => {
          toast.success(`Разбанено: ${res.affected}`);
          setSelectedIds([]);
        },
        onError: () => toast.error('Не удалось выполнить действие'),
      },
    );
  };

  const columns = useMemo(() => {
    const defs = [
      {
        id: 'avatar',
        header: '',
        cell: (row: AdminUserListItem) => (
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatar ?? undefined} alt={row.username} />
            <AvatarFallback>{row.username.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        ),
      },
      {
        id: 'username',
        header: 'Ник / ID',
        sortable: true,
        cell: (row: AdminUserListItem) => (
          <div>
            <Link
              href={`/admin/users/${row.id}`}
              className="font-medium text-white hover:text-[#F57C00]"
            >
              {row.username}
            </Link>
            <p className="text-xs text-muted-foreground">#{row.shortId}</p>
          </div>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        sortable: true,
        cell: (row: AdminUserListItem) => row.email,
      },
      {
        id: 'role',
        header: 'Роль',
        sortable: true,
        cell: (row: AdminUserListItem) => ROLE_LABELS[row.roleGroup] ?? row.roleGroup,
      },
      {
        id: 'position',
        header: 'Позиция',
        cell: (row: AdminUserListItem) =>
          row.position ? (
            <span style={{ color: row.position.color }}>{row.position.displayName}</span>
          ) : (
            '—'
          ),
      },
      {
        id: 'registration',
        header: 'Регистрация',
        sortable: true,
        cell: (row: AdminUserListItem) =>
          format(new Date(row.createdAt), 'd MMM yyyy', { locale: ru }),
      },
      {
        id: 'lastLogin',
        header: 'Последний вход',
        sortable: true,
        cell: (row: AdminUserListItem) =>
          row.lastLoginAt
            ? format(new Date(row.lastLoginAt), 'd MMM yyyy, HH:mm', { locale: ru })
            : '—',
      },
      {
        id: 'status',
        header: 'Статус',
        cell: (row: AdminUserListItem) => (
          <div className="flex flex-wrap gap-1">
            {row.isBanned ? (
              <Badge variant="destructive">Забанен</Badge>
            ) : row.isOnline ? (
              <Badge className="bg-emerald-600/80">Онлайн</Badge>
            ) : (
              <Badge variant="secondary">Оффлайн</Badge>
            )}
            {row.isOnlineInGame ? <Badge variant="outline">В игре</Badge> : null}
          </div>
        ),
      },
      {
        id: 'orders',
        header: 'Заказы',
        cell: (row: AdminUserListItem) => row.ordersCount,
      },
      {
        id: 'reports',
        header: 'Обращения',
        cell: (row: AdminUserListItem) => row.reportsCount,
      },
    ];

    return defs.filter((col) => visibleColumns.includes(col.id));
  }, [visibleColumns]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Пользователи"
        description="Управление пользователями сайта"
        actions={
          <>
            <ColumnsSelector
              columns={COLUMN_OPTIONS}
              visibleIds={visibleColumns}
              onChange={setVisibleColumns}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => setExportOpen(true)}>
              <Download className="mr-1.5 h-4 w-4" />
              Экспорт
            </Button>
          </>
        }
      />

      <FilterPanel
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Поиск по нику, email, ID…"
        fields={[
          {
            type: 'select',
            id: 'role',
            label: 'Роль',
            value: role,
            onChange: (v) => {
              setRole(v);
              setPage(1);
            },
            options: ROLE_OPTIONS,
          },
          {
            type: 'select',
            id: 'position',
            label: 'Позиция',
            value: positionId || 'all',
            onChange: (v) => {
              setPositionId(v === 'all' ? '' : v);
              setPage(1);
            },
            options: [
              { value: 'all', label: 'Все' },
              ...positions.map((p) => ({ value: p.id, label: p.displayName })),
            ],
          },
          {
            type: 'select',
            id: 'department',
            label: 'Отдел',
            value: departmentId || 'all',
            onChange: (v) => {
              setDepartmentId(v === 'all' ? '' : v);
              setPage(1);
            },
            options: [
              { value: 'all', label: 'Все' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ],
          },
          {
            type: 'select',
            id: 'banned',
            label: 'Бан',
            value: isBanned === undefined ? 'all' : isBanned ? 'yes' : 'no',
            onChange: (v) => {
              setIsBanned(v === 'all' ? undefined : v === 'yes');
              setPage(1);
            },
            options: [
              { value: 'all', label: 'Все' },
              { value: 'yes', label: 'Забаненные' },
              { value: 'no', label: 'Активные' },
            ],
          },
          {
            type: 'dateRange',
            id: 'registration',
            label: 'Регистрация',
            from: dateFrom,
            to: dateTo,
            onFromChange: (v) => {
              setDateFrom(v);
              setPage(1);
            },
            onToChange: (v) => {
              setDateTo(v);
              setPage(1);
            },
          },
        ]}
        onReset={resetFilters}
        extra={
          <SavedFiltersMenu
            filters={savedFilters.data ?? []}
            value={savedFilterId}
            onSelect={applySavedFilter}
            onSave={saveCurrentFilter}
            onDelete={(id) => {
              deleteSavedFilter.mutate(id, {
                onSuccess: () => {
                  if (savedFilterId === id) setSavedFilterId(undefined);
                  toast.success('Фильтр удалён');
                },
              });
            }}
          />
        }
      />

      <AdminTable
        columns={columns}
        data={list.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortColumn={sort}
        sortDirection={order}
        onSortChange={(columnId, direction) => {
          setSort(columnId);
          setOrder(direction);
          setPage(1);
        }}
        page={page}
        totalPages={list.data?.totalPages ?? 1}
        totalItems={list.data?.total}
        perPage={limit}
        onPerPageChange={(v) => {
          setLimit(v);
          setPage(1);
        }}
        onPageChange={setPage}
        empty={
          <AdminEmptyState
            icon={Users}
            title="Пользователи не найдены"
            description="Измените фильтры или сбросьте поиск"
          />
        }
        actions={(row) => (
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/admin/users/${row.id}`} aria-label="Открыть профиль">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        )}
      />

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={
          <Select
            onValueChange={(action) => {
              if (action === 'ban') handleBulkBan();
              else if (action === 'unban') handleBulkUnban();
            }}
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue placeholder="Действие…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ban">Забанить</SelectItem>
              <SelectItem value="unban">Разбанить</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        isExporting={exportUsers.isPending}
        onExport={async ({ format }) => {
          try {
            const blob = await exportUsers.mutateAsync({
              format,
              search: search || undefined,
              roleGroup: role === 'all' ? undefined : role,
              isBanned,
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
              userIds: selectedIds.length > 0 ? selectedIds : undefined,
            });
            downloadBlob(blob, `users-export.${format === 'excel' ? 'xlsx' : format}`);
            setExportOpen(false);
            toast.success('Экспорт готов');
          } catch {
            toast.error('Не удалось экспортировать');
          }
        }}
      />
    </div>
  );
}
