'use client';

import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

interface AdminEmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function AdminEmptyState({
  title = 'Ничего не найдено',
  description = 'Измените фильтры или создайте первую запись',
  icon = Inbox,
  action,
}: AdminEmptyStateProps) {
  return <EmptyState icon={icon} title={title} description={description} action={action} />;
}
