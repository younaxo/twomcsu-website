export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-md items-center py-8 sm:py-12">
      <div className="w-full">{children}</div>
    </div>
  );
}
