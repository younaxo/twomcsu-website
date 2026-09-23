'use client';

import { useEffect } from 'react';
import './globals.css';

/**
 * Catches errors thrown by the root layout itself (before app/[locale]/layout.tsx
 * even mounts), so it has no parent providers and must supply its own <html>/<body> —
 * same constraint as app/not-found.tsx. No locale context is available here.
 */
export default function GlobalError({
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
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center px-4">
          <section className="max-w-md rounded-2xl border border-border bg-card p-10 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-destructive">Ошибка</p>
            <h1 className="mb-4 text-2xl font-semibold text-foreground">Что-то пошло не так</h1>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Сайт не смог загрузиться. Попробуйте обновить страницу.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Попробовать снова
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
