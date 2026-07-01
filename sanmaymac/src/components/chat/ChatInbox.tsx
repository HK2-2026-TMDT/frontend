import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { messageService, type ChatMessage, type ChatThread } from '../../services/endpoints/messageService';
import { useChatSocket } from '../../hooks/useChatSocket';

const formatTime = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface ChatInboxProps {
  title: string;
  description: string;
  emptyHint?: string;
  initialThreadId?: number | null;
}

export const ChatInbox = ({
  title,
  description,
  emptyHint = 'Chưa có hội thoại nào.',
  initialThreadId = null,
}: ChatInboxProps) => {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    setError(null);
    try {
      const response = await messageService.getThreads();
      const nextThreads = response.data.data ?? [];
      setThreads(nextThreads);
      setSelectedThread((current) => {
        if (initialThreadId) {
          return nextThreads.find((t) => t.id === initialThreadId) ?? current;
        }
        return current ?? nextThreads[0] ?? null;
      });
    } catch (loadError) {
      setThreads([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải hội thoại.');
    } finally {
      setLoadingThreads(false);
    }
  }, [initialThreadId]);

  const loadMessages = useCallback(async (threadId?: number) => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    setError(null);
    try {
      const response = await messageService.getThread(threadId);
      const detail = response.data.data;
      setMessages(detail?.messages ?? []);
      if (detail?.thread) {
        setSelectedThread(detail.thread);
      }
    } catch (loadError) {
      setMessages([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải tin nhắn.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleIncomingMessage = useCallback(
    (message: ChatMessage) => {
      if (message.threadId && message.threadId !== selectedThread?.id) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    },
    [selectedThread?.id],
  );

  const handleThreadUpdate = useCallback((thread: ChatThread) => {
    setThreads((prev) => {
      const exists = prev.some((item) => item.id === thread.id);
      const next = exists
        ? prev.map((item) => (item.id === thread.id ? { ...item, ...thread } : item))
        : [thread, ...prev];
      return [...next].sort(
        (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
      );
    });
  }, []);

  const { connected } = useChatSocket({
    activeThreadId: selectedThread?.id,
    currentUserId: user?.id ? Number(user.id) : undefined,
    onMessage: handleIncomingMessage,
    onThreadUpdate: handleThreadUpdate,
  });

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (initialThreadId && threads.length) {
      const match = threads.find((t) => t.id === initialThreadId);
      if (match) setSelectedThread(match);
    }
  }, [initialThreadId, threads]);

  useEffect(() => {
    void loadMessages(selectedThread?.id);
  }, [selectedThread?.id, loadMessages]);

  const sendMessage = async () => {
    if (!selectedThread || !content.trim()) return;
    setSending(true);
    setError(null);
    try {
      const response = await messageService.sendMessage(selectedThread.id, content.trim());
      const detail = response.data.data;
      setContent('');
      setMessages(detail?.messages ?? []);
      if (detail?.thread) {
        handleThreadUpdate(detail.thread);
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const threadTitle =
    selectedThread?.participantName ??
    selectedThread?.subject ??
    (selectedThread ? `Hội thoại #${selectedThread.id}` : 'Chọn hội thoại');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              connected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-600' : 'bg-amber-500'}`} />
            {connected ? 'Realtime' : 'Đang kết nối…'}
          </span>
          <button
            type="button"
            onClick={() => void loadThreads()}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Tải lại
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant p-4">
            <h2 className="font-bold text-on-surface">Hội thoại</h2>
            <span className="text-xs text-on-surface-variant">{threads.length} cuộc</span>
          </div>
          <div className="max-h-[72vh] divide-y divide-outline-variant overflow-y-auto">
            {loadingThreads ? (
              <div className="p-6 text-center text-sm text-on-surface-variant">Đang tải…</div>
            ) : threads.length ? (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-4 text-left transition-all ${
                    selectedThread?.id === thread.id ? 'bg-secondary/10' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary/15 font-bold text-secondary">
                      {thread.participantAvatarUrl ? (
                        <img src={thread.participantAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (thread.participantName ?? 'TH').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-on-surface">
                        {thread.participantName ?? thread.subject ?? `#${thread.id}`}
                      </p>
                      {thread.orderId ? (
                        <p className="text-[10px] text-on-surface-variant">Đơn #{thread.orderId}</p>
                      ) : null}
                      <p className="mt-1 truncate text-xs text-on-surface-variant">
                        {thread.lastMessage ?? 'Chưa có tin nhắn'}
                      </p>
                      <p className="mt-1 text-[10px] text-on-surface-variant">{formatTime(thread.lastMessageAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-on-surface-variant">{emptyHint}</div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant p-5">
            <div>
              <h2 className="font-bold text-on-surface">{threadTitle}</h2>
              <p className="text-xs text-on-surface-variant">
                {selectedThread?.orderId
                  ? `Đơn hàng #${selectedThread.orderId}`
                  : selectedThread
                    ? `Hội thoại #${selectedThread.id}`
                    : 'Chưa chọn hội thoại'}
              </p>
            </div>
            {loadingMessages ? (
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Đang tải…</span>
            ) : null}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-surface-container-low/30 p-5">
            {messages.length ? (
              messages.map((message) => {
                const isMine = user?.id != null && message.senderId === Number(user.id);
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[80%] gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/15 font-bold text-secondary">
                        {message.senderAvatarUrl ? (
                          <img src={message.senderAvatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (message.senderName ?? 'U').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className={`mb-1 flex items-center gap-2 ${isMine ? 'justify-end' : ''}`}>
                          <p className="text-sm font-bold text-on-surface">{message.senderName ?? 'Người gửi'}</p>
                          {message.senderRole === 'ADMIN' ? (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Admin
                            </span>
                          ) : null}
                          <span className="text-[10px] text-on-surface-variant">{formatTime(message.createdAt)}</span>
                        </div>
                        <div
                          className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                            isMine
                              ? 'border-secondary/20 bg-secondary text-white'
                              : 'border-outline-variant bg-surface text-on-surface'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                {selectedThread ? 'Chưa có tin nhắn trong hội thoại này.' : 'Chọn hội thoại bên trái.'}
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant bg-surface-container-lowest p-5">
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Nhập tin nhắn… (Enter để gửi)"
                className="h-24 w-full resize-none rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
                disabled={!selectedThread}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  {selectedThread ? 'Tin nhắn được đồng bộ realtime qua WebSocket.' : 'Chưa chọn hội thoại.'}
                </p>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending || !selectedThread || !content.trim()}
                  className="rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {sending ? 'Đang gửi…' : 'Gửi'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
