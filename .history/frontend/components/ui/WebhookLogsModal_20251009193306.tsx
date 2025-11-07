import React, { useState, useEffect, useMemo } from 'react';
import { WebhookDeliveryLog, WebhookLogsFilters } from '../../types';
import { AppIcons } from './Icons';
import Modal from './Modal';

interface WebhookLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    webhookId: string;
    webhookName: string;
}

const WebhookLogsModal: React.FC<WebhookLogsModalProps> = ({
    isOpen,
    onClose,
    webhookId,
    webhookName
}) => {
    const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<WebhookDeliveryLog | null>(null);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [filters, setFilters] = useState<WebhookLogsFilters>({
        event: 'all',
        status: 'all',
        search: ''
    });

    // Fetch logs function
    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching logs for webhookId:', webhookId);
            if (!webhookId) {
                throw new Error('Webhook ID is required');
            }

            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const queryParams = new URLSearchParams();
            queryParams.append('limit', '50');

            if (filters.event && filters.event !== 'all') {
                queryParams.append('event', filters.event);
            }
            if (filters.status && filters.status !== 'all') {
                queryParams.append('status', filters.status);
            }
            if (filters.search) {
                queryParams.append('search', filters.search);
            }

            const url = `http://localhost:5000/api/webhooks/${webhookId}/logs?${queryParams}`;
            console.log('Fetching logs from URL:', url);
            console.log('WebhookId type:', typeof webhookId, 'Value:', webhookId);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch logs: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setLogs(data.data || []);
            } else {
                throw new Error(data.message || 'Failed to fetch logs');
            }
        } catch (err) {
            console.error('Error fetching webhook logs:', err);
            setError(err instanceof Error ? err.message : 'Couldn\'t load logs. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // Retry delivery function
    const retryDelivery = async (deliveryId: string) => {
        try {
            setRetryingId(deliveryId);
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`http://localhost:5000/api/webhooks/deliveries/${deliveryId}/retry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Retry failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                // Refresh logs to show the new retry attempt
                await fetchLogs();
                // Show success toast (you can implement toast notification here)
                console.log('Retry successful');
            } else {
                throw new Error(data.message || 'Retry failed');
            }
        } catch (err) {
            console.error('Error retrying delivery:', err);
            throw err;
        } finally {
            setRetryingId(null);
        }
    };

    // Filter and search logs
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Event filter
            if (filters.event && filters.event !== 'all') {
                if (log.event !== filters.event) return false;
            }

            // Status filter
            if (filters.status && filters.status !== 'all') {
                if (filters.status === 'success' && !log.success) return false;
                if (filters.status === 'failed' && log.success) return false;
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                return (
                    log.event.toLowerCase().includes(searchLower) ||
                    log.statusCode.toString().includes(searchLower) ||
                    (log.deliveryId && log.deliveryId.toLowerCase().includes(searchLower))
                );
            }

            return true;
        });
    }, [logs, filters]);

    // Format timestamp
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    // Format duration
    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    // Get status badge
    const getStatusBadge = (log: WebhookDeliveryLog) => {
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                log.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            }`}>
                {log.statusCode} {log.success ? 'OK' : 'Failed'}
            </span>
        );
    };

    // Event type options
    const eventOptions = [
        { value: 'all', label: 'All Events' },
        { value: 'lead.created', label: 'Lead Created' },
        { value: 'lead.updated', label: 'Lead Updated' },
        { value: 'lead.deleted', label: 'Lead Deleted' },
        { value: 'lead.stage_changed', label: 'Stage Changed' },
        { value: 'lead.assigned', label: 'Lead Assigned' },
        { value: 'lead.received', label: 'Lead Received' }
    ];

    // Status options
    const statusOptions = [
        { value: 'all', label: 'All Results' },
        { value: 'success', label: 'Success' },
        { value: 'failed', label: 'Failed' }
    ];

    // Load logs when modal opens
    useEffect(() => {
        if (isOpen && webhookId) {
            console.log('Modal opened with webhookId:', webhookId);
            fetchLogs();
        }
    }, [isOpen, webhookId]);

    // Reset selected log when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedLog(null);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Delivery Logs - ${webhookName}`}>
            <div className="flex h-96">
                {/* Main logs list */}
                <div className={`${selectedLog ? 'w-2/3' : 'w-full'} flex flex-col`}>
                    {/* Filters */}
                    <div className="flex gap-4 mb-4 p-4 border-b border-muted">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-subtle mb-1">Event</label>
                            <select
                                value={filters.event || 'all'}
                                onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
                                className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-sm"
                            >
                                {eventOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-subtle mb-1">Result</label>
                            <select
                                value={filters.status || 'all'}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                                className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-sm"
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-subtle mb-1">Search</label>
                            <input
                                type="text"
                                value={filters.search || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                placeholder="Search events, status codes..."
                                className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-sm"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={fetchLogs}
                                disabled={loading}
                                className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                            >
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Logs table */}
                    <div className="flex-1 overflow-hidden">
                        {loading ? (
                            <div className="p-4">
                                {/* Loading skeleton */}
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="animate-pulse p-4 border-b border-muted">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                                                <div className="h-3 bg-muted rounded w-1/2"></div>
                                            </div>
                                            <div className="h-6 bg-muted rounded w-16"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center">
                                <AppIcons.XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                <p className="text-red-600 font-medium">{error}</p>
                                <button
                                    onClick={fetchLogs}
                                    className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="p-8 text-center">
                                <AppIcons.Activity className="h-12 w-12 text-muted mx-auto mb-4" />
                                <p className="text-subtle">No deliveries yet</p>
                                <p className="text-sm text-subtle mt-1">Webhook deliveries will appear here once events are triggered.</p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto">
                                <table className="min-w-full">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                                                Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                                                Event
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                                                Result
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-subtle uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background divide-y divide-muted">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-muted/50">
                                                <td className="px-4 py-3 text-sm text-subtle">
                                                    {formatTime(log.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-on-surface">
                                                    {eventOptions.find(e => e.value === log.event)?.label || log.event}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-subtle">
                                                    {log.statusCode}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-subtle">
                                                    {formatDuration(log.responseTimeMs)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(log)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                                    >
                                                        View details
                                                    </button>
                                                    {!log.success && (
                                                        <button
                                                            onClick={() => retryDelivery(log.deliveryId || log.id)}
                                                            disabled={retryingId === (log.deliveryId || log.id)}
                                                            className="ml-3 text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-50"
                                                        >
                                                            {retryingId === (log.deliveryId || log.id) ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                            ) : (
                                                                'Retry'
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail panel */}
                {selectedLog && (
                    <div className="w-1/3 border-l border-muted bg-surface p-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Delivery Details</h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-subtle hover:text-on-surface"
                            >
                                <AppIcons.Close className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Basic info */}
                            <div>
                                <label className="block text-sm font-medium text-subtle mb-1">Delivery ID</label>
                                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedLog.deliveryId || selectedLog.id}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-subtle mb-1">Event</label>
                                <p className="text-sm">{eventOptions.find(e => e.value === selectedLog.event)?.label || selectedLog.event}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-subtle mb-1">Status</label>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(selectedLog)}
                                    <span className="text-sm text-subtle">
                                        {formatDuration(selectedLog.responseTimeMs)}
                                    </span>
                                </div>
                            </div>

                            {/* Request headers */}
                            {selectedLog.requestHeaders && (
                                <div>
                                    <label className="block text-sm font-medium text-subtle mb-1">Request Headers</label>
                                    <div className="bg-muted p-3 rounded-md">
                                        {Object.entries(selectedLog.requestHeaders).map(([key, value]) => (
                                            <div key={key} className="text-xs font-mono mb-1">
                                                <span className="text-subtle">{key}:</span> {value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Request body */}
                            {selectedLog.requestBody && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-subtle">Request Body</label>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(selectedLog.requestBody!)}
                                            className="text-xs bg-muted hover:bg-subtle/80 text-on-surface font-bold py-1 px-2 rounded"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <textarea
                                        readOnly
                                        value={selectedLog.requestBody.length > 2000
                                            ? selectedLog.requestBody.substring(0, 2000) + '...'
                                            : selectedLog.requestBody
                                        }
                                        className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-sm font-mono h-32"
                                    />
                                </div>
                            )}

                            {/* Response body */}
                            {selectedLog.responseBody && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-subtle">Response Body</label>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(selectedLog.responseBody!)}
                                            className="text-xs bg-muted hover:bg-subtle/80 text-on-surface font-bold py-1 px-2 rounded"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <textarea
                                        readOnly
                                        value={selectedLog.responseBody.length > 2000
                                            ? selectedLog.responseBody.substring(0, 2000) + '...'
                                            : selectedLog.responseBody
                                        }
                                        className="w-full bg-surface border border-muted rounded-md py-2 px-3 text-sm font-mono h-32"
                                    />
                                </div>
                            )}

                            {/* Error message */}
                            {selectedLog.errorMessage && (
                                <div>
                                    <label className="block text-sm font-medium text-subtle mb-1">Error</label>
                                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                                        {selectedLog.errorMessage}
                                    </p>
                                </div>
                            )}

                            {/* Retry button for failed deliveries */}
                            {!selectedLog.success && (
                                <div className="pt-4 border-t border-muted">
                                    <button
                                        onClick={() => {
                                            retryDelivery(selectedLog.deliveryId || selectedLog.id);
                                            setSelectedLog(null);
                                        }}
                                        disabled={retryingId === (selectedLog.deliveryId || selectedLog.id)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
                                    >
                                        {retryingId === (selectedLog.deliveryId || selectedLog.id) && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        )}
                                        Retry now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-muted">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default WebhookLogsModal;


