'use client';

import {
  FormFieldType,
  type FormFieldAnswerDto,
  type FormResponseDetail,
} from '@twomc/shared';
import { format } from 'date-fns';
import Image from 'next/image';

interface Props {
  response: FormResponseDetail;
}

function renderAnswer(answer: FormFieldAnswerDto) {
  if (answer.fileUrls?.length) {
    return (
      <ul className="space-y-1">
        {answer.fileUrls.map((url) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  switch (answer.fieldType) {
    case FormFieldType.SIGNATURE:
      if (answer.textValue?.startsWith('data:image')) {
        return (
          <Image
            src={answer.textValue}
            alt="Подпись"
            width={300}
            height={100}
            className="rounded border border-white/10 bg-white/5"
            unoptimized
          />
        );
      }
      break;
    case FormFieldType.RATING:
      return (
        <span className="text-sm">
          {'★'.repeat(Number(answer.numberValue ?? 0))} ({answer.numberValue ?? 0})
        </span>
      );
    case FormFieldType.CHECKBOX:
    case FormFieldType.AGREEMENT_CHECKLIST:
    case FormFieldType.PLAYER_SELECTOR:
    case FormFieldType.FRIENDS_SELECTOR:
      if (Array.isArray(answer.jsonValue)) {
        return <span className="text-sm">{answer.jsonValue.map(String).join(', ')}</span>;
      }
      break;
    case FormFieldType.DATE_RANGE:
      if (answer.jsonValue && typeof answer.jsonValue === 'object' && !Array.isArray(answer.jsonValue)) {
        const range = answer.jsonValue as { from?: string; to?: string };
        return <span className="text-sm">{range.from ?? '—'} — {range.to ?? '—'}</span>;
      }
      break;
    case FormFieldType.SCHEDULE_PICKER:
      return (
        <pre className="text-xs text-muted-foreground">
          {JSON.stringify(answer.jsonValue, null, 2)}
        </pre>
      );
    default:
      break;
  }

  if (answer.numberValue != null) return <span className="text-sm">{answer.numberValue}</span>;
  if (answer.dateValue) {
    return <span className="text-sm">{format(new Date(answer.dateValue), 'yyyy-MM-dd')}</span>;
  }
  if (answer.textValue) return <span className="text-sm whitespace-pre-wrap">{answer.textValue}</span>;
  if (answer.jsonValue !== null && answer.jsonValue !== undefined) {
    return (
      <pre className="text-xs text-muted-foreground">
        {JSON.stringify(answer.jsonValue, null, 2)}
      </pre>
    );
  }
  return <span className="text-xs text-muted-foreground">Пусто</span>;
}

export function ResponseDetail({ response }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass-strong p-4">
        <p className="text-sm text-muted-foreground">
          {response.isAnonymous ? 'Аноним' : (response.respondentUsername ?? 'Пользователь')} ·{' '}
          {response.isComplete ? 'Отправлен' : 'Черновик'} ·{' '}
          {response.completedAt
            ? format(new Date(response.completedAt), 'yyyy-MM-dd HH:mm')
            : format(new Date(response.startedAt), 'yyyy-MM-dd HH:mm')}
        </p>
        {response.userAgent ? (
          <p className="mt-1 text-xs text-muted-foreground">UA: {response.userAgent}</p>
        ) : null}
      </div>
      <div className="space-y-3">
        {response.answers.map((answer) => (
          <div key={answer.id} className="rounded-2xl glass-medium p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {answer.fieldLabel ?? answer.fieldId}
            </p>
            <div className="mt-2 text-white">{renderAnswer(answer)}</div>
          </div>
        ))}
        {!response.answers.length ? (
          <p className="text-sm text-muted-foreground">Ответы отсутствуют</p>
        ) : null}
      </div>
    </div>
  );
}
