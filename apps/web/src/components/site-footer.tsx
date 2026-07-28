'use client';

import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

const playerLinks = [
  { href: '/servers', label: 'Начать играть' },
  { href: '/store', label: 'Пополнение счета' },
  { href: '/', label: 'Вики' },
  { href: '/', label: 'Инфо' },
] as const;

const documentLinks = [
  { href: '/', label: 'Договор Оферты' },
  { href: '/', label: 'Политика обработки персональных данных' },
  { href: '/', label: 'Пользовательское соглашение' },
  {
    href: 'https://www.mojang.com/legal/terms',
    label: 'Политика Mojang AB',
    external: true,
  },
] as const;

const socials = [
  {
    href: 'https://discord.gg',
    label: 'Discord',
    src: 'https://logo-teka.com/wp-content/uploads/2025/06/discord-sign-logo.svg',
  },
  {
    href: 'https://vk.com',
    label: 'VK',
    src: 'https://logo-teka.com/wp-content/uploads/2025/06/vk-logo.svg',
  },
  {
    href: 'https://t.me',
    label: 'Telegram',
    src: 'https://logo-teka.com/wp-content/uploads/2025/06/telegram-logo.svg',
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-[rgba(20,20,20,0.88)] px-5 pb-24 pt-[90px] text-[0.96rem] text-[#b0b0b0]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 lg:flex-row lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-[1.3] space-y-6 leading-relaxed">
          <Logo size="md" />

          <p className="pt-8 text-[1.1rem] font-bold text-white">
            © twomc.su {year}.
            <br />
            Все права защищены!
          </p>

          <p className="max-w-[400px] leading-relaxed">
            twomc.su — игровой проект серверов Minecraft с уникальным геймплеем и активным
            сообществом. Мы постоянно работаем над улучшением игрового опыта для наших игроков.
          </p>

          <div className="space-y-1">
            <strong className="mb-2 block text-[1.05rem] text-white">Контакты</strong>
            <p>
              Telegram:{' '}
              <a
                href="https://t.me/twomcsu_adm"
                target="_blank"
                rel="noreferrer"
                className="text-[#ffb74d] transition-colors hover:text-primary"
              >
                @twomcsu_adm
              </a>
            </p>
            <p>
              Помощь:{' '}
              <a href="mailto:help@twomc.su" className="text-[#ffb74d] transition-colors hover:text-primary">
                help@twomc.su
              </a>
            </p>
            <p>
              Поддержка/вопросы:{' '}
              <a
                href="mailto:support@twomc.su"
                className="text-[#ffb74d] transition-colors hover:text-primary"
              >
                support@twomc.su
              </a>
            </p>
            <p>
              Связь с администрацией:{' '}
              <a
                href="mailto:admin@twomc.su"
                className="text-[#ffb74d] transition-colors hover:text-primary"
              >
                admin@twomc.su
              </a>
            </p>
            <p>
              Реклама/предложения:{' '}
              <a href="mailto:ads@twomc.su" className="text-[#ffb74d] transition-colors hover:text-primary">
                ads@twomc.su
              </a>
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-[1.3] space-y-10 leading-relaxed">
          <div>
            <strong className="mb-2 block text-[1.05rem] text-white">Важная информация</strong>
            <p>
              TwoMC не связан с Mojang AB, все средства идут на развитие проекта.
              <br />
              Коммерческая деятельность проекта соответствует политике Mojang AB.
            </p>
          </div>

          <div>
            <strong className="mb-2 block text-[1.05rem] text-white">Документы</strong>
            <ul className="space-y-1">
              {documentLinks.map((link) => (
                <li key={link.label}>
                  {'external' in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[#ffb74d] transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="block text-[#ffb74d] transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-w-0 flex-1 leading-relaxed">
          <strong className="mb-2 block text-[1.05rem] text-white">Игрокам</strong>
          <ul className="space-y-1">
            {playerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block text-[#ffb74d] transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <div className="mb-5 mt-2 flex justify-center gap-6 sm:gap-8">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="group rounded-xl border border-white/[0.06] bg-[rgba(30,30,30,0.7)] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:shadow-[0_6px_16px_hsl(var(--primary)/0.4)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={social.src}
                  alt=""
                  className="h-10 w-10 opacity-80 brightness-125 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:brightness-100 group-hover:grayscale-0 sm:h-12 sm:w-12"
                />
              </a>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 text-[1.05rem] font-semibold text-[#1ba76d]">
            <span className="relative flex h-[13px] w-[13px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1ba76d] opacity-40" />
              <span className="relative inline-flex h-[13px] w-[13px] rounded-full bg-[#1ba76d]" />
            </span>
            Все системы в порядке
          </div>
        </div>
      </div>
    </footer>
  );
}
