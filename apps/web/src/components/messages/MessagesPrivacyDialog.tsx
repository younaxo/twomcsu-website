'use client';

import {
  DIRECT_MESSAGE_POLICY_LABELS,
  DirectMessagePolicy,
} from '@twomc/shared';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useDirectMessagePrivacy,
  useUpdateDirectMessagePrivacy,
} from '@/hooks/useDirectMessages';
import { extractErrorMessage } from '@/lib/api';

export function MessagesPrivacyDialog() {
  const privacy = useDirectMessagePrivacy();
  const update = useUpdateDirectMessagePrivacy();

  const change = async (value: DirectMessagePolicy) => {
    try {
      await update.mutateAsync(value);
      toast.success('Настройки сообщений сохранены');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить настройки'));
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Настройки сообщений">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Приватность сообщений</DialogTitle>
          <DialogDescription>Выберите, кто сможет начать с вами новый диалог.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Новые личные сообщения</Label>
          <Select
            value={privacy.data?.policy}
            onValueChange={(value) => void change(value as DirectMessagePolicy)}
            disabled={privacy.isLoading || update.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите правило" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(DirectMessagePolicy).map((policy) => (
                <SelectItem key={policy} value={policy}>
                  {DIRECT_MESSAGE_POLICY_LABELS[policy]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Блокировки из чёрного списка всегда имеют приоритет над этим правилом.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
