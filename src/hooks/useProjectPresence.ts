import { useEffect, useState } from 'react';
import { getEcho } from '@/lib/echo';

export interface PresenceMember {
  id: number;
  name: string;
}

export interface UseProjectPresenceResult {
  members: PresenceMember[];
  count: number;
}

export function useProjectPresence(projectId: number): UseProjectPresenceResult {
  const [members, setMembers] = useState<PresenceMember[]>([]);

  useEffect(() => {
    const echo = getEcho();
    if (!echo || !projectId) return;

    echo.join(`presence-project.${projectId}`)
      .here((users: PresenceMember[]) => {
        setMembers(users);
      })
      .joining((user: PresenceMember) => {
        setMembers((prev) => prev.find((m) => m.id === user.id) ? prev : [...prev, user]);
      })
      .leaving((user: PresenceMember) => {
        setMembers((prev) => prev.filter((m) => m.id !== user.id));
      });

    return () => {
      echo.leave(`presence-project.${projectId}`);
    };
  }, [projectId]);

  return { members, count: members.length };
}
