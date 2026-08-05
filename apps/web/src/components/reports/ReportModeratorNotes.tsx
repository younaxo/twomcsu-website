'use client';

import type { ReportModeratorNote, RoleGroup } from '@twomc/shared';
import { RoleGroup as RG, hasRoleGroup } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Pin, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateModeratorNote,
  useDeleteModeratorNote,
  usePinModeratorNote,
  useUpdateModeratorNote,
} from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';

export function ReportModeratorNotes({
  reportNumber,
  notes,
  currentUserId,
  roleGroup,
}: {
  reportNumber: string;
  notes: ReportModeratorNote[];
  currentUserId: string;
  roleGroup: RoleGroup;
}) {
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const createNote = useCreateModeratorNote(reportNumber);
  const updateNote = useUpdateModeratorNote(reportNumber);
  const deleteNote = useDeleteModeratorNote(reportNumber);
  const pinNote = usePinModeratorNote(reportNumber);

  const isAdmin = hasRoleGroup(roleGroup, RG.ADMIN);

  const submit = async () => {
    if (!content.trim()) return;
    try {
      await createNote.mutateAsync(content.trim());
      setContent('');
      toast.success('Заметка добавлена');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить заметку'));
    }
  };

  return (
    <section className="space-y-4 rounded-2xl glass-medium p-5">
      <h2 className="text-sm font-medium text-muted-foreground">Заметки модераторов</h2>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Заметок пока нет</p>
        ) : (
          notes.map((note) => {
            const canEdit = note.author.id === currentUserId || isAdmin;
            return (
              <article key={note.id} className="rounded-xl glass-light p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <AvatarWithSkin user={note.author} size="sm" />
                  <ColoredUsername user={note.author} size="sm" />
                  {note.isPinned ? <Pin className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </span>
                  {canEdit ? (
                    <div className="ml-auto flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          void pinNote
                            .mutateAsync(note.id)
                            .catch((error) => toast.error(extractErrorMessage(error)))
                        }
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditText(note.content);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          void deleteNote
                            .mutateAsync(note.id)
                            .then(() => toast.success('Заметка удалена'))
                            .catch((error) => toast.error(extractErrorMessage(error)))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Отмена
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          void updateNote
                            .mutateAsync({ noteId: note.id, content: editText.trim() })
                            .then(() => {
                              setEditingId(null);
                              toast.success('Заметка обновлена');
                            })
                            .catch((error) => toast.error(extractErrorMessage(error)))
                        }
                      >
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : note.contentHtml ? (
                  <div
                    className="prose prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: note.contentHtml }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-neutral-200">{note.content}</p>
                )}
              </article>
            );
          })
        )}
      </div>

      <div className="space-y-2 border-t border-white/5 pt-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Новая заметка для модераторов..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => void submit()}
            disabled={createNote.isPending || content.trim().length < 1}
            className="bg-[#F57C00] text-black hover:bg-[#E65100]"
          >
            Добавить заметку
          </Button>
        </div>
      </div>
    </section>
  );
}
