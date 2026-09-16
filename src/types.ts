export type PurchaseType = 'Warehouse' | 'Online';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface CostcoItem {
  id: string; // unique item purchase instance id
  itemId: string; // Costco Item Number / SKU (e.g. "123456")
  rawName: string; // Name as printed on receipt or export
  productName?: string; // Enriched full product name from web search
  brand?: string; // e.g. "Kirkland Signature"
  category?: string; // e.g. "Grocery", "Household", "Electronics"
  description?: string; // What the item is
  packageDetails?: string; // e.g. "2L Bottle", "Pack of 30"
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  webSourceUrl?: string;
  isEnriched?: boolean;
  enriching?: boolean;
  isReturn?: boolean;
  // Purchase context
  orderId: string;
  orderNumber?: string;
  orderDate: string; // YYYY-MM-DD
  orderType: PurchaseType;
  warehouseLocation?: string;
  paymentCard?: string; // e.g. "Costco Anywhere Visa ****1234"
}

export interface CostcoReceipt {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderType: PurchaseType;
  warehouseLocation: string;
  paymentCard?: string;
  subtotal: number;
  tax: number;
  total: number;
  items: CostcoItem[];
  sourceType: 'image' | 'json' | 'csv' | 'sample';
  fileName?: string;
  uploadedAt: string;
  rawImagePreview?: string;
  notes?: string;
  isReturn?: boolean;
}

export interface FilterState {
  searchQuery: string;
  orderType: 'all' | 'Warehouse' | 'Online';
  category: string;
  sortBy: 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'item-asc';
  selectedCard: string;
  year: string;
}
