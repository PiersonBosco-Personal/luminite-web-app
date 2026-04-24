import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho } from '@/lib/echo';

export function useProjectChannel(projectId: number): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const echo = getEcho();
    if (!echo || !projectId) return;

    const channel = echo.private(`project.${projectId}`);

    channel
      // Task events — tasks are nested under sections in the API response
      .listen('.task.created',     () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))
      .listen('.task.updated',     () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))
      .listen('.task.deleted',     () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))
      .listen('.tasks.reordered',  () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))

      // Section events
      .listen('.section.created',    () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))
      .listen('.section.updated',    () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))
      .listen('.section.deleted',    () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))
      .listen('.sections.reordered', () => queryClient.invalidateQueries({ queryKey: ['sections', projectId] }))

      // Note events
      .listen('.note.created', () => queryClient.invalidateQueries({ queryKey: ['notes', projectId] }))
      .listen('.note.updated', () => queryClient.invalidateQueries({ queryKey: ['notes', projectId] }))
      .listen('.note.deleted', () => queryClient.invalidateQueries({ queryKey: ['notes', projectId] }))

      // Note folder events
      .listen('.note_folder.created', () => queryClient.invalidateQueries({ queryKey: ['note-folders', projectId] }))
      .listen('.note_folder.updated', () => queryClient.invalidateQueries({ queryKey: ['note-folders', projectId] }))
      .listen('.note_folder.deleted', () => {
        queryClient.invalidateQueries({ queryKey: ['note-folders', projectId] });
        queryClient.invalidateQueries({ queryKey: ['notes', projectId] }); // notes may move to root on folder delete
      })

      // Label events
      .listen('.label.created', () => queryClient.invalidateQueries({ queryKey: ['labels', projectId] }))
      .listen('.label.updated', () => {
        queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
        queryClient.invalidateQueries({ queryKey: ['sections', projectId] }); // label name/color on tasks
        queryClient.invalidateQueries({ queryKey: ['notes', projectId] });    // label name/color on notes
      })
      .listen('.label.deleted', () => {
        queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
        queryClient.invalidateQueries({ queryKey: ['sections', projectId] });
        queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      })

      // Project event
      .listen('.project.updated', () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }));

    return () => {
      echo.leave(`project.${projectId}`);
    };
  }, [projectId, queryClient]);
}
