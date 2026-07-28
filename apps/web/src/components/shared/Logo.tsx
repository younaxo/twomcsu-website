'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const sizes = {
  sm: { px: 28, text: 'text-base' },
  md: { px: 36, text: 'text-lg' },
  lg: { px: 48, text: 'text-xl' },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { px, text } = sizes[size];

  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2.5 transition-opacity hover:opacity-90', className)}
      aria-label="TWOMC — на главную"
    >
      <Image
        src="/logo.png"
        alt="TWOMC"
        width={px}
        height={px}
        className="rounded-lg"
        priority
      />
      {showText ? (
        <span className={cn('logo text-white', text)}>
          twomc<span className="text-primary">.su</span>
        </span>
      ) : null}
    </Link>
  );
}
