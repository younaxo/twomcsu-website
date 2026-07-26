export default function HomePage() {
  return (
    <section className="rounded-2xl border border-outline/60 bg-surface p-10">
      <p className="mb-3 text-sm uppercase tracking-widest text-accent">Сервер в разработке</p>

      <h1 className="mb-4 text-4xl text-white sm:text-5xl">twomc.su</h1>

      <p className="max-w-xl text-muted">
        Сайт пока на этапе фундамента: подняты монорепозиторий, API и база. Магазин, профиль игрока
        и статистика появятся дальше.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-outline bg-base px-4 py-2 font-mono text-sm text-white">
          play.twomc.su
        </span>
        <span className="text-sm text-muted">версия 1.20.x</span>
      </div>
    </section>
  );
}
