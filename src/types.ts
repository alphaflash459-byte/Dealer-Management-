export type DealerTier = 'Gold' | 'Silver' | 'Bronze';
export type DealerStatus = 'Active' | 'Inactive';
export type OrderStatus = 'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface Dealer {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  province: string;
  address: string;
  tier: DealerTier;
  status: DealerStatus;
  balance: number; // in USD
  creditLimit: number; // in USD
  joinDate: string;
  totalPurchased: number; // lifetime orders sum
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number; // in USD
  stock: number;
  minStock: number; // low stock alert threshold
  unit: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  dealerId: string;
  dealerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number; // tier-based or manual
  total: number;
  date: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryDate?: string;
  note?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  descriptionKh: string;
  descriptionEn: string;
  type: 'dealer' | 'order' | 'inventory' | 'billing';
  amount?: number;
}

export interface ProvinceStat {
  province: string;
  dealerCount: number;
  totalSales: number;
}
