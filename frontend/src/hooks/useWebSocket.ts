import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: 'activity:new' | 'activity:update' | 'activity:delete';
  data: any;
  leadId?: string;
}

export const useWebSocket = (leadId?: string) => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      try {
        // WebSocket endpoint doesn't exist on backend, so disable connection attempts
        // This prevents console errors and failed connection attempts
        console.log('WebSocket disabled - no backend endpoint available');
        return;
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
   }, [leadId]);

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
     // WebSocket not available, silently ignore
     console.warn('WebSocket is disabled - message not sent:', message);
   }, []);

   useEffect(() => {
     // WebSocket disabled - no connection attempts
     return () => {
       disconnect();
     };
   }, [disconnect]);

   return {
     isConnected: false, // Always return false since WebSocket is disabled
     sendMessage,
   };
};


