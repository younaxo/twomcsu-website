'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface NewsShareDialogProps {
  title: string;
  url: string;
}

export function NewsShareDialog({ title, url }: NewsShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const links = [
    {
      label: 'VK',
      href: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'Discord',
      href: url,
      hint: 'Скопируйте ссылку и вставьте в Discord',
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="icon" aria-label="Поделиться">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Поделиться</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {links.map((item) => (
            <Button key={item.label} variant="secondary" asChild className="justify-start">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={item.label === 'Discord' ? (e) => { e.preventDefault(); void copy(); } : undefined}
              >
                {item.label}
                {item.hint ? <span className="ml-2 text-xs text-muted-foreground">{item.hint}</span> : null}
              </a>
            </Button>
          ))}
          <Button type="button" variant="secondary" onClick={copy} className="justify-start gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Копировать ссылку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
