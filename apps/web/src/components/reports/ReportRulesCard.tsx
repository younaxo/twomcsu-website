'use client';

import { AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { TopicDetails } from '@twomc/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ReportRulesCard({
  topic,
  isLoading,
  agreed,
  onAgreedChange,
  className,
}: {
  topic: TopicDetails | null | undefined;
  isLoading?: boolean;
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
  className?: string;
}) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const empty = !topic || !topic.content?.trim() || topic.content.includes('Здесь будет текст');

  return (
    <div className={cn('space-y-4 rounded-2xl glass-medium p-5', className)}>
      <h2 className="text-lg font-semibold text-white">Правила обращения</h2>

      {empty ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Правила ещё не заполнены. Обратитесь к администрации.</p>
        </div>
      ) : (
        <div className="prose prose-invert max-w-none text-sm">
          {topic.contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: topic.contentHtml }} />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {topic.content}
            </ReactMarkdown>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 border-t border-white/10 pt-4">
        <Checkbox
          id="report-rules-agree"
          checked={agreed}
          onCheckedChange={(value) => onAgreedChange(value === true)}
        />
        <Label htmlFor="report-rules-agree" className="cursor-pointer text-sm leading-snug text-neutral-200">
          Я ознакомлен с правилами и согласен
        </Label>
      </div>
    </div>
  );
}
