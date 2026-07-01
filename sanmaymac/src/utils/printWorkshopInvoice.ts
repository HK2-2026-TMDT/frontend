import type { WorkshopOrderDetail } from '../services/endpoints/workshopService';
import { formatWorkshopCurrency, formatWorkshopDate, getOrderStatusLabel, getOrderTypeLabel } from './workshopUi';

export const printWorkshopOrderInvoice = (order: WorkshopOrderDetail) => {
  const itemsHtml = (order.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.productName ?? '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity ?? 0}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatWorkshopCurrency(item.unitPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatWorkshopCurrency(item.totalPrice)}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Hóa đơn DH-${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .muted { color: #666; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-size: 12px; text-transform: uppercase; }
    .totals { margin-top: 20px; width: 320px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>HÓA ĐƠN BÁN HÀNG</h1>
  <p class="muted">Mã đơn: DH-${order.id} · ${getOrderTypeLabel(order.orderType)} · ${getOrderStatusLabel(order.status)}</p>
  <p class="muted">Ngày: ${formatWorkshopDate(order.createdAt)}</p>

  <div style="display:flex;gap:40px;margin-top:24px">
    <div style="flex:1">
      <strong>Xưởng</strong><br/>
      ${order.workshopName ?? '—'}<br/>
      ${order.workshopAddress ?? ''}
    </div>
    <div style="flex:1">
      <strong>Khách hàng</strong><br/>
      ${order.customerName ?? '—'}<br/>
      ${order.customerPhone ?? ''}<br/>
      ${order.customerEmail ?? ''}
    </div>
  </div>

  <div style="margin-top:16px">
    <strong>Giao đến:</strong> ${order.receiverName ?? order.customerName ?? '—'}
    ${order.receiverPhone ? ` · ${order.receiverPhone}` : ''}<br/>
    ${order.shippingAddress ?? '—'}
  </div>

  <table>
    <thead>
      <tr>
        <th>Sản phẩm</th>
        <th style="text-align:center">SL</th>
        <th style="text-align:right">Đơn giá</th>
        <th style="text-align:right">Thành tiền</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="totals">
    <div><span>Phí vận chuyển</span><span>${formatWorkshopCurrency(order.shippingFee)}</span></div>
    <div><span>Giảm giá</span><span>-${formatWorkshopCurrency(order.discountAmount)}</span></div>
    <div class="grand"><span>Tổng cộng</span><span>${formatWorkshopCurrency(order.totalAmount)}</span></div>
  </div>

  ${order.customerNote ? `<p style="margin-top:24px"><strong>Ghi chú:</strong> ${order.customerNote}</p>` : ''}
  ${order.trackingCode ? `<p><strong>Mã vận đơn:</strong> ${order.trackingCode}</p>` : ''}

  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
};
