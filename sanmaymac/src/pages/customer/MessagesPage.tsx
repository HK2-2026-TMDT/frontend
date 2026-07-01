import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { ChatInbox } from '../../components/chat/ChatInbox';
import { messageService } from '../../services/endpoints/messageService';

export const CustomerMessagesPage = () => {
  const [searchParams] = useSearchParams();
  const threadParam = searchParams.get('thread');
  const orderParam = searchParams.get('orderId');
  const [initialThreadId, setInitialThreadId] = useState<number | null>(
    threadParam ? Number(threadParam) : null,
  );

  useEffect(() => {
    if (threadParam) {
      setInitialThreadId(Number(threadParam));
      return;
    }
    if (!orderParam || Number.isNaN(Number(orderParam))) return;
    void messageService.getThreadByOrder(Number(orderParam)).then((res) => {
      const threadId = res.data.data?.thread?.id;
      if (threadId) setInitialThreadId(threadId);
    });
  }, [threadParam, orderParam]);

  return (
    <CustomerLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ChatInbox
          title="Tin nhắn"
          description="Trao đổi với xưởng may về đơn hàng của bạn."
          emptyHint="Chưa có hội thoại. Hội thoại được tạo khi bạn đặt đơn hàng."
          initialThreadId={initialThreadId && !Number.isNaN(initialThreadId) ? initialThreadId : null}
        />
      </div>
    </CustomerLayout>
  );
};
