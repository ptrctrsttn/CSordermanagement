export interface Driver {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    sku: string | null;
  };
}

export interface Order {
  id: string;
  _id?: string; // For MongoDB compatibility
  orderNumber: string;
  customerName: string;
  address: string;
  status: string;
  orderDate: string;
  deliveryTime: string | null;
  travelTime: number | null;
  driver: Driver | null;
  items: OrderItem[];
  phone: string | null;
  note?: string;
  createdAt?: string;
  dispatchTime: string | null;
  isDispatched?: boolean;
}

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