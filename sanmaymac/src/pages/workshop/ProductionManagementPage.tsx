import { WorkshopOrderManagementPage } from './OrderManagementPage';

export const ProductionManagementPage = () => (
  <WorkshopOrderManagementPage
    defaultOrderType="READY_MADE"
    title="Đơn hàng mẫu sẵn"
    description="Danh sách đơn hàng sản phẩm có sẵn từ khách hàng."
  />
);

export const CustomOrderManagementPage = () => (
  <WorkshopOrderManagementPage
    defaultOrderType="CUSTOM"
    title="Đơn hàng gia công"
    description="Danh sách đơn may đo / gia công từ báo giá."
  />
);
