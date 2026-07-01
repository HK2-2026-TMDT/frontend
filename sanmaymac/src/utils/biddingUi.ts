export const POST_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  FULFILLED: 'Đã chọn xưởng',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Được chọn',
  REJECTED: 'Không được chọn / Đã rút',
};

export const quoteStatusClass = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
};
