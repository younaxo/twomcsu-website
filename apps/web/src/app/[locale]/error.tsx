'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <section className="max-w-md rounded-card border border-border bg-card p-10 text-center">
        <p className="mb-3 text-sm uppercase tracking-widest text-destructive">Ошибка</p>
        <h1 className="mb-4 text-2xl font-semibold text-foreground">Что-то пошло не так</h1>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">
          Страница не смогла загрузиться. Попробуйте ещё раз — если ошибка повторится, сообщите
          об этом в поддержку.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 font-semibold text-primary-foreground transition-colors duration-fast ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Попробовать снова
        </button>
      </section>
    </div>
  );
}
