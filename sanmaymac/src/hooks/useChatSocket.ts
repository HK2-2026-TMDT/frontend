import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, ChatThread } from '../services/endpoints/messageService';
import { getWebSocketUrl } from '../services/endpoints/messageService';

interface UseChatSocketOptions {
  activeThreadId?: number | null;
  currentUserId?: number;
  onMessage?: (message: ChatMessage) => void;
  onThreadUpdate?: (thread: ChatThread) => void;
}

export const useChatSocket = ({
  activeThreadId,
  currentUserId,
  onMessage,
  onThreadUpdate,
}: UseChatSocketOptions) => {
  const clientRef = useRef<import('@stomp/stompjs').Client | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  const onThreadUpdateRef = useRef(onThreadUpdate);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onThreadUpdateRef.current = onThreadUpdate;
  }, [onMessage, onThreadUpdate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    const connect = async () => {
      const [{ Client }, { default: SockJS }] = await Promise.all([
        import('@stomp/stompjs'),
        import('sockjs-client'),
      ]);

      if (cancelled) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(getWebSocketUrl()) as WebSocket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 4000,
        onConnect: () => setConnected(true),
        onDisconnect: () => setConnected(false),
        onStompError: () => setConnected(false),
      });

      client.activate();
      clientRef.current = client;
    };

    void connect();

    return () => {
      cancelled = true;
      clientRef.current?.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [currentUserId]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected || !activeThreadId) return;

    const subscription = client.subscribe(`/topic/chat.${activeThreadId}`, (frame) => {
      try {
        const payload = JSON.parse(frame.body) as ChatMessage;
        onMessageRef.current?.(payload);
      } catch {
        // ignore malformed payloads
      }
    });

    return () => subscription.unsubscribe();
  }, [activeThreadId, connected]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    const subscription = client.subscribe('/user/queue/thread-updates', (frame) => {
      try {
        const payload = JSON.parse(frame.body) as ChatThread;
        onThreadUpdateRef.current?.(payload);
      } catch {
        // ignore malformed payloads
      }
    });

    return () => subscription.unsubscribe();
  }, [connected, currentUserId]);

  const reconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current?.activate();
  }, []);

  return { connected, reconnect };
};
