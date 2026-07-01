import { formatWorkshopCurrency } from '../../utils/workshopUi';

interface RevenueChartItem {
  date: string;
  revenue: number;
}

interface WorkshopRevenueChartProps {
  items: RevenueChartItem[];
  groupBy?: 'day' | 'month';
}

const formatLabel = (value: string, groupBy?: 'day' | 'month') => {
  if (!value) return '—';
  if (groupBy === 'month' && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-');
    return `T${month}/${year.slice(2)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [, month, day] = value.split('-');
    return `${day}/${month}`;
  }
  return value;
};

export const WorkshopRevenueChart = ({ items, groupBy = 'day' }: WorkshopRevenueChartProps) => {
  if (!items.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-outline-variant text-sm text-on-surface-variant">
        Chưa có dữ liệu doanh thu trong khoảng thời gian này.
      </div>
    );
  }

  const maxRevenue = Math.max(...items.map((item) => item.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-52 items-end gap-2 border-b border-outline-variant pb-2">
        {items.map((item) => {
          const height = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
          return (
            <div key={item.date} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="relative flex h-40 w-full max-w-[48px] items-end">
                <div
                  className="mx-auto w-full rounded-t-lg bg-secondary transition-all group-hover:bg-secondary/80"
                  style={{ height: `${height}%`, minHeight: item.revenue > 0 ? '12px' : '4px' }}
                  title={`${formatLabel(item.date, groupBy)}: ${formatWorkshopCurrency(item.revenue)}`}
                />
              </div>
              <span className="truncate text-[10px] text-on-surface-variant">
                {formatLabel(item.date, groupBy)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-on-surface-variant">
        <span>0₫</span>
        <span>Cao nhất: {formatWorkshopCurrency(maxRevenue)}</span>
      </div>
    </div>
  );
};
