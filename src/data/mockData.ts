import { Dealer, Product, Order, ActivityLog } from '../types';

export const CAMBODIAN_PROVINCES = [
  { en: 'Phnom Penh', kh: 'ភ្នំពេញ' },
  { en: 'Siem Reap', kh: 'សៀមរាប' },
  { en: 'Battambang', kh: 'បាត់ដំបង' },
  { en: 'Preah Sihanouk', kh: 'ព្រះសីហនុ' },
  { en: 'Kampong Cham', kh: 'កំពង់ចាម' },
  { en: 'Kampot', kh: 'កំពត' },
  { en: 'Kandal', kh: 'កណ្តាល' },
  { en: 'Banteay Meanchey', kh: 'បន្ទាយមានជ័យ' },
  { en: 'Pursat', kh: 'ពោធិ៍សាត់' }
];

export const INITIAL_DEALERS: Dealer[] = [
  {
    id: 'DLR-001',
    name: 'Seng Ly',
    businessName: 'ដេប៉ូ សេង លី បោះដុំ (Seng Ly Wholesale)',
    phone: '012 345 678',
    email: 'sengly.wholesale@gmail.com',
    province: 'Phnom Penh',
    address: 'ផ្ទះលេខ ១២ ផ្លូវ ២៧១ សង្កាត់ទឹកល្អក់៣ ខណ្ឌទួលគោក',
    tier: 'Gold',
    status: 'Active',
    balance: 1450.00,
    creditLimit: 5000.00,
    joinDate: '2025-01-15',
    totalPurchased: 15420.00
  },
  {
    id: 'DLR-002',
    name: 'Dara Mini Mart',
    businessName: 'តារា ម៉ាត (Dara Mini Mart)',
    phone: '098 765 432',
    email: 'dara.mart@gmail.com',
    province: 'Siem Reap',
    address: 'ផ្លូវជាតិលេខ៦ សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប',
    tier: 'Silver',
    status: 'Active',
    balance: 450.00,
    creditLimit: 2500.00,
    joinDate: '2025-03-20',
    totalPurchased: 6800.00
  },
  {
    id: 'DLR-003',
    name: 'Kirirom Distribution',
    businessName: 'គិរីរម្យ ចែកចាយ (Kirirom Distribution)',
    phone: '085 222 111',
    email: 'contact@kirirom-dist.com',
    province: 'Preah Sihanouk',
    address: 'ផ្លូវឯករាជ្យ សង្កាត់លេខ៤ ក្រុងព្រះសីហនុ',
    tier: 'Gold',
    status: 'Active',
    balance: 2900.00,
    creditLimit: 7500.00,
    joinDate: '2024-11-10',
    totalPurchased: 24100.00
  },
  {
    id: 'DLR-004',
    name: 'Sopheap Grocery',
    businessName: 'សុភាព ចាប់ហួយ (Sopheap Grocery)',
    phone: '092 888 999',
    email: 'sopheap.battambang@yahoo.com',
    province: 'Battambang',
    address: 'ភូមិកម្មករ សង្កាត់ស្វាយប៉ោ ក្រុងបាត់ដំបង',
    tier: 'Bronze',
    status: 'Active',
    balance: 0.00,
    creditLimit: 1000.00,
    joinDate: '2025-05-02',
    totalPurchased: 2150.00
  },
  {
    id: 'DLR-005',
    name: 'Chantrea Store',
    businessName: 'ហាងលក់ទំនិញ ចន្ទ្រា (Chantrea Store)',
    phone: '077 444 555',
    email: 'chantrea.store@gmail.com',
    province: 'Kampong Cham',
    address: 'ភូមិទី១៥ សង្កាត់កំពង់ចាម ក្រុងកំពង់ចាម',
    tier: 'Silver',
    status: 'Active',
    balance: 850.00,
    creditLimit: 2500.00,
    joinDate: '2025-02-18',
    totalPurchased: 8900.00
  },
  {
    id: 'DLR-006',
    name: 'Vicheka Mart',
    businessName: 'វិច្ឆិកា លក់រាយ (Vicheka Mart)',
    phone: '010 999 888',
    email: 'vicheka.kandal@gmail.com',
    province: 'Kandal',
    address: 'ភូមិព្រែកសំរោង ក្រុងតាខ្មៅ ខេត្តកណ្តាល',
    tier: 'Bronze',
    status: 'Inactive',
    balance: 120.00,
    creditLimit: 1000.00,
    joinDate: '2025-04-11',
    totalPurchased: 1120.00
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    name: 'Coca-Cola (Original) Case',
    sku: 'COKE-CAN-01',
    category: 'Beverage',
    price: 12.50,
    stock: 250,
    minStock: 50,
    unit: 'Case (កេស)'
  },
  {
    id: 'PRD-002',
    name: 'Angkor Beer Cans Case',
    sku: 'ANGKOR-CAN-02',
    category: 'Alcoholic',
    price: 14.00,
    stock: 180,
    minStock: 40,
    unit: 'Case (កេស)'
  },
  {
    id: 'PRD-003',
    name: 'Vital Purified Water 500ml Case',
    sku: 'VITAL-500-03',
    category: 'Water',
    price: 3.50,
    stock: 400,
    minStock: 100,
    unit: 'Case (កេស)'
  },
  {
    id: 'PRD-004',
    name: 'Red Bull Energy Drink Tray',
    sku: 'REDBULL-CAN-04',
    category: 'Energy',
    price: 18.00,
    stock: 35,
    minStock: 45, // Trigger low stock
    unit: 'Tray (ថាស)'
  },
  {
    id: 'PRD-005',
    name: 'Premium Jasmine Rice 50kg',
    sku: 'RICE-JAS-05',
    category: 'Grain',
    price: 45.00,
    stock: 80,
    minStock: 20,
    unit: 'Bag (បាវ)'
  },
  {
    id: 'PRD-006',
    name: 'Healthy Cooking Oil 5L',
    sku: 'OIL-5L-06',
    category: 'Grocery',
    price: 6.80,
    stock: 15,
    minStock: 25, // Trigger low stock
    unit: 'Bottle (ដប)'
  },
  {
    id: 'PRD-007',
    name: 'Soy Sauce Premium Pack',
    sku: 'SOY-PREM-07',
    category: 'Grocery',
    price: 4.20,
    stock: 120,
    minStock: 30,
    unit: 'Pack (យួរ)'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    dealerId: 'DLR-001',
    dealerName: 'Seng Ly',
    items: [
      { productId: 'PRD-001', productName: 'Coca-Cola (Original) Case', quantity: 40, unitPrice: 12.50, total: 500.00 },
      { productId: 'PRD-003', productName: 'Vital Purified Water 500ml Case', quantity: 100, unitPrice: 3.50, total: 350.00 },
      { productId: 'PRD-005', productName: 'Premium Jasmine Rice 50kg', quantity: 10, unitPrice: 45.00, total: 450.00 }
    ],
    subtotal: 1300.00,
    discount: 130.00, // Gold 10%
    total: 1170.00,
    date: '2026-07-10',
    status: 'Delivered',
    paymentStatus: 'Paid',
    deliveryDate: '2026-07-11',
    note: 'ដឹកជញ្ជូនមុនម៉ោង ៤ រសៀល'
  },
  {
    id: 'ORD-1002',
    dealerId: 'DLR-003',
    dealerName: 'Kirirom Distribution',
    items: [
      { productId: 'PRD-002', productName: 'Angkor Beer Cans Case', quantity: 150, unitPrice: 14.00, total: 2100.00 },
      { productId: 'PRD-004', productName: 'Red Bull Energy Drink Tray', quantity: 50, unitPrice: 18.00, total: 900.00 }
    ],
    subtotal: 3000.00,
    discount: 300.00, // Gold 10%
    total: 2700.00,
    date: '2026-07-12',
    status: 'Approved',
    paymentStatus: 'Partial',
    note: 'ទូទាត់ខ្លះពេលទំនិញដល់'
  },
  {
    id: 'ORD-1003',
    dealerId: 'DLR-002',
    dealerName: 'Dara Mini Mart',
    items: [
      { productId: 'PRD-001', productName: 'Coca-Cola (Original) Case', quantity: 20, unitPrice: 12.50, total: 250.00 },
      { productId: 'PRD-003', productName: 'Vital Purified Water 500ml Case', quantity: 50, unitPrice: 3.50, total: 175.00 },
      { productId: 'PRD-006', productName: 'Healthy Cooking Oil 5L', quantity: 10, unitPrice: 6.80, total: 68.00 }
    ],
    subtotal: 493.00,
    discount: 24.65, // Silver 5%
    total: 468.35,
    date: '2026-07-13',
    status: 'Pending',
    paymentStatus: 'Unpaid'
  },
  {
    id: 'ORD-1004',
    dealerId: 'DLR-005',
    dealerName: 'Chantrea Store',
    items: [
      { productId: 'PRD-005', productName: 'Premium Jasmine Rice 50kg', quantity: 15, unitPrice: 45.00, total: 675.00 }
    ],
    subtotal: 675.00,
    discount: 33.75, // Silver 5%
    total: 641.25,
    date: '2026-07-08',
    status: 'Shipped',
    paymentStatus: 'Paid',
    deliveryDate: '2026-07-14'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-07-13T08:30:00-07:00',
    descriptionKh: 'បានបង្កើតការបញ្ជាទិញថ្មី ORD-1003 សម្រាប់ Dara Mini Mart',
    descriptionEn: 'Created new order ORD-1003 for Dara Mini Mart',
    type: 'order',
    amount: 468.35
  },
  {
    id: 'LOG-002',
    timestamp: '2026-07-12T15:45:00-07:00',
    descriptionKh: 'បានអនុម័តការបញ្ជាទិញ ORD-1002 សម្រាប់ Kirirom Distribution',
    descriptionEn: 'Approved order ORD-1002 for Kirirom Distribution',
    type: 'order',
    amount: 2700.00
  },
  {
    id: 'LOG-003',
    timestamp: '2026-07-12T10:00:00-07:00',
    descriptionKh: 'បានបន្ថែមតំណាងចែកចាយថ្មី៖ សុភាព ចាប់ហួយ នៅខេត្តបាត់ដំបង',
    descriptionEn: 'Added new dealer: Sopheap Grocery in Battambang',
    type: 'dealer'
  },
  {
    id: 'LOG-004',
    timestamp: '2026-07-11T16:20:00-07:00',
    descriptionKh: 'បានកែប្រែស្ថានភាពទំនិញ Coca-Cola: ស្តុកបច្ចុប្បន្ន ២៥០ កេស',
    descriptionEn: 'Updated product stock for Coca-Cola: current stock 250 cases',
    type: 'inventory'
  },
  {
    id: 'LOG-005',
    timestamp: '2026-07-10T11:30:00-07:00',
    descriptionKh: 'បានទទួលការទូទាត់ប្រាក់ $1,170.00 ពី Seng Ly សម្រាប់ការបញ្ជាទិញ ORD-1001',
    descriptionEn: 'Received payment of $1,170.00 from Seng Ly for order ORD-1001',
    type: 'billing',
    amount: 1170.00
  }
];
