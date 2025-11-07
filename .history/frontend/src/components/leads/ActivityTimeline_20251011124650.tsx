import React, { useState, useEffect, useRef } from 'react';
import { Activity, User } from '../../types';
import { AppIcons } from '../ui/Icons';
import { useWebSocket } from '../../hooks/useWebSocket';

interface ActivityTimelineProps {
     activities: Activity[];
     users: User[];
     currentUser: User;
     leadId?: string;
     onRefresh?: () => void;
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
      realTime = true,
      disableAutoRefresh = false
  }) => {
     const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
     const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(realTime);
     const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Use WebSocket for real-time updates
    const { isConnected } = useWebSocket(leadId);

    // Group activities by date
    const groupedActivities = React.useMemo(() => {
        const groups: Record<string, EnhancedActivity[]> = {};

        activities.forEach(activity => {
            const date = new Date(activity.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity as EnhancedActivity);
        });

        // Sort activities within each group by timestamp (newest first)
        Object.keys(groups).forEach(date => {
            groups[date].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });

        return groups;
    }, [activities]);

    // Real-time updates (polling fallback every 10 seconds) - only when explicitly enabled and realTime is true
    useEffect(() => {
        // Don't poll if realTime is disabled, component polling is disabled, no refresh function, WebSocket is connected, or auto-refresh is disabled
        if (!realTime || !isRealTimeEnabled || !onRefresh || isConnected || disableAutoRefresh) {
            // Clear any existing interval if conditions aren't met
            if (pollingIntervalRef.current) {
                console.log('ActivityTimeline: Stopping polling due to condition change');
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            return;
        }

        console.log('ActivityTimeline: Starting polling every 10 seconds');
        pollingIntervalRef.current = setInterval(() => {
            console.log('ActivityTimeline: Polling triggered');
            onRefresh();
        }, 10000);

        return () => {
            console.log('ActivityTimeline: Stopping polling');
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [realTime, isRealTimeEnabled, onRefresh, isConnected, disableAutoRefresh]);

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

    const getActivityIcon = (type: Activity['type'], status?: string) => {
        const iconProps = { className: "h-5 w-5" };

        // Status-based coloring
        if (status === 'failed') {
            iconProps.className += ' text-red-500';
        } else if (status === 'sent' || status === 'delivered') {
            iconProps.className += ' text-green-500';
        } else if (status === 'pending') {
            iconProps.className += ' text-yellow-500';
        } else if (status === 'initiated') {
            iconProps.className += ' text-blue-500';
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
                    {getActivityIcon(activity.type, activity.status)}
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
                            {author?.name || 'Unknown'} • {timeAgo}
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
                <h3 className="font-semibold text-on-surface">Activity Timeline</h3>
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
                            onClick={onRefresh}
                            className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                            Refresh
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


