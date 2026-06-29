import { useEffect, useMemo, useState } from 'react';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type WorkshopMessage, type WorkshopMessageThread } from '../../services/endpoints/workshopService';

const formatTime = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MessagesPage = () => {
  const [threads, setThreads] = useState<WorkshopMessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<WorkshopMessageThread | null>(null);
  const [messages, setMessages] = useState<WorkshopMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadThreads = async () => {
    setLoadingThreads(true);
    setError(null);

    try {
      const response = await workshopService.getWorkshopMessageThreads();
      const nextThreads = response.data.data ?? [];
      setThreads(nextThreads);
      setSelectedThread((current) => current ?? nextThreads[0] ?? null);
    } catch (loadError) {
      setThreads([]);
      setSelectedThread(null);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách hội thoại.');
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId?: number) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError(null);

    try {
      const response = await workshopService.getWorkshopThreadMessages(threadId);
      setMessages(response.data.data ?? []);
    } catch (loadError) {
      setMessages([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải nội dung hội thoại.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadThreads();
  }, []);

  useEffect(() => {
    void loadMessages(selectedThread?.id);
  }, [selectedThread?.id]);

  const threadSummary = useMemo(() => {
    if (!selectedThread) return 'Chọn một hội thoại để xem nội dung.';
    return selectedThread.subject ?? selectedThread.participantName ?? `Hội thoại #${selectedThread.id}`;
  }, [selectedThread]);

  const sendMessage = async () => {
    if (!selectedThread || !content.trim()) return;

    setSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await workshopService.sendWorkshopMessage(selectedThread.id, { content: content.trim() });
      setContent('');
      setSuccessMessage('Đã gửi tin nhắn.');
      await loadMessages(selectedThread.id);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <WorkshopPageHeader
          title="Tin nhắn"
          description="Trao đổi với khách hàng về đơn hàng và báo giá."
          actions={
            <button type="button" onClick={() => void loadThreads()} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container">
              <span className="material-symbols-outlined text-base">refresh</span>
              Tải lại
            </button>
          }
        />

        {error && <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}
        {successMessage && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
          <aside className="bg-surface-container-lowest border border-outline-variant rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-bold text-on-surface">Hội thoại</h2>
              <span className="text-xs text-on-surface-variant">{threads.length} cuộc</span>
            </div>
            <div className="max-h-[72vh] overflow-y-auto divide-y divide-outline-variant">
              {loadingThreads ? (
                <div className="p-6 text-center text-sm text-on-surface-variant">Đang tải hội thoại...</div>
              ) : threads.length ? (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full text-left p-4 transition-all ${selectedThread?.id === thread.id ? 'bg-secondary-fixed/20' : 'hover:bg-surface-container-low'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold overflow-hidden">
                        {thread.participantAvatarUrl ? <img src={thread.participantAvatarUrl} alt={thread.participantName ?? 'Avatar'} className="w-full h-full object-cover" /> : (thread.participantName ?? 'TH').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-on-surface truncate">{thread.participantName ?? thread.subject ?? `Hội thoại #${thread.id}`}</p>
                          {!!thread.unreadCount && thread.unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold">{thread.unreadCount}</span>}
                        </div>
                        <p className="text-xs text-on-surface-variant truncate mt-1">{thread.lastMessage ?? 'Chưa có tin nhắn'}</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">{formatTime(thread.lastMessageAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-on-surface-variant">Chưa có hội thoại nào.</div>
              )}
            </div>
          </aside>

          <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[72vh]">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-on-surface">{threadSummary}</h2>
                <p className="text-xs text-on-surface-variant">{selectedThread ? `Hội thoại #${selectedThread.id}` : 'Chưa chọn hội thoại'}</p>
              </div>
              {loadingMessages && <span className="text-xs font-bold text-secondary uppercase tracking-widest">Đang tải...</span>}
            </div>

            <div className="flex-1 p-5 space-y-4 bg-surface-container-low/30">
              {messages.length ? messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold overflow-hidden shrink-0">
                    {message.senderAvatarUrl ? <img src={message.senderAvatarUrl} alt={message.senderName ?? 'Avatar'} className="w-full h-full object-cover" /> : (message.senderName ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm text-on-surface">{message.senderName ?? 'Người gửi'}</p>
                      <span className="text-[10px] text-on-surface-variant">{formatTime(message.createdAt)}</span>
                    </div>
                    <div className="inline-block rounded-2xl bg-surface-container-lowest border border-outline-variant px-4 py-3 text-sm text-on-surface leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">{selectedThread ? 'Chưa có nội dung trong hội thoại này.' : 'Chọn một hội thoại ở bên trái để xem nội dung.'}</div>
              )}
            </div>

            <div className="p-5 border-t border-outline-variant bg-surface-container-lowest">
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Nhập nội dung tin nhắn..."
                  className="w-full h-28 px-4 py-3 bg-surface-container-low border border-outline-variant rounded-2xl text-sm outline-none focus:ring-2 focus:ring-secondary resize-none"
                  disabled={!selectedThread}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-on-surface-variant">{selectedThread ? 'Nhấn gửi để trả lời hội thoại hiện tại.' : 'Chưa có hội thoại được chọn.'}</p>
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={sending || !selectedThread || !content.trim()}
                    className="px-6 py-3 bg-secondary text-white rounded-xl font-bold text-sm disabled:opacity-50"
                  >
                    {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </WorkshopLayout>
  );
};
