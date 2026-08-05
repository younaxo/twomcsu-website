'use client';

import type { FormDetail } from '@twomc/shared';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Captcha, type CaptchaHandle } from '@/components/shared/Captcha';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api';
import { useSaveDraft, useSubmitForm, type FormAnswerPayload } from '@/hooks/forms';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { FieldRenderer } from './FieldRenderer';
import { FormTimer } from './FormTimer';
import { MultiStepForm } from './MultiStepForm';
import { isFieldVisible } from './conditional';
import type { AnswersMap, FieldValue, StepConfigItem } from './types';

interface Props {
  form: FormDetail;
  inviteCode?: string;
}

function parseSteps(form: FormDetail): StepConfigItem[] {
  if (!form.multiStep) return [];
  if (Array.isArray(form.stepsConfig)) {
    return (form.stepsConfig as unknown[]).map((entry, index) => {
      if (entry && typeof entry === 'object') {
        const raw = entry as Record<string, unknown>;
        return {
          title: typeof raw.title === 'string' ? raw.title : `Шаг ${index + 1}`,
          description: typeof raw.description === 'string' ? raw.description : undefined,
        };
      }
      return { title: `Шаг ${index + 1}` };
    });
  }
  return [];
}

function toApiPayload(map: AnswersMap): FormAnswerPayload[] {
  return Object.values(map)
    .filter((v): v is FieldValue => Boolean(v))
    .map((v) => ({
      fieldId: v.fieldId,
      textValue: v.textValue ?? null,
      numberValue: v.numberValue ?? null,
      booleanValue: v.booleanValue ?? null,
      dateValue: v.dateValue ?? null,
      jsonValue: v.jsonValue,
      fileUrls: v.fileUrls ?? [],
    }));
}

export function FormRenderer({ form, inviteCode }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const submit = useSubmitForm(form.slug);
  const saveDraft = useSaveDraft(form.slug);
  const captchaRef = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [expired, setExpired] = useState(false);

  const steps = useMemo(() => parseSteps(form), [form]);

  const visibleFields = useMemo(
    () => form.fields.filter((field) => isFieldVisible(field, answers)),
    [form.fields, answers],
  );

  const stepFields = useMemo(() => {
    if (!form.multiStep) return visibleFields;
    return visibleFields.filter((field) => (field.stepIndex ?? 0) === step);
  }, [form.multiStep, step, visibleFields]);

  const change = (value: FieldValue) => {
    setAnswers((prev) => ({ ...prev, [value.fieldId]: value }));
  };

  const canGoNext = form.multiStep && step < steps.length - 1;
  const canGoPrev = form.multiStep && step > 0;

  const handleSubmit = async () => {
    if (expired) {
      toast.error('Время истекло');
      return;
    }
    // Client-side required-check (backend re-validates)
    for (const field of visibleFields) {
      if (!field.isRequired) continue;
      const answer = answers[field.id];
      const empty =
        !answer ||
        (!answer.textValue &&
          answer.numberValue == null &&
          answer.booleanValue == null &&
          !answer.dateValue &&
          !answer.fileUrls?.length &&
          (answer.jsonValue == null ||
            (Array.isArray(answer.jsonValue) && answer.jsonValue.length === 0)));
      if (empty) {
        toast.error(`Заполните: ${field.label}`);
        return;
      }
    }

    try {
      await submit.mutateAsync({
        answers: toApiPayload(answers),
        captchaToken: form.requiresCaptcha ? captchaToken : undefined,
        inviteCode,
      });
      setSubmitted(true);
      if (form.redirectUrl) {
        setTimeout(() => {
          if (form.redirectUrl) window.location.href = form.redirectUrl;
        }, 1500);
      }
    } catch (error) {
      captchaRef.current?.reset();
      setCaptchaToken('');
      toast.error(extractErrorMessage(error, 'Не удалось отправить'));
    }
  };

  const handleSaveDraft = async () => {
    if (!isAuthenticated) {
      toast.error('Для черновиков требуется вход');
      return;
    }
    try {
      await saveDraft.mutateAsync({
        answers: toApiPayload(answers),
        currentStep: step,
      });
      toast.success('Черновик сохранён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить'));
    }
  };

  if (form.alreadyResponded && form.onePerUser) {
    return (
      <div className="rounded-2xl glass-strong p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Вы уже отправляли эту форму</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Повторная отправка запрещена настройками формы.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl glass-strong p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Спасибо за ответ!</h2>
        {form.thankYouMessage ? (
          <div className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            <MarkdownContent content={form.thankYouMessage} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Ваш ответ отправлен и обрабатывается.
          </p>
        )}
        <div className="mt-6">
          <Button variant="secondary" onClick={() => router.push('/forms')}>
            К списку форм
          </Button>
        </div>
      </div>
    );
  }

  const disabled = expired || submit.isPending;

  return (
    <div className="space-y-6">
      <header className="space-y-3 rounded-2xl glass-strong p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{form.title}</h1>
            {form.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{form.description}</p>
            ) : null}
          </div>
          {form.timeLimit ? (
            <FormTimer timeLimit={form.timeLimit} onExpire={() => setExpired(true)} />
          ) : null}
        </div>
        {form.descriptionHtml ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: form.descriptionHtml }} />
          </div>
        ) : null}
      </header>

      {form.multiStep && steps.length > 1 ? (
        <MultiStepForm
          steps={steps.map((s, index) => ({ index, title: s.title }))}
          currentStep={step}
          onStepChange={setStep}
        />
      ) : null}

      <div className="space-y-4">
        {stepFields.map((field) => (
          <div key={field.id} className={cn('rounded-2xl glass-medium p-4')}>
            <FieldRenderer
              field={field}
              slug={form.slug}
              value={answers[field.id]}
              onChange={change}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {form.requiresCaptcha && (!form.multiStep || step === steps.length - 1) ? (
        <div className="rounded-2xl glass-medium p-4">
          <Captcha ref={captchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {canGoPrev ? (
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Назад
          </Button>
        ) : null}
        {canGoNext ? (
          <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>Далее</Button>
        ) : (
          <Button
            onClick={() => void handleSubmit()}
            disabled={disabled || (form.requiresCaptcha && !captchaToken)}
          >
            {submit.isPending ? 'Отправка...' : 'Отправить'}
          </Button>
        )}
        {isAuthenticated ? (
          <Button variant="ghost" onClick={() => void handleSaveDraft()} disabled={disabled}>
            Сохранить черновик
          </Button>
        ) : null}
      </div>
    </div>
  );
}
