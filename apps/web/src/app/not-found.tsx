import Link from 'next/link';
import './globals.css';

/**
 * Root-level not-found — required by Next.js for paths that don't resolve to any
 * locale segment at all (e.g. `/some.php`, or the framework's internal /_not-found
 * fallback). It sits outside app/[locale]/layout.tsx, so unlike
 * app/[locale]/not-found.tsx it has no parent layout to supply <html>/<body> and
 * must provide them itself — see https://nextjs.org/docs/messages/missing-root-layout-tags.
 * No locale context is available here, so the copy is static Russian (the default locale).
 */
export default function RootNotFound() {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center px-4">
          <section className="max-w-md rounded-2xl border border-border bg-card p-10 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Ошибка 404</p>
            <h1 className="mb-4 text-4xl text-foreground">Страница не найдена</h1>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Возможно, ссылка устарела или страницы никогда не существовало.
            </p>
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              На главную
            </Link>
          </section>
        </main>
      </body>
    </html>
  );
}
