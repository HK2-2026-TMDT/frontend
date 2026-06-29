export const formatWorkshopCurrency = (value?: number | null) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

export const formatWorkshopDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  DEPOSITED: 'Đã cọc',
  PRODUCING: 'Đang sản xuất',
  SHIPPED: 'Đã giao hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const getOrderStatusLabel = (status?: string) =>
  (status && ORDER_STATUS_LABELS[status]) || status || 'Không rõ';

export const getOrderStatusClass = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
    case 'SHIPPED':
      return 'bg-green-100 text-green-700';
    case 'PRODUCING':
      return 'bg-amber-100 text-amber-700';
    case 'DEPOSITED':
      return 'bg-blue-100 text-blue-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    case 'PENDING':
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
};

export const getOrderProgressPercent = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
    case 'SHIPPED':
      return 100;
    case 'PRODUCING':
      return 70;
    case 'DEPOSITED':
      return 40;
    case 'PENDING':
      return 15;
    case 'CANCELLED':
      return 0;
    default:
      return 10;
  }
};

export const getPayoutStatusLabel = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return 'Chờ duyệt';
    case 'APPROVED':
      return 'Đã duyệt';
    case 'REJECTED':
      return 'Từ chối';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status ?? '—';
  }
};

export const getTransactionTypeLabel = (type?: string) => {
  switch (type) {
    case 'ORDER_PAYMENT':
      return 'Thanh toán đơn hàng';
    case 'PAYOUT':
      return 'Rút tiền';
    case 'AI_TOKEN_PURCHASE':
      return 'Mua token AI';
    default:
      return type ?? 'Giao dịch';
  }
};
