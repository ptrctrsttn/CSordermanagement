export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  status: string;
  orderDate: string;
  deliveryTime: string | null;
  travelTime: number | null;
  isManualTravelTime?: boolean;
  driver: Driver | null;
  items: OrderItem[];
  phone: string | null;
  note?: string;
  dispatchTime?: string | null;
} 