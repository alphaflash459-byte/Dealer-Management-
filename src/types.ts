export type Role = 'Admin' | 'User';

export interface User {
  id: string;
  username: string;
  password?: string; // only for Admin to see/manage, usually we wouldn't store plaintext but this is local
  role: Role;
  createdAt: string;
}

export type TransactionType = 'Stock Out' | 'Stock Sold' | 'Stock Return';

export interface Product {
  id: string;
  name: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  productName: string;
  quantity: number;
  date: string;
  note?: string;
}

export interface StockOrder {
  id: string;
  userId: string;
  username: string;
  productName: string;
  quantity: number;
  date: string;
  note?: string;
  delivered: boolean;
  deliveredAt?: string;
  deliveredBy?: string;
}
