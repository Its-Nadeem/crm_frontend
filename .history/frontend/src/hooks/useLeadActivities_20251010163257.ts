import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Activity, Task, User } from '../types';

// Scoped cache invalidation utilities
export const invalidateLeadCache = (queryClient: any, leadId: string) => {
  // Invalidate only the specific lead's data, not all leads
  queryClient.invalidateQueries({ queryKey: leadQueryKeys.activities(leadId) });
  queryClient.invalidateQueries({ queryKey: leadQueryKeys.lead(leadId) });
};

export const invalidateAllLeadCaches = (queryClient: any) => {
  // Invalidate all lead-related caches when needed
  queryClient.invalidateQueries({ queryKey: ['leads'] });
};

// Query keys for React Query
export const leadQueryKeys = {
  all: ['leads'] as const,
  lead: (leadId: string) => ['leads', leadId] as const,
  activities: (leadId: string) => ['leads', leadId, 'activities'] as const,
  notes: (leadId: string) => ['leads', leadId, 'notes'] as const,
  tasks: (leadId: string) => ['leads', leadId, 'tasks'] as const,
};

// Hook for fetching a single lead by ID
export const useLead = (leadId: string, currentUser: User) => {
  return useQuery({
    queryKey: leadQueryKeys.lead(leadId),
    queryFn: () => apiService.getLeadById(leadId),
    enabled: !!leadId && !!currentUser, // Only run when leadId and currentUser are available
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (prev) => prev, // never go empty between refetch cycles
  });
};

// Hook for fetching lead activities
export const useLeadActivities = (leadId: string, currentUser: User) => {
  return useQuery({
    queryKey: leadQueryKeys.activities(leadId),
    queryFn: () => apiService.getLeadActivities(leadId),
    enabled: !!leadId && !!currentUser, // Only run when leadId and currentUser are available
    placeholderData: (prev) => prev, // never go empty between refetch cycles
    refetchInterval: false, // Disable automatic polling - rely on manual refresh
    staleTime: 30000, // Consider data stale after 30 seconds (increased from 5s)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a note with optimistic updates
export const useCreateLeadNote = (leadId: string, currentUser: User, isMutatingRef?: React.MutableRefObject<boolean>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteData: { content: string; leadId: string }) =>
      apiService.createLeadNote(leadId, noteData),

    onMutate: async (newNote) => {
      // Set mutation flag
      if (isMutatingRef) isMutatingRef.current = true;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadQueryKeys.activities(leadId) });

      // Snapshot the previous value
      const previousActivities = queryClient.getQueryData(leadQueryKeys.activities(leadId));

      // Optimistically update the cache
      const tempNote: Activity = {
        id: `temp-note-${Date.now()}`,
        type: 'NOTE',
        content: `Note added: <i class="whitespace-pre-wrap">"${newNote.content}"</i>`,
        timestamp: new Date().toISOString(),
        authorId: currentUser.id,
      };

      queryClient.setQueryData(leadQueryKeys.activities(leadId), (old: Activity[] = []) => [
        tempNote,
        ...old,
      ]);

      // Return a context object with the snapshotted value
      return { previousActivities, tempId: tempNote.id };
    },

    onError: (err, newNote, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousActivities) {
        queryClient.setQueryData(leadQueryKeys.activities(leadId), context.previousActivities);
      }
    },

    onSuccess: (data, variables, context) => {
      // Replace the temporary note with the real one from the server
      queryClient.setQueryData(leadQueryKeys.activities(leadId), (old: Activity[] = []) =>
        old.map(activity =>
          activity.id === context?.tempId ? data.data : activity
        )
      );
    },

    onSettled: () => {
      // Reset mutation flag
      if (isMutatingRef) isMutatingRef.current = false;

      // Use controlled cache invalidation - mark as stale but don't trigger immediate refetch
      queryClient.invalidateQueries({
        queryKey: leadQueryKeys.activities(leadId),
        refetchType: 'none' // Don't refetch immediately, just mark as stale
      });
    },
  });
};

// Hook for creating a task with optimistic updates
export const useCreateLeadTask = (leadId: string, currentUser: User) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: {
      title: string;
      leadId: string;
      assignedToId: number;
      dueDate: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
    }) => apiService.createLeadTask(leadId, taskData),

    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadQueryKeys.activities(leadId) });

      // Snapshot the previous value
      const previousActivities = queryClient.getQueryData(leadQueryKeys.activities(leadId));

      // Optimistically update the cache
      const tempTask: Activity = {
        id: `temp-task-${Date.now()}`,
        type: 'TASK_CREATED',
        content: `Task created: <strong>${newTask.title}</strong>`,
        timestamp: new Date().toISOString(),
        authorId: currentUser.id,
      };

      queryClient.setQueryData(leadQueryKeys.activities(leadId), (old: Activity[] = []) => [
        tempTask,
        ...old,
      ]);

      // Return a context object with the snapshotted value
      return { previousActivities, tempId: tempTask.id };
    },

    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousActivities) {
        queryClient.setQueryData(leadQueryKeys.activities(leadId), context.previousActivities);
      }
    },

    onSuccess: (data, variables, context) => {
      // Replace the temporary task with the real one from the server
      queryClient.setQueryData(leadQueryKeys.activities(leadId), (old: Activity[] = []) =>
        old.map(activity =>
          activity.id === context?.tempId ? data.data : activity
        )
      );
    },

    onSettled: () => {
      // Only invalidate if we don't have fresh data - don't trigger immediate refetch
      queryClient.invalidateQueries({
        queryKey: leadQueryKeys.activities(leadId),
        refetchType: 'none' // Don't refetch immediately, just mark as stale
      });
    },
  });
};

// Hook for updating task status
export const useUpdateTaskStatus = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) =>
      apiService.updateTask(taskId, { isCompleted }),

    onMutate: async ({ taskId, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: leadQueryKeys.activities(leadId) });
      const previousActivities = queryClient.getQueryData(leadQueryKeys.activities(leadId));

      // Optimistically update task status in activities
      queryClient.setQueryData(leadQueryKeys.activities(leadId), (old: Activity[] = []) =>
        old.map(activity => {
          if (activity.type === 'TASK_CREATED' && activity.content.includes(taskId)) {
            return {
              ...activity,
              type: isCompleted ? 'TASK_COMPLETED' : 'TASK_CREATED',
              content: activity.content.replace(
                'Task created:',
                isCompleted ? 'Task completed:' : 'Task created:'
              ),
            };
          }
          return activity;
        })
      );

      return { previousActivities };
    },

    onError: (err, variables, context) => {
      if (context?.previousActivities) {
        queryClient.setQueryData(leadQueryKeys.activities(leadId), context.previousActivities);
      }
    },

    onSettled: () => {
      invalidateLeadCache(queryClient, leadId);
    },
  });
};


