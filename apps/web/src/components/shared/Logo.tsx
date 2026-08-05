'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const sizes = {
  sm: { px: 38, text: 'text-[1.45rem]' },
  md: { px: 48, text: 'text-[1.75rem]' },
  lg: { px: 56, text: 'text-2xl' },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  showText?: boolean;
  withDivider?: boolean;
  className?: string;
  imageClassName?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  withDivider = false,
  className,
  imageClassName,
}: LogoProps) {
  const { px, text } = sizes[size];

  return (
    <Link
      href="/"
      className={cn('inline-flex cursor-pointer items-center gap-4', className)}
      aria-label="TWOMC — на главную"
    >
      <Image
        src="/logo.png"
        alt="TWOMC"
        width={px}
        height={px}
        priority
        className={cn(imageClassName)}
      />
      {withDivider ? <span className="h-7 w-px bg-white/10" aria-hidden /> : null}
      {showText ? (
        <span className={cn('logo font-bold text-white', text)}>twomc.su</span>
      ) : null}
    </Link>
  );
}
