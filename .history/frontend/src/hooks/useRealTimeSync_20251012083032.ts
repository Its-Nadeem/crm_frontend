import { useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

export interface RealTimeSyncOptions {
    organizationId: string;
    onCustomFieldsUpdate?: (fields: any[]) => void;
    onLeadsUpdate?: (leads: any[]) => void;
    onIntegrationUpdate?: (integration: any) => void;
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

    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);

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
                        // Handle field mapping updates
                        console.log('Field mapping updated:', data.mapping);
                    }
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }, [organizationId, onCustomFieldsUpdate, onLeadsUpdate, onIntegrationUpdate]);

    const handleError = useCallback((error: Event) => {
        console.error('WebSocket error:', error);

        // Implement exponential backoff for reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttemptsRef.current++;
                console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            }, delay);
        }
    }, []);

    const handleClose = useCallback((event: CloseEvent) => {
        console.log('WebSocket connection closed:', event.code, event.reason);

        // Auto-reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttemptsRef.current++;
                console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            }, delay);
        }
    }, []);

    const { sendMessage, isConnected, error: wsError } = useWebSocket({
        url: `${process.env.REACT_APP_WS_URL || 'ws://localhost:3000'}/sync`,
        onMessage: handleMessage,
        onError: handleError,
        onClose: handleClose,
        enabled
    });

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
        error: wsError,
        syncCustomFields,
        syncLeads,
        syncIntegrations,
        reconnectAttempts: reconnectAttemptsRef.current
    };
};


