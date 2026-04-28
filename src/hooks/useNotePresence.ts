import { useEffect, useState } from 'react';
import { getEcho } from '@/lib/echo';

export interface NotePresenceMember {
  id: number;
  name: string;
}

export function useNotePresence(noteId: number | null, currentUserId: number | undefined) {
  const [others, setOthers] = useState<NotePresenceMember[]>([]);

  useEffect(() => {
    if (!noteId) {
      setOthers([]);
      return;
    }

    const echo = getEcho();
    if (!echo) return;

    echo
      .join(`presence-note.${noteId}`)
      .here((users: NotePresenceMember[]) => {
        setOthers(users.filter((u) => u.id !== currentUserId));
      })
      .joining((user: NotePresenceMember) => {
        if (user.id === currentUserId) return;
        setOthers((prev) => (prev.find((m) => m.id === user.id) ? prev : [...prev, user]));
      })
      .leaving((user: NotePresenceMember) => {
        setOthers((prev) => prev.filter((m) => m.id !== user.id));
      });

    return () => {
      echo.leave(`presence-note.${noteId}`);
      setOthers([]);
    };
  }, [noteId, currentUserId]);

  return others;
}
