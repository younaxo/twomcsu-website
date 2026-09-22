/**
 * True filesystem root layout — Next.js requires one to exist even though the
 * real <html>/<body> live one level down. app/[locale]/layout.tsx supplies them
 * for every real page, and app/not-found.tsx supplies its own for the rare
 * request that never resolves to a locale segment at all. This one stays a
 * transparent pass-through so neither of those ends up double-nesting <html>.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
