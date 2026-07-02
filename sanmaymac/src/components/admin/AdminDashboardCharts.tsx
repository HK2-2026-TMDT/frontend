const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}₫`;



const formatCurrencyShort = (value: number) => {

  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;

  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;

  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;

  return String(Math.round(value));

};



export const formatPeriod = (value: string, groupBy?: string) => {

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



export interface TrendItem {

  period: string;

  totalOrders: number;

  totalRevenue: number;

}



const EmptyChart = ({ message, minHeight = '320px' }: { message: string; minHeight?: string }) => (
  <div
    className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-base text-slate-500"
    style={{ minHeight }}
  >
    {message}
  </div>
);



export const AdminRevenueLineChart = ({

  items,

  groupBy = 'month',

}: {

  items: TrendItem[];

  groupBy?: string;

}) => {

  if (!items.length) {

    return <EmptyChart message="Chưa có dữ liệu doanh thu." />;

  }



  const width = 960;

  const height = 360;

  const padding = { top: 48, right: 32, bottom: 48, left: 72 };

  const chartW = width - padding.left - padding.right;

  const chartH = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(...items.map((item) => Number(item.totalRevenue)), 1);



  const points = items.map((item, index) => {

    const x = padding.left + (items.length === 1 ? chartW / 2 : (index / (items.length - 1)) * chartW);

    const y = padding.top + chartH - (Number(item.totalRevenue) / maxRevenue) * chartH;

    return { x, y, item };

  });



  const linePath = points.map((point) => `${point.x},${point.y}`).join(' ');

  const areaPath = [

    `M ${points[0].x} ${padding.top + chartH}`,

    ...points.map((point) => `L ${point.x} ${point.y}`),

    `L ${points[points.length - 1].x} ${padding.top + chartH}`,

    'Z',

  ].join(' ');



  return (

    <div className="w-full">

      <svg viewBox={`0 0 ${width} ${height}`} className="min-h-[360px] w-full">

        <defs>

          <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">

            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />

            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />

          </linearGradient>

        </defs>



        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {

          const y = padding.top + chartH * (1 - ratio);

          const label = formatCurrencyShort(maxRevenue * ratio);

          return (

            <g key={ratio}>

              <line

                x1={padding.left}

                y1={y}

                x2={width - padding.right}

                y2={y}

                stroke="#e2e8f0"

                strokeWidth="1.5"

                strokeDasharray={ratio === 0 ? undefined : '6 6'}

              />

              <text x={padding.left - 12} y={y + 5} textAnchor="end" className="fill-slate-500 text-[13px] font-medium">

                {label}

              </text>

            </g>

          );

        })}



        <path d={areaPath} fill="url(#adminRevenueFill)" />

        <polyline

          fill="none"

          stroke="#4f46e5"

          strokeWidth="3.5"

          strokeLinejoin="round"

          strokeLinecap="round"

          points={linePath}

        />



        {points.map((point) => (

          <g key={point.item.period}>

            <circle cx={point.x} cy={point.y} r="8" fill="#fff" stroke="#4f46e5" strokeWidth="3" />

            <text

              x={point.x}

              y={point.y - 18}

              textAnchor="middle"

              className="fill-indigo-700 text-[12px] font-bold"

            >

              {formatCurrencyShort(Number(point.item.totalRevenue))}

            </text>

            <text

              x={point.x}

              y={height - 16}

              textAnchor="middle"

              className="fill-slate-600 text-[13px] font-semibold"

            >

              {formatPeriod(point.item.period, groupBy)}

            </text>

            <title>

              {formatPeriod(point.item.period, groupBy)}: {formatCurrency(Number(point.item.totalRevenue))}

            </title>

          </g>

        ))}

      </svg>

    </div>

  );

};



export const AdminOrdersBarChart = ({

  items,

  groupBy = 'month',

}: {

  items: TrendItem[];

  groupBy?: string;

}) => {

  if (!items.length) {

    return <EmptyChart message="Chưa có dữ liệu đơn hàng." />;

  }



  const maxOrders = Math.max(...items.map((item) => item.totalOrders), 1);

  const totalOrders = items.reduce((sum, item) => sum + item.totalOrders, 0);



  return (

    <div className="space-y-4">

      <div className="flex min-h-[320px] items-end gap-4 px-2">

        {items.map((item) => {

          const height = Math.max(8, Math.round((item.totalOrders / maxOrders) * 100));

          return (

            <div key={item.period} className="group flex min-w-0 flex-1 flex-col items-center gap-2">

              <span className="text-sm font-bold text-sky-700">{item.totalOrders}</span>

              <div className="relative flex h-64 w-full items-end justify-center">

                <div

                  className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-sky-700 to-sky-400 shadow-sm transition-all group-hover:from-sky-800 group-hover:to-sky-500"

                  style={{ height: `${height}%`, minHeight: item.totalOrders > 0 ? '16px' : '6px' }}

                  title={`${formatPeriod(item.period, groupBy)}: ${item.totalOrders} đơn`}

                />

              </div>

              <span className="text-sm font-semibold text-slate-600">{formatPeriod(item.period, groupBy)}</span>

            </div>

          );

        })}

      </div>

      <div className="flex justify-between border-t border-slate-200 pt-3 text-sm text-slate-500">

        <span>

          Tổng cộng: <strong className="text-slate-800">{totalOrders} đơn</strong>

        </span>

        <span>

          Cao nhất: <strong className="text-slate-800">{maxOrders} đơn/tháng</strong>

        </span>

      </div>

    </div>

  );

};



export interface WorkshopShareItem {

  workshopId: number;

  workshopName: string;

  revenue: number;

  orderCount: number;

}



const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];



export const AdminWorkshopPieChart = ({ items }: { items: WorkshopShareItem[] }) => {
  if (!items.length) {
    return <EmptyChart message="Chưa có dữ liệu doanh thu theo xưởng." minHeight="480px" />;
  }

  const total = items.reduce((sum, item) => sum + Number(item.revenue), 0) || 1;
  const cx = 220;
  const cy = 220;
  const outerR = 168;
  const innerR = 98;

  let cumulative = 0;
  const slices = items.map((item, index) => {
    const value = Number(item.revenue);
    const start = cumulative / total;
    cumulative += value;
    const end = cumulative / total;
    const pct = Math.round((value / total) * 100);
    const mid = (start + end) / 2;
    const angle = mid * 2 * Math.PI - Math.PI / 2;
    const labelR = (outerR + innerR) / 2;
    return {
      item,
      start,
      end,
      pct,
      color: PIE_COLORS[index % PIE_COLORS.length],
      labelX: cx + labelR * Math.cos(angle),
      labelY: cy + labelR * Math.sin(angle),
    };
  });

  const arcPath = (start: number, end: number, radius: number) => {
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = end * 2 * Math.PI - Math.PI / 2;
    const largeArc = end - start > 0.5 ? 1 : 0;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    if (end - start >= 0.999) {
      return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`;
    }
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex flex-col items-center gap-10 xl:flex-row xl:items-start xl:justify-center xl:gap-14">
      <div className="relative shrink-0">
        <svg viewBox="0 0 440 440" className="h-[min(440px,88vw)] w-[min(440px,88vw)]">
          {slices.map((slice) => (
            <path
              key={slice.item.workshopId}
              d={arcPath(slice.start, slice.end, outerR)}
              fill={slice.color}
              stroke="#fff"
              strokeWidth="4"
            >
              <title>
                {slice.item.workshopName}: {formatCurrency(Number(slice.item.revenue))} ({slice.pct}%)
              </title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
          {slices.map((slice) =>
            slice.pct >= 6 ? (
              <text
                key={`pct-${slice.item.workshopId}`}
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[15px] font-bold"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
              >
                {slice.pct}%
              </text>
            ) : null
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Tổng doanh thu</p>
          <p className="mt-2 text-2xl font-bold leading-tight text-slate-900">{formatCurrency(total)}</p>
          <p className="mt-1 text-sm text-slate-500">{items.length} xưởng</p>
        </div>
      </div>

      <div className="w-full max-w-3xl flex-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {slices.map((slice) => (
            <div
              key={slice.item.workshopId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40"
            >
              <div className="h-1.5" style={{ background: slice.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: slice.color }}
                    >
                      {slice.pct}%
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">{slice.item.workshopName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{slice.item.orderCount} đơn hàng</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xl font-bold text-slate-900">{formatCurrency(Number(slice.item.revenue))}</p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/80">
                  <div className="h-full rounded-full" style={{ width: `${slice.pct}%`, background: slice.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


