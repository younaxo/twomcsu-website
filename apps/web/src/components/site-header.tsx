import Link from 'next/link';

// TODO: заменить заглушку на реальную навигацию
const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/', label: 'Магазин' },
  { href: '/', label: 'Правила' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="logo text-xl text-white">
          twomc<span className="text-primary">.su</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
