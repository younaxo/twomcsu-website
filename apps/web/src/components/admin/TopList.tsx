'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface TopListItem {
  id: string;
  rank: number;
  title: string;
  subtitle?: string;
  value: string | number;
  secondaryValue?: string;
  href?: string;
  imageUrl?: string | null;
}

interface TopListProps {
  title?: string;
  items: TopListItem[];
  emptyMessage?: string;
  className?: string;
  valueLabel?: string;
}

export function TopList({
  title,
  items,
  emptyMessage = 'Нет данных',
  className,
  valueLabel,
}: TopListProps) {
  return (
    <div className={cn('rounded-2xl glass-medium p-4', className)}>
      {title ? <h2 className="mb-3 text-sm font-medium text-white">{title}</h2> : null}

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-2 font-medium">Название</th>
                {valueLabel ? (
                  <th className="pb-2 text-right font-medium">{valueLabel}</th>
                ) : (
                  <th className="pb-2 text-right font-medium">Значение</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const row = (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5"
                  >
                    <td className="py-2.5 pr-2 text-muted-foreground">{item.rank}</td>
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded-md object-cover"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{item.title}</p>
                          {item.subtitle ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <p className="font-medium text-white">{item.value}</p>
                      {item.secondaryValue ? (
                        <p className="text-xs text-muted-foreground">{item.secondaryValue}</p>
                      ) : null}
                    </td>
                  </tr>
                );

                return item.href ? (
                  <Link key={item.id} href={item.href} className="contents">
                    {row}
                  </Link>
                ) : (
                  row
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
