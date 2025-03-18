export interface GilmoursItem {
  id: string;
  purchaseDate: string;
  sku: string;
  brand: string;
  productDescription: string;
  packSize: string;
  uom: string;
  price: string;
  qty: string;
  accountName: string;
}

export interface BidfoodItem {
  id: string;
  productCode: string;
  brand: string;
  description: string;
  packSize: string;
  ctnQty: string;
  uom: string;
  qty: string;
  lastPricePaid: string;
  totalExGst: string;
  account: string;
  contains: string;
}

export interface OtherItem {
  id: string;
  sku: string;
  productName: string;
  supplier: string;
  pricePerUnit: number;
}

export interface StockSubItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
  source: 'gilmours' | 'bidfood' | 'other' | 'product-list';
  packSize: string;
  ctnQty: string;
  lastPrice: string;
}

export interface StockItem {
  id: string;
  name: string;
  totalCost: number;
  subItems: StockSubItem[];
} 