import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout';
import { ChatInbox } from '../../components/chat/ChatInbox';

export const AdminMessagesPage = () => {
  const [searchParams] = useSearchParams();
  const threadParam = searchParams.get('thread');
  const initialThreadId = threadParam ? Number(threadParam) : null;

  return (
    <AdminLayout>
      <ChatInbox
        title="Giám sát tin nhắn"
        description="Theo dõi và hỗ trợ trao đổi giữa khách hàng và xưởng may."
        emptyHint="Chưa có hội thoại nào trong hệ thống."
        initialThreadId={initialThreadId && !Number.isNaN(initialThreadId) ? initialThreadId : null}
      />
    </AdminLayout>
  );
};
