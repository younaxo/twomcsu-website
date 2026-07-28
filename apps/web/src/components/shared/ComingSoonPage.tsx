import { Construction } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Construction className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="max-w-md text-muted-foreground">
        {description ?? 'Раздел в разработке. Скоро здесь появится контент.'}
      </p>
    </div>
  );
}
