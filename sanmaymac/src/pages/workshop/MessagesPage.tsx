import { useSearchParams } from 'react-router-dom';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { ChatInbox } from '../../components/chat/ChatInbox';

export const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const threadParam = searchParams.get('thread');
  const initialThreadId = threadParam ? Number(threadParam) : null;

  return (
    <WorkshopLayout>
      <ChatInbox
        title="Tin nhắn"
        description="Trao đổi với khách hàng về đơn hàng và báo giá."
        emptyHint="Chưa có hội thoại. Hội thoại được tạo khi có đơn hàng mới."
        initialThreadId={initialThreadId && !Number.isNaN(initialThreadId) ? initialThreadId : null}
      />
    </WorkshopLayout>
  );
};
