'use client';

import { Check, ChevronDown, Globe } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const flags: Record<string, string> = {
  ru: '/flags/ru.svg',
  uk: '/flags/ua.svg',
  en: '/flags/en.svg',
};

interface LanguageSwitcherProps {
  /** 'compact' — icon-only trigger for the header, 'full' — shows current language label (footer) */
  variant?: 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleSelect = (nextLocale: string) => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('label')}
          className={cn(
            'inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground',
            variant === 'full' && 'w-full justify-between px-3',
            className,
          )}
        >
          {variant === 'compact' ? (
            <>
              <Image
                src={flags[locale] ?? flags.ru}
                alt=""
                width={18}
                height={18}
                className="rounded-full"
                unoptimized
              />
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </>
          ) : (
            <>
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4" aria-hidden />
                <Image
                  src={flags[locale] ?? flags.ru}
                  alt=""
                  width={16}
                  height={16}
                  className="rounded-full"
                  unoptimized
                />
                {t(locale as 'ru' | 'uk' | 'en')}
              </span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => handleSelect(code)}
            className="cursor-pointer justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <Image
                src={flags[code] ?? flags.ru}
                alt=""
                width={16}
                height={16}
                className="rounded-full"
                unoptimized
              />
              {t(code as 'ru' | 'uk' | 'en')}
            </span>
            {code === locale ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
