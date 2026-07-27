export default function HomePage() {
  return (
    <section className="rounded-2xl border border-border bg-card p-10">
      <p className="mb-3 text-sm uppercase tracking-widest text-primary">Сервер в разработке</p>

      <h1 className="mb-4 text-4xl text-white sm:text-5xl">twomc.su</h1>

      <p className="max-w-xl text-muted-foreground">
        Сайт пока на этапе фундамента: подняты монорепозиторий, API и база. Магазин, профиль игрока
        и статистика появятся дальше.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-border bg-background px-4 py-2 font-mono text-sm text-white">
          play.twomc.su
        </span>
        <span className="text-sm text-muted-foreground">версия 1.20.x</span>
      </div>
    </section>
  );
}
