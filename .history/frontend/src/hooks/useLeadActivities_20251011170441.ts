import React from 'react';
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

// Hook for fetching lead activities - simplified without React Query
export const useLeadActivities = (leadId: string, currentUser: User) => {
    const [activities, setActivities] = React.useState<Activity[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    const fetchActivities = React.useCallback(async () => {
        if (!leadId || !currentUser) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log('🔄 Fetching activities for lead:', leadId);
            const data = await apiService.getLeadActivities(leadId);
            setActivities(data);
            console.log('✅ Activities fetched successfully:', data.length);
        } catch (err) {
            console.error('❌ Failed to fetch activities:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [leadId, currentUser]);

    // Fetch activities when leadId or currentUser changes
    React.useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const refetch = React.useCallback(() => {
        console.log('🔄 Manual refetch triggered');
        fetchActivities();
    }, [fetchActivities]);

    return {
        data: activities,
        isLoading,
        error,
        refetch
    };
};

// Hook for creating a note - simple API call without complex state management
export const useCreateLeadNote = (leadId: string, currentUser: User, isMutatingRef?: React.MutableRefObject<boolean>) => {
  return {
    mutateAsync: async (noteData: { content: string; leadId: string }) => {
      if (isMutatingRef) isMutatingRef.current = true;

      try {
        const result = await apiService.createLeadNote(leadId, noteData);
        console.log('Note created successfully');
        return result;
      } catch (error) {
        console.error('Note creation failed:', error);
        throw error;
      } finally {
        if (isMutatingRef) isMutatingRef.current = false;
      }
    },
    isPending: false, // Simplified - no loading state management
  };
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
      // Use very conservative cache invalidation to prevent loops
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
      // Use very conservative cache invalidation to prevent loops
      queryClient.invalidateQueries({
        queryKey: leadQueryKeys.activities(leadId),
        refetchType: 'none' // Don't refetch immediately, just mark as stale
      });
    },
  });
};


