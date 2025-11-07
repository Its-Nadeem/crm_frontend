import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, User } from '../../types';
import { AppIcons } from '../ui/Icons';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiService } from '../../services/api';

interface ActivityTimelineProps {
     activities: Activity[];
     users: User[];
     currentUser: User;
     leadId?: string;
     onRefresh?: () => void;
     onManualRefresh?: () => void; // Callback when user manually refreshes
     realTime?: boolean;
     disableAutoRefresh?: boolean;
 }

interface EnhancedActivity extends Activity {
    status?: 'sent' | 'delivered' | 'failed' | 'pending' | 'initiated';
    metadata?: {
        duration?: number;
        templateId?: string;
        recipientCount?: number;
        errorMessage?: string;
    };
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
       activities,
       users,
       currentUser,
       leadId,
       onRefresh,
       onManualRefresh,
       realTime = true,
       disableAutoRefresh = false
   }) => {
       const [allActivities, setAllActivities] = useState<EnhancedActivity[]>([]);
       const [isLoadingActivities, setIsLoadingActivities] = useState(false);
       const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
       const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(realTime);
       const [isRefreshing, setIsRefreshing] = useState(false);
       const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

     // Use WebSocket for real-time updates (currently disabled, using polling instead)
     const { isConnected } = useWebSocket(leadId);

    // Single function to load all activities - combines backend data with prop activities
    const loadAllActivities = useCallback(async () => {
        if (!leadId) return;

        setIsLoadingActivities(true);
        try {
            console.log('ActivityTimeline: Loading all activities for lead:', leadId);

            // Fetch backend data
            const [notesData, callsData, tasksData] = await Promise.all([
                apiService.getNotes(leadId),
                apiService.getCalls(leadId),
                apiService.getTasks(currentUser.organizationId)
            ]);

            // Convert backend data to activities
            const backendActivities: EnhancedActivity[] = [];

            // Add notes as activities
            (notesData || []).forEach(note => {
                backendActivities.push({
                    id: note.id || `note-${note.createdAt}`,
                    type: 'NOTE',
                    content: `Note added: <i class="whitespace-pre-wrap">"${note.content}"</i>`,
                    timestamp: note.createdAt,
                    authorId: note.authorId
                });
            });

            // Add calls as activities
            (callsData || []).forEach(call => {
                backendActivities.push({
                    id: call.id || `call-${call.createdAt}`,
                    type: 'CALL',
                    content: `Call logged. Outcome: <strong>${call.outcome}</strong>. Notes: <i class="whitespace-pre-wrap">"${call.notes || ''}"</i>`,
                    timestamp: call.createdAt,
                    authorId: call.authorId
                });
            });

            // Add tasks as activities (only for this lead)
            const leadTasks = (tasksData || []).filter((task: any) => task.leadId === leadId);
            leadTasks.forEach(task => {
                backendActivities.push({
                    id: task.id || `task-${task.createdAt}`,
                    type: task.isCompleted ? 'TASK_COMPLETED' : 'TASK_CREATED',
                    content: task.isCompleted
                        ? `Task completed: "${task.title}"`
                        : `Task created: "${task.title}"`,
                    timestamp: task.updatedAt || task.createdAt,
                    authorId: task.createdById
                });
            });

            // Combine backend activities with prop activities (field updates, immediate actions)
            // Deduplicate by ID and timestamp to prevent duplicates
            const allActivitiesMap = new Map<string, EnhancedActivity>();

            // Add backend activities first
            backendActivities.forEach(activity => {
                const key = `${activity.type}-${activity.timestamp}-${activity.content}`;
                allActivitiesMap.set(key, activity);
            });

            // Add prop activities, but skip if already exists
            (activities || []).forEach(act => {
                const activity = act as EnhancedActivity;
                const key = `${activity.type}-${activity.timestamp}-${activity.content}`;
                if (!allActivitiesMap.has(key)) {
                    allActivitiesMap.set(key, activity);
                }
            });

            const allActivitiesCombined = Array.from(allActivitiesMap.values())
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setAllActivities(allActivitiesCombined);
            console.log('ActivityTimeline: Loaded activities:', allActivitiesCombined.length);
        } catch (error) {
            console.error('ActivityTimeline: Error loading activities:', error);
        } finally {
            setIsLoadingActivities(false);
        }
    }, [leadId, currentUser.organizationId, activities]);

    // Load activities on mount and when leadId or activities prop changes
    useEffect(() => {
        loadAllActivities();
    }, [loadAllActivities]);

    // Group activities by date
    const groupedActivities = React.useMemo(() => {
        const groups: Record<string, EnhancedActivity[]> = {};

        allActivities.forEach(activity => {
            const date = new Date(activity.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
        });

        // Sort activities within each group by timestamp (newest first)
        Object.keys(groups).forEach(date => {
            groups[date].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });

        return groups;
    }, [allActivities]);

    // Real-time updates (polling fallback every 5 seconds for instant updates) - only when explicitly enabled and realTime is true
      useEffect(() => {
           // Don't poll if realTime is disabled, component polling is disabled, no refresh function, WebSocket is connected, or auto-refresh is disabled
           if (!realTime || !isRealTimeEnabled || isConnected || disableAutoRefresh) {
               // Clear any existing interval if conditions aren't met
               if (pollingIntervalRef.current) {
                   console.log('ActivityTimeline: Stopping polling due to condition change');
                   clearInterval(pollingIntervalRef.current);
                   pollingIntervalRef.current = null;
               }
               return;
           }

           console.log('ActivityTimeline: Starting polling every 5 seconds for instant updates');
           pollingIntervalRef.current = setInterval(() => {
               console.log('ActivityTimeline: Polling triggered - fetching latest activities');
               loadAllActivities();
           }, 5000); // Polling every 5 seconds for instant updates

           return () => {
               console.log('ActivityTimeline: Stopping polling');
               if (pollingIntervalRef.current) {
                   clearInterval(pollingIntervalRef.current);
                   pollingIntervalRef.current = null;
               }
           };
       }, [realTime, isRealTimeEnabled, isConnected, disableAutoRefresh, loadAllActivities]);

      // Manual refresh trigger and instant updates
      useEffect(() => {
          const handleTimelineRefresh = (event: CustomEvent) => {
              if (event.detail?.leadId === leadId) {
                  console.log('ActivityTimeline: Timeline refresh event received, fetching activities immediately');
                  loadAllActivities();
              }
          };

          const handleInstantActivityUpdate = (event: CustomEvent) => {
              if (event.detail?.leadId === leadId) {
                  console.log('ActivityTimeline: Instant activity update received, refreshing immediately');
                  loadAllActivities();
              }
          };

          window.addEventListener('timelineRefresh', handleTimelineRefresh as EventListener);
          window.addEventListener('activityUpdate', handleInstantActivityUpdate as EventListener);

          return () => {
              window.removeEventListener('timelineRefresh', handleTimelineRefresh as EventListener);
              window.removeEventListener('activityUpdate', handleInstantActivityUpdate as EventListener);
          };
      }, [leadId, loadAllActivities]);

    // Additional effect to immediately stop polling when WebSocket connects
  useEffect(() => {
      if (isConnected && !realTime) {
          console.log('ActivityTimeline: WebSocket connected, ensuring polling is disabled');
          setIsRealTimeEnabled(false);
      }
  }, [isConnected, realTime]);


    // Cleanup effect to ensure polling is stopped when component unmounts
    useEffect(() => {
        return () => {
            console.log('ActivityTimeline: Component cleanup, ensuring no polling remains active');
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            setIsRealTimeEnabled(false);
        };
    }, []);

    // Effect to handle realTime prop changes - ensure polling stops when realTime becomes false
    useEffect(() => {
        if (!realTime) {
            console.log('ActivityTimeline: realTime disabled, stopping all polling');
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            setIsRealTimeEnabled(false);
        }
    }, [realTime]);

    // Debug logging for props and state changes
    useEffect(() => {
        console.log('ActivityTimeline Debug:', {
            isRealTimeEnabled,
            hasOnRefresh: !!onRefresh,
            isConnected,
            shouldPoll: isRealTimeEnabled && !!onRefresh && !isConnected
        });
    }, [isRealTimeEnabled, onRefresh, isConnected]);

    // Additional safety check - if realTime is false, ensure no polling happens
    useEffect(() => {
        if (!realTime) {
            console.log('ActivityTimeline: realTime prop is false, ensuring no polling');
        }
    }, [realTime]);

    // Force disable polling when realTime is false
    useEffect(() => {
        if (!realTime && isRealTimeEnabled) {
            console.log('ActivityTimeline: Forcing isRealTimeEnabled to false due to realTime prop');
            setIsRealTimeEnabled(false);
        }
    }, [realTime, isRealTimeEnabled]);

    // Enhanced safety: completely disable polling when realTime is false
    useEffect(() => {
        if (!realTime) {
            console.log('ActivityTimeline: realTime is false, completely disabling polling');
            setIsRealTimeEnabled(false);
        }
    }, [realTime]);

    const toggleActivityExpansion = (activityId: string) => {
        const newExpanded = new Set(expandedActivities);
        if (newExpanded.has(activityId)) {
            newExpanded.delete(activityId);
        } else {
            newExpanded.add(activityId);
        }
        setExpandedActivities(newExpanded);
    };

    const getActivityIcon = (type: Activity['type'], status?: string, content?: string) => {
        const iconProps = { className: "h-5 w-5" };

        // Type-based coloring with status overrides
        let baseColor = '';

        switch (type) {
            case 'EMAIL':
                baseColor = 'text-blue-500';
                break;
            case 'WHATSAPP':
                baseColor = 'text-green-500';
                break;
            case 'SMS':
                baseColor = 'text-purple-500';
                break;
            case 'CALL':
                baseColor = 'text-indigo-500';
                break;
            case 'NOTE':
                baseColor = 'text-yellow-500';
                break;
            case 'TASK_CREATED':
                baseColor = 'text-cyan-500';
                break;
            case 'TASK_COMPLETED':
                baseColor = 'text-emerald-500';
                break;
            case 'LEAD_CREATED':
                baseColor = 'text-blue-600';
                break;
            case 'MESSAGE_SCHEDULED':
                baseColor = 'text-orange-500';
                break;
            case 'FIELD_UPDATE':
            case 'STATUS_CHANGE':
                // Special handling for field updates - determine color based on field type
                baseColor = getFieldUpdateColor(content || '');
                break;
            default:
                baseColor = 'text-gray-500';
        }

        // Status-based coloring overrides (for communication activities)
        if (status === 'failed') {
            iconProps.className += ' text-red-500';
        } else if (status === 'sent' || status === 'delivered') {
            iconProps.className += ' text-green-600';
        } else if (status === 'pending') {
            iconProps.className += ' text-yellow-500';
        } else if (status === 'initiated') {
            iconProps.className += ' text-blue-500';
        } else {
            // Use type-based color if no status override
            iconProps.className += ` ${baseColor}`;
        }

        switch (type) {
            case 'EMAIL': return <AppIcons.Email {...iconProps} />;
            case 'WHATSAPP': return <AppIcons.Whatsapp {...iconProps} />;
            case 'SMS': return <AppIcons.SMS {...iconProps} />;
            case 'CALL': return <AppIcons.Call {...iconProps} />;
            case 'NOTE': return <AppIcons.Note {...iconProps} />;
            case 'TASK_CREATED': return <AppIcons.Tasks {...iconProps} />;
            case 'TASK_COMPLETED': return <AppIcons.Tasks {...iconProps} />;
            case 'LEAD_CREATED': return <AppIcons.Add {...iconProps} />;
            case 'MESSAGE_SCHEDULED': return <AppIcons.Activity {...iconProps} />;
            case 'FIELD_UPDATE':
            case 'STATUS_CHANGE': return <AppIcons.StatusChange {...iconProps} />;
            default: return <div className="text-gray-400">🔄</div>;
        }
    };

    // Helper function to determine color for field updates based on content
    const getFieldUpdateColor = (content: string): string => {
        const lowerContent = content.toLowerCase();

        // Stage/Pipeline changes - orange/red for important status changes
        if (lowerContent.includes('stage') || lowerContent.includes('pipeline') || lowerContent.includes('status')) {
            return 'text-orange-500';
        }

        // Owner/Assignment changes - purple for people-related changes
        if (lowerContent.includes('assigned to') || lowerContent.includes('owner') || lowerContent.includes('assigned')) {
            return 'text-purple-500';
        }

        // Deal value changes - green for money-related
        if (lowerContent.includes('deal value') || lowerContent.includes('price') || lowerContent.includes('cost')) {
            return 'text-green-500';
        }

        // Contact info changes - blue for communication
        if (lowerContent.includes('email') || lowerContent.includes('phone') || lowerContent.includes('contact')) {
            return 'text-blue-500';
        }

        // Personal info changes - teal for personal details
        if (lowerContent.includes('name') || lowerContent.includes('company') || lowerContent.includes('city') || lowerContent.includes('course')) {
            return 'text-teal-500';
        }

        // Campaign/Marketing changes - pink for marketing
        if (lowerContent.includes('campaign') || lowerContent.includes('facebook') || lowerContent.includes('source')) {
            return 'text-pink-500';
        }

        // Default for other field updates
        return 'text-gray-500';
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        const statusConfig = {
            sent: { label: 'Saved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
            delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
            failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
            pending: { label: 'Saving...', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
            initiated: { label: 'Initiated', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        if (!config) return null;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const formatActivityContent = (activity: EnhancedActivity) => {
        const author = users.find(u => u.id === activity.authorId);
        const timeAgo = new Date(activity.timestamp).toLocaleString();

        return (
            <div className="flex items-start space-x-3 p-4 hover:bg-muted/30 rounded-lg transition-colors">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type, activity.status, activity.content)}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-on-surface text-sm">
                                {getActivityTitle(activity)}
                            </span>
                            {getStatusBadge(activity.status)}
                        </div>
                        <span className="text-xs text-subtle">
                            {author?.name?.split(' (')[0] || 'System'} • {timeAgo}
                        </span>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-subtle mb-2 line-clamp-2">
                        {getActivitySummary(activity)}
                    </p>

                    {/* Expandable details */}
                    {getActivityDetails(activity) && (
                        <div className="mt-2">
                            <button
                                onClick={() => toggleActivityExpansion(activity.id)}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                                {expandedActivities.has(activity.id) ? 'Show less' : 'Show more'}
                            </button>

                            {expandedActivities.has(activity.id) && (
                                <div className="mt-2 p-3 bg-muted/30 rounded border">
                                    {getActivityDetails(activity)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const getActivityTitle = (activity: EnhancedActivity) => {
        switch (activity.type) {
            case 'EMAIL': return 'Email Sent';
            case 'WHATSAPP': return 'WhatsApp Message';
            case 'SMS': return 'SMS Sent';
            case 'CALL': return 'Call Logged';
            case 'NOTE': return 'Note Added';
            case 'TASK_CREATED': return 'Task Created';
            case 'TASK_COMPLETED': return 'Task Completed';
            case 'LEAD_CREATED': return 'Lead Created';
            case 'MESSAGE_SCHEDULED': return 'Message Scheduled';
            case 'FIELD_UPDATE': return 'Field Updated';
            case 'STATUS_CHANGE': return 'Status Changed';
            default: return 'Activity';
        }
    };

    const getActivitySummary = (activity: EnhancedActivity) => {
        // Extract summary from content (remove HTML tags and limit length)
        const textContent = activity.content.replace(/<[^>]*>/g, '');
        return textContent.length > 100 ? `${textContent.substring(0, 100)}...` : textContent;
    };

    const getActivityDetails = (activity: EnhancedActivity) => {
        const details = [];

        // Add metadata details
        if (activity.metadata?.duration) {
            details.push(`Duration: ${activity.metadata.duration} seconds`);
        }

        if (activity.metadata?.templateId) {
            details.push(`Template used`);
        }

        if (activity.metadata?.recipientCount) {
            details.push(`Recipients: ${activity.metadata.recipientCount}`);
        }

        if (activity.metadata?.errorMessage) {
            details.push(`Error: ${activity.metadata.errorMessage}`);
        }

        // Add full content
        const fullContent = activity.content.replace(/<[^>]*>/g, '');
        if (fullContent.length > 100) {
            details.push(`Full content: ${fullContent}`);
        }

        return details.length > 0 ? (
            <div className="space-y-1 text-xs text-subtle">
                {details.map((detail, index) => (
                    <div key={index}>• {detail}</div>
                ))}
            </div>
        ) : null;
    };

    return (
        <div className="space-y-6">
            {/* Timeline header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-on-surface">Activity Timeline</h3>
                    {disableAutoRefresh && (
                        <div className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Manual Refresh</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isRealTimeEnabled && (
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Live (WebSocket)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                    <span>Live (Polling)</span>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                        className={`text-xs px-2 py-1 rounded ${isRealTimeEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-muted text-subtle'}`}
                    >
                        {isRealTimeEnabled ? 'Pause' : 'Resume'}
                    </button>
                    {onRefresh && (
                        <button
                            onClick={() => {
                                console.log('🔄 Manual refresh triggered by user');
                                setIsRefreshing(true);
                                loadAllActivities();
                                // Reset refreshing state after 2 seconds
                                setTimeout(() => setIsRefreshing(false), 2000);
                            }}
                            disabled={isRefreshing}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                                isRefreshing
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            }`}
                            title="Refresh timeline manually"
                        >
                            {isRefreshing ? (
                                <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Refreshing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Refresh</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline content */}
            <div className="space-y-4">
                {Object.keys(groupedActivities).length === 0 ? (
                    <div className="text-center py-8 text-subtle">
                        <AppIcons.Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No activities yet</p>
                        <p className="text-sm">Activities will appear here when you interact with this lead</p>
                    </div>
                ) : (
                    Object.entries(groupedActivities).map(([date, dayActivities]) => (
                        <div key={date} className="space-y-3">
                            {/* Date header */}
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                                        {new Date(date).getDate()}
                                    </span>
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-medium text-on-surface">
                                        {new Date(date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h4>
                                    <p className="text-xs text-subtle">
                                        {dayActivities.length} activit{dayActivities.length === 1 ? 'y' : 'ies'}
                                    </p>
                                </div>
                            </div>

                            {/* Activities for this date */}
                            <div className="ml-5 space-y-1 border-l border-muted pl-4">
                                {dayActivities.map((activity, index) => (
                                    <div key={activity.id}>
                                        {formatActivityContent(activity)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


