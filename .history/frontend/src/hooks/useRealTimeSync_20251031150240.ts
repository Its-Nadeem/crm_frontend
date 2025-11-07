import { useEffect, useRef, useCallback, useState } from 'react';

export interface RealTimeSyncOptions {
    organizationId: string;
    onCustomFieldsUpdate?: (fields: any[]) => void;
    onLeadsUpdate?: (leads: any[]) => void;
    onIntegrationUpdate?: (integration: any) => void;
    onUsersUpdate?: (users: any[]) => void;
    enabled?: boolean;
}

export const useRealTimeSync = (options: RealTimeSyncOptions) => {
    const {
        organizationId,
        onCustomFieldsUpdate,
        onLeadsUpdate,
        onIntegrationUpdate,
        enabled = true
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN || !enabled) return;

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/api/sync`;

            console.log('Connecting to RealTime sync WebSocket:', wsUrl);
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('RealTime sync WebSocket connected');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;

                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = undefined;
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('RealTime sync message:', data);

                    switch (data.type) {
                        case 'custom_fields_updated':
                            if (data.organizationId === organizationId && onCustomFieldsUpdate) {
                                onCustomFieldsUpdate(data.fields);
                            }
                            break;

                        case 'leads_updated':
                            if (data.organizationId === organizationId && onLeadsUpdate) {
                                onLeadsUpdate(data.leads);
                            }
                            break;

                        case 'integration_updated':
                            if (data.organizationId === organizationId && onIntegrationUpdate) {
                                onIntegrationUpdate(data.integration);
                            }
                            break;

                        case 'field_mapping_updated':
                            if (data.organizationId === organizationId) {
                                console.log('Field mapping updated:', data.mapping);
                            }
                            break;

                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('RealTime sync WebSocket closed:', event.code, event.reason);
                setIsConnected(false);

                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        console.log(`RealTime sync reconnect attempt (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
                        connect();
                    }, delay);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('RealTime sync WebSocket error:', error);
                setError('WebSocket connection error');
            };

        } catch (error) {
            console.error('Failed to create RealTime sync WebSocket:', error);
            setError('Failed to connect to sync server');
        }
    }, [organizationId, onCustomFieldsUpdate, onLeadsUpdate, onIntegrationUpdate, enabled]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Component unmounting');
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('RealTime sync WebSocket is not connected');
        }
    }, []);

    // Subscribe to organization updates
    useEffect(() => {
        if (isConnected && organizationId) {
            sendMessage({
                type: 'subscribe',
                organizationId,
                events: ['custom_fields', 'leads', 'integrations', 'field_mappings']
            });
        }
    }, [isConnected, organizationId, sendMessage]);

    // Reset reconnect attempts on successful connection
    useEffect(() => {
        if (isConnected) {
            reconnectAttemptsRef.current = 0;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        }
    }, [isConnected]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    const syncCustomFields = useCallback(async () => {
        if (isConnected) {
            sendMessage({
                type: 'sync_custom_fields',
                organizationId
            });
        }
    }, [isConnected, organizationId, sendMessage]);

    const syncLeads = useCallback(async () => {
        if (isConnected) {
            sendMessage({
                type: 'sync_leads',
                organizationId
            });
        }
    }, [isConnected, organizationId, sendMessage]);

    const syncIntegrations = useCallback(async () => {
        if (isConnected) {
            sendMessage({
                type: 'sync_integrations',
                organizationId
            });
        }
    }, [isConnected, organizationId, sendMessage]);

    return {
        isConnected,
        error,
        syncCustomFields,
        syncLeads,
        syncIntegrations,
        reconnectAttempts: reconnectAttemptsRef.current
    };
};


