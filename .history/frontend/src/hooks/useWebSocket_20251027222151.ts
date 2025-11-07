import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: 'activity:new' | 'activity:update' | 'activity:delete';
  data: any;
  leadId?: string;
}

export const useWebSocket = (leadId?: string) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Use ws:// for development, wss:// for production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/rtc`;

      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          switch (message.type) {
            case 'activity:new':
              if (message.leadId === leadId || !message.leadId) {
                // Add new activity to the cache
                queryClient.setQueryData(
                  leadQueryKeys.activities(message.leadId || leadId!),
                  (old: any[] = []) => [message.data, ...old]
                );
              }
              break;

            case 'activity:update':
              if (message.leadId === leadId || !message.leadId) {
                // Update existing activity in the cache
                queryClient.setQueryData(
                  leadQueryKeys.activities(message.leadId || leadId!),
                  (old: any[] = []) =>
                    old.map((activity: any) =>
                      activity.id === message.data.id ? message.data : activity
                    )
                );
              }
              break;

            case 'activity:delete':
              if (message.leadId === leadId || !message.leadId) {
                // Remove activity from the cache
                queryClient.setQueryData(
                  leadQueryKeys.activities(message.leadId || leadId!),
                  (old: any[] = []) =>
                    old.filter((activity: any) => activity.id !== message.data.id)
                );
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);

        // Attempt to reconnect after 5 seconds (unless it was a clean close)
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 5000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [leadId, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    if (leadId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [leadId, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
  };
};


