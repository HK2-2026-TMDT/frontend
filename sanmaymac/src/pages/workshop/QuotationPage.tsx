import React, { useState } from 'react';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';

export const WorkshopQuotationPage = () => {
  const [quoteSent, setQuoteSent] = useState(false);
  const [price, setPrice] = useState('');

  const tender = {
    id: 'TD-901',
    title: '5.000 áo thun đồng phục công ty - TechSolutions JSC',
    status: 'Đang mở',
    deadline: '2 ngày nữa',
    specs: [
      { label: 'Chất liệu', value: 'Cotton 100%, 4 chiều' },
      { label: 'Số lượng', value: '5.000 cái' },
      { label: 'Kích thước', value: 'S, M, L, XL, XXL' },
      { label: 'In ấn', value: 'In lụa 3 màu trước sau' },
      { label: 'Đóng gói', value: 'Túi PE riêng từng cái' },
    ],
    description: 'TechSolutions JSC cần đặt may 5.000 áo thun đồng phục cho nhân viên dịp teambuilding. Yêu cầu vải thoáng mát, không phai màu, đường may chắc chắn. Tiến độ cần gấp trong 15 ngày kể từ khi chốt mẫu.',
  };

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSent(true);
  };

  return (
    <WorkshopLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-secondary-fixed text-secondary text-[10px] font-bold rounded uppercase tracking-widest">{tender.id}</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-widest">{tender.status}</span>
            </div>
            <h1 className="font-headline-md text-on-surface text-3xl">{tender.title}</h1>
          </div>
          <div className="bg-surface-container-low px-6 py-3 rounded-2xl border border-outline-variant text-center min-w-[200px]">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Thời hạn còn lại</p>
            <p className="text-xl font-bold text-error">{tender.deadline}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TENDER DETAILS */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 space-y-6 shadow-sm">
              <h3 className="font-bold text-on-surface text-lg border-b border-outline-variant pb-4">Thông số yêu cầu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tender.specs.map(s => (
                  <div key={s.label}>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-sm font-medium text-on-surface">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-2">Mô tả chi tiết</p>
                <p className="text-sm text-on-surface leading-relaxed">{tender.description}</p>
              </div>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 space-y-6 shadow-sm">
              <h3 className="font-bold text-on-surface text-lg">Tài liệu đính kèm</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-square bg-surface-container-low rounded-xl border border-outline-variant flex items-center justify-center group cursor-pointer hover:border-secondary transition-all">
                    <span className="material-symbols-outlined text-outline group-hover:text-secondary text-3xl transition-colors">description</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* QUOTATION FORM */}
          <div className="space-y-6">
            {!quoteSent ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-xl sticky top-24">
                <h3 className="font-bold text-on-surface text-xl mb-6">Gửi báo giá của bạn</h3>
                <form onSubmit={handleSendQuote} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Đơn giá mỗi sản phẩm</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        required 
                        className="w-full pl-4 pr-12 h-14 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-lg focus:ring-2 focus:ring-secondary outline-none"
                        placeholder="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">VND</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ghi chú cho khách hàng</label>
                    <textarea className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none h-32 resize-none" placeholder="Mô tả chất liệu, cam kết chất lượng..."></textarea>
                  </div>
                  <div className="p-4 bg-secondary-fixed/10 border border-secondary/10 rounded-xl">
                    <div className="flex justify-between text-xs font-bold text-on-surface mb-2">
                      <span>Tổng giá trị:</span>
                      <span>{price ? (parseInt(price) * 5000).toLocaleString() : 0} đ</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant">
                      <span>Phí hệ thống (2%):</span>
                      <span>{price ? (parseInt(price) * 5000 * 0.02).toLocaleString() : 0} đ</span>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-secondary text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-secondary/20 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">send</span>
                    Gửi báo giá ngay
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center space-y-4 sticky top-24">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h3 className="font-bold text-green-900 text-xl">Báo giá đã được gửi!</h3>
                <p className="text-green-700 text-sm">Chúng tôi sẽ thông báo cho bạn khi khách hàng phản hồi.</p>
                <button 
                  onClick={() => setQuoteSent(false)}
                  className="w-full py-3 bg-white border border-green-200 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-all"
                >
                  Chỉnh sửa báo giá
                </button>
              </div>
            )}
            
            <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant">
              <h4 className="font-bold text-on-surface text-sm mb-4">Lưu ý cho đối tác</h4>
              <ul className="space-y-3">
                {[
                  'Báo giá đã bao gồm thuế VAT',
                  'Thời gian sản xuất tính từ ngày nhận cọc',
                  'Miễn phí vận chuyển trong bán kính 20km',
                ].map((note, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-secondary">info</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WorkshopLayout>
  );
};
