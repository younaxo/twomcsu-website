import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <section className="rounded-2xl border border-border bg-card p-10 text-center">
      <p className="mb-3 text-sm uppercase tracking-widest text-primary">Ошибка 404</p>

      <h1 className="mb-4 text-4xl text-white">Страница не найдена</h1>

      <p className="mx-auto mb-8 max-w-md text-muted-foreground">
        Возможно, ссылка устарела или страницы никогда не существовало.
      </p>

      <Button asChild>
        <Link href="/">На главную</Link>
      </Button>
    </section>
  );
}
