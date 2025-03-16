export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  sku?: string;
};

export type Order = {
  id: string;
  shopifyId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  address?: string;
  status: OrderStatus;
  totalAmount: number;
  orderDate: string;
  deliveryTime?: string;
  travelTime?: number;
  isManualTravelTime?: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  driver?: Driver | null;
  driverId?: string | null;
  items: OrderItem[];
  isDispatched?: boolean;
  dispatchTime?: string;
  attributes?: {
    Phone?: string;
    [key: string]: string | undefined;
  };
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  notes?: string;
  product: Product;
};

export type Driver = {
  id: string;
  name: string;
  active: boolean;
};

export interface ProductList {
  id: string;
  addon: string;
  handle: string;
  totalCost: string | null;
  listOfIng: string | null;
  meat1: string | null;
  meat2: string | null;
  option1: string | null;
  option2: string | null;
  serveware: string | null;
  timerA: string | null;
  timerB: string | null;
  skuSearch: string | null;
  variantSku: string;
} 