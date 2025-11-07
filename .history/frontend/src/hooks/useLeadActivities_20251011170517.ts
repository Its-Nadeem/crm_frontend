import React from 'react';
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

// Hook for fetching a single lead by ID - simplified without React Query
export const useLead = (leadId: string, currentUser: User) => {
  const [lead, setLead] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchLead = React.useCallback(async () => {
    if (!leadId || !currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching lead:', leadId);
      const data = await apiService.getLeadById(leadId);
      setLead(data);
      console.log('✅ Lead fetched successfully');
    } catch (err) {
      console.error('❌ Failed to fetch lead:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [leadId, currentUser]);

  // Fetch lead when leadId or currentUser changes
  React.useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  return {
    data: lead,
    isLoading,
    error,
    refetch: fetchLead
  };
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

// Hook for creating a task - simple API call without complex state management
export const useCreateLeadTask = (leadId: string, currentUser: User) => {
  return {
    mutateAsync: async (taskData: {
      title: string;
      leadId: string;
      assignedToId: number;
      dueDate: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
    }) => {
      try {
        const result = await apiService.createLeadTask(leadId, taskData);
        console.log('Task created successfully');
        return result;
      } catch (error) {
        console.error('Task creation failed:', error);
        throw error;
      }
    },
    isPending: false, // Simplified - no loading state management
  };
};

// Hook for updating task status - simple API call without complex state management
export const useUpdateTaskStatus = (leadId: string) => {
  return {
    mutateAsync: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      try {
        const result = await apiService.updateTask(taskId, { isCompleted });
        console.log('Task status updated successfully');
        return result;
      } catch (error) {
        console.error('Task status update failed:', error);
        throw error;
      }
    },
    isPending: false, // Simplified - no loading state management
  };
};


