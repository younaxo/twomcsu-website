export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-lg items-center py-8">
      <div className="surface-grid frame-corners w-full rounded-[1.5rem] p-1 glass-light">
        {children}
      </div>
    </div>
  );
}
