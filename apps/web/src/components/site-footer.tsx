'use client';

import { ArrowUpRight, MessageCircle, Send, Users } from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { Logo } from '@/components/shared/Logo';

const playerLinks = [
  { href: '/servers', label: 'Серверы' },
  { href: '/store', label: 'Магазин' },
  { href: '/news', label: 'Новости' },
  { href: '/leaderboards', label: 'Рейтинг' },
  { href: '/feed', label: 'Лента сообщества' },
] as const;

const helpLinks = [
  { href: '/rules', label: 'Правила проекта' },
  { href: '/documents', label: 'Документы' },
  { href: '/support', label: 'Центр поддержки' },
  { href: '/report', label: 'Мои обращения' },
  { href: 'https://www.mojang.com/legal/terms', label: 'Условия Mojang', external: true },
] as const;

const socials: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { href: 'https://discord.gg', label: 'Discord', icon: MessageCircle },
  { href: 'https://vk.com', label: 'ВКонтакте', icon: Users },
  { href: 'https://t.me', label: 'Telegram', icon: Send },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-3 mb-3 mt-8 overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-[rgba(13,12,11,0.88)] text-sm text-muted-foreground backdrop-blur-2xl sm:mx-5 lg:ml-6">
      <div className="surface-grid border-b border-white/[0.07] px-5 py-7 sm:px-8 lg:flex lg:items-center lg:justify-between lg:px-10">
        <div>
          <span className="eyebrow">Готов к игре?</span>
          <h2 className="mt-3 text-2xl text-white sm:text-3xl">Подключайся к twomc.su</h2>
        </div>
        <Link
          href="/servers"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:border-primary-hover hover:bg-primary-hover lg:mt-0"
        >
          Выбрать сервер
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-10 px-5 py-10 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr] lg:px-10">
        <div>
          <Logo size="md" />
          <p className="mt-5 max-w-sm leading-6">
            Игровой проект Minecraft с собственным сообществом, сервисами и живыми мирами.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 text-sm font-medium text-neutral-300 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {social.label}
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Игрокам
          </p>
          <ul className="space-y-2.5">
            {playerLinks.map((link) => (
              <li key={link.label}>
                <Link className="transition-colors hover:text-white" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Помощь
          </p>
          <ul className="space-y-2.5">
            {helpLinks.map((link) => (
              <li key={link.label}>
                {'external' in link && link.external ? (
                  <a
                    className="transition-colors hover:text-white"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link className="transition-colors hover:text-white" href={link.href}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Связь
          </p>
          <div className="space-y-3">
            <a className="block transition-colors hover:text-white" href="mailto:help@twomc.su">
              help@twomc.su
            </a>
            <a className="block transition-colors hover:text-white" href="mailto:admin@twomc.su">
              admin@twomc.su
            </a>
            <a
              className="block transition-colors hover:text-white"
              href="https://t.me/twomcsu_adm"
              target="_blank"
              rel="noreferrer"
            >
              @twomcsu_adm
            </a>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Поддержка на связи
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-5 text-xs text-neutral-600 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <p>© twomc.su {year}. Все права защищены.</p>
        <p>Баранов Кирилл Алексеевич · ИНН 230815487140</p>
        <p className="max-w-md md:text-right">
          Проект не связан с Mojang AB. Средства направляются на развитие проекта.
        </p>
      </div>
    </footer>
  );
}
