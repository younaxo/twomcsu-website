'use client';

import { Disc3, Github, Send } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

const columns = [
  {
    title: 'Проект',
    links: [
      { href: '/', label: 'О нас' },
      { href: '/', label: 'Команда' },
      { href: '/', label: 'Правила' },
      { href: '/', label: 'Оферта' },
    ],
  },
  {
    title: 'Игра',
    links: [
      { href: '/servers', label: 'Серверы' },
      { href: '/', label: 'Как играть' },
      { href: '/', label: 'Скачать' },
    ],
  },
  {
    title: 'Магазин',
    links: [
      { href: '/store', label: 'Каталог' },
      { href: '/store', label: 'Промокоды' },
      { href: '/', label: 'Поддержка' },
    ],
  },
  {
    title: 'Помощь',
    links: [
      { href: '/', label: 'FAQ' },
      { href: '/', label: 'Тикеты' },
      { href: 'https://discord.gg', label: 'Discord', external: true },
      { href: '/', label: 'Контакты' },
    ],
  },
] as const;

const socials = [
  { href: 'https://discord.gg', label: 'Discord', icon: Disc3 },
  { href: 'https://t.me', label: 'Telegram', icon: Send },
  { href: 'https://github.com/younaxo/twomcsu-website', label: 'GitHub', icon: Github },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/5 bg-[#0c0c12]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr]">
        <div className="space-y-4">
          <Logo size="md" />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            TWOMC — Minecraft-проект с магазином, профилями игроков и живым сообществом.
          </p>
          <div className="flex items-center gap-2">
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-sm font-semibold text-white">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} TWOMC. Все права защищены.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-primary">
              Публичная оферта
            </Link>
            <Link href="/" className="hover:text-primary">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
