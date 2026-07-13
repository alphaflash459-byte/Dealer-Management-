import React, { useState, useEffect } from 'react';
import { 
  INITIAL_DEALERS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_LOGS 
} from './data/mockData';
import { Dealer, Product, Order, ActivityLog, OrderStatus, PaymentStatus } from './types';

// Import components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DealerList from './components/DealerList';
import InventoryList from './components/InventoryList';
import OrderList from './components/OrderList';
import Analytics from './components/Analytics';
import AIConsultant from './components/AIConsultant';

export default function App() {
  // Localization & Navigation
  const [lang, setLang] = useState<'kh' | 'en'>('kh');
  const [view, setView] = useState<string>('dashboard');
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);

  // Core synchronized state loaded from localStorage (or defaults)
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Initial load
  useEffect(() => {
    const cachedDealers = localStorage.getItem('dms_dealers');
    const cachedProducts = localStorage.getItem('dms_products');
    const cachedOrders = localStorage.getItem('dms_orders');
    const cachedLogs = localStorage.getItem('dms_logs');

    if (cachedDealers) setDealers(JSON.parse(cachedDealers));
    else setDealers(INITIAL_DEALERS);

    if (cachedProducts) setProducts(JSON.parse(cachedProducts));
    else setProducts(INITIAL_PRODUCTS);

    if (cachedOrders) setOrders(JSON.parse(cachedOrders));
    else setOrders(INITIAL_ORDERS);

    if (cachedLogs) setLogs(JSON.parse(cachedLogs));
    else setLogs(INITIAL_LOGS);
  }, []);

  // Sync to localStorage whenever states update
  useEffect(() => {
    if (dealers.length > 0) localStorage.setItem('dms_dealers', JSON.stringify(dealers));
  }, [dealers]);

  useEffect(() => {
    if (products.length > 0) localStorage.setItem('dms_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (orders.length > 0) localStorage.setItem('dms_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (logs.length > 0) localStorage.setItem('dms_logs', JSON.stringify(logs));
  }, [logs]);

  // --- Handlers & Business Logic ---

  // Helper: Create a bilingual activity log
  const addActivityLog = (
    descKh: string, 
    descEn: string, 
    type: 'dealer' | 'order' | 'inventory' | 'billing',
    amount?: number
  ) => {
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      descriptionKh: descKh,
      descriptionEn: descEn,
      type,
      amount
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Add Dealer
  const handleAddDealer = (newDlr: Omit<Dealer, 'id' | 'joinDate' | 'totalPurchased' | 'balance'>) => {
    const nextId = `DLR-${String(dealers.length + 1).padStart(3, '0')}`;
    const fullDlr: Dealer = {
      ...newDlr,
      id: nextId,
      joinDate: new Date().toISOString().split('T')[0],
      totalPurchased: 0,
      balance: 0
    };

    setDealers(prev => [fullDlr, ...prev]);
    addActivityLog(
      `បានចុះឈ្មោះតំណាងចែកចាយថ្មី៖ ${fullDlr.name} (${fullDlr.businessName})`,
      `Registered new dealer account: ${fullDlr.name} (${fullDlr.businessName})`,
      'dealer'
    );
  };

  // Edit Dealer
  const handleEditDealer = (updatedDlr: Dealer) => {
    setDealers(prev => prev.map(d => d.id === updatedDlr.id ? updatedDlr : d));
    addActivityLog(
      `បានកែប្រែព័ត៌មានរបស់តំណាងចែកចាយ៖ ${updatedDlr.name}`,
      `Updated profile information for dealer: ${updatedDlr.name}`,
      'dealer'
    );
  };

  // Delete Dealer
  const handleDeleteDealer = (id: string) => {
    const target = dealers.find(d => d.id === id);
    if (!target) return;
    
    const isConfirm = window.confirm(lang === 'kh' 
      ? `តើអ្នកពិតជាចង់លុបដេប៉ូ ${target.name} មែនទេ?` 
      : `Are you sure you want to delete dealer ${target.name}?`);
    if (!isConfirm) return;

    setDealers(prev => prev.filter(d => d.id !== id));
    addActivityLog(
      `បានលុបតំណាងចែកចាយ៖ ${target.name}`,
      `Deleted dealer account: ${target.name}`,
      'dealer'
    );
    if (selectedDealerId === id) setSelectedDealerId(null);
  };

  // Restock Warehouse Product
  const handleRestockProduct = (productId: string, amount: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextStock = p.stock + amount;
        addActivityLog(
          `បានបញ្ចូលស្តុកបន្ថែម៖ +${amount} ${p.unit.split(' ')[0]} សម្រាប់ទំនិញ ${p.name}`,
          `Added intake supply: +${amount} ${p.unit.split(' ')[0]} for product ${p.name}`,
          'inventory'
        );
        return { ...p, stock: nextStock };
      }
      return p;
    }));
  };

  // Register New Product Catalog
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const nextId = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    const fullProd: Product = {
      ...newProd,
      id: nextId
    };

    setProducts(prev => [...prev, fullProd]);
    addActivityLog(
      `បានចុះឈ្មោះមុខទំនិញលក់ដុំថ្មី៖ ${fullProd.name} (SKU: ${fullProd.sku})`,
      `Registered new wholesale product SKU: ${fullProd.name} (SKU: ${fullProd.sku})`,
      'inventory'
    );
  };

  // Create New Wholesale Order (DMS core engine)
  const handleCreateOrder = (newOrderData: Omit<Order, 'id' | 'date'>) => {
    const nextOrderId = `ORD-${orders.length + 1001}`;
    const fullOrder: Order = {
      ...newOrderData,
      id: nextOrderId,
      date: new Date().toISOString().split('T')[0]
    };

    // 1. Deduct stock levels from warehouse inventory
    setProducts(prev => prev.map(p => {
      const orderedItem = fullOrder.items.find(item => item.productId === p.id);
      if (orderedItem) {
        return { ...p, stock: Math.max(p.stock - orderedItem.quantity, 0) };
      }
      return p;
    }));

    // 2. Adjust dealer's cumulative total Purchased and credit Balance
    setDealers(prev => prev.map(d => {
      if (d.id === fullOrder.dealerId) {
        let outstandingIncrease = 0;
        if (fullOrder.paymentStatus === 'Unpaid') {
          outstandingIncrease = fullOrder.total;
        } else if (fullOrder.paymentStatus === 'Partial') {
          outstandingIncrease = fullOrder.total * 0.5; // assume 50% unpaid
        }

        return {
          ...d,
          totalPurchased: d.totalPurchased + fullOrder.total,
          balance: d.balance + outstandingIncrease
        };
      }
      return d;
    }));

    // 3. Save order record
    setOrders(prev => [fullOrder, ...prev]);

    // 4. Log the action
    addActivityLog(
      `បានបង្កើតការបញ្ជាទិញថ្មី ${fullOrder.id} សម្រាប់ ${fullOrder.dealerName}`,
      `Placed new order ${fullOrder.id} for dealer ${fullOrder.dealerName}`,
      'order',
      fullOrder.total
    );
  };

  // Transition Order status
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Core transition logic
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: nextStatus };
      }
      return o;
    }));

    // If order was cancelled, we must reverse stock and credit balance increases!
    if (nextStatus === 'Cancelled') {
      // 1. Restore product stock levels
      setProducts(prev => prev.map(p => {
        const item = order.items.find(i => i.productId === p.id);
        if (item) return { ...p, stock: p.stock + item.quantity };
        return p;
      }));

      // 2. Reverse credit balance and purchased sums
      setDealers(prev => prev.map(d => {
        if (d.id === order.dealerId) {
          let outstandingReduction = 0;
          if (order.paymentStatus === 'Unpaid') {
            outstandingReduction = order.total;
          } else if (order.paymentStatus === 'Partial') {
            outstandingReduction = order.total * 0.5;
          }

          return {
            ...d,
            totalPurchased: Math.max(d.totalPurchased - order.total, 0),
            balance: Math.max(d.balance - outstandingReduction, 0)
          };
        }
        return d;
      }));

      addActivityLog(
        `បានបោះបង់ការបញ្ជាទិញ ${orderId} (បានបង្វិលស្តុក និងសមតុល្យឥណទានរួចរាល់)`,
        `Cancelled order ${orderId} (restored warehouse stock & credit balances)`,
        'order'
      );
    } else {
      addActivityLog(
        `បានកែប្រែស្ថានភាពការងារវិក្កយបត្រ ${orderId} ទៅជា "${nextStatus}"`,
        `Transitioned delivery status of invoice ${orderId} to "${nextStatus}"`,
        'order'
      );
    }
  };

  // Adjust payments on existing invoices
  const handleUpdatePaymentStatus = (orderId: string, nextPayment: PaymentStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (order.paymentStatus === nextPayment) return;

    // Calculate delta on outstanding balances
    // Previous balance contribution
    let prevContribution = 0;
    if (order.paymentStatus === 'Unpaid') prevContribution = order.total;
    else if (order.paymentStatus === 'Partial') prevContribution = order.total * 0.5;

    // Next balance contribution
    let nextContribution = 0;
    if (nextPayment === 'Unpaid') nextContribution = order.total;
    else if (nextPayment === 'Partial') nextContribution = order.total * 0.5;

    const balanceDelta = nextContribution - prevContribution;

    // Update order status
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: nextPayment } : o));

    // Update dealer balance
    setDealers(prev => prev.map(d => {
      if (d.id === order.dealerId) {
        return {
          ...d,
          balance: Math.max(d.balance + balanceDelta, 0)
        };
      }
      return d;
    }));

    addActivityLog(
      `បានកែប្រែការបង់ប្រាក់វិក្កយបត្រ ${orderId} ទៅជា "${nextPayment}" (សមតុល្យឥណទានត្រូវបានកែសម្រួល)`,
      `Updated payment state of invoice ${orderId} to "${nextPayment}" (adjusted dealer balance)`,
      'billing',
      order.total
    );
  };

  // Count active pending indicators for navigation badges
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Header */}
      <Header 
        currentView={view} 
        setView={setView} 
        lang={lang} 
        setLang={setLang}
        dealerCount={dealers.length}
        lowStockCount={lowStockCount}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'dashboard' && (
          <Dashboard 
            dealers={dealers} 
            products={products} 
            orders={orders} 
            logs={logs} 
            lang={lang} 
            setView={setView}
            setSelectedDealerId={setSelectedDealerId}
          />
        )}

        {view === 'dealers' && (
          <DealerList 
            dealers={dealers}
            orders={orders}
            onAddDealer={handleAddDealer}
            onEditDealer={handleEditDealer}
            onDeleteDealer={handleDeleteDealer}
            lang={lang}
            selectedDealerId={selectedDealerId}
            setSelectedDealerId={setSelectedDealerId}
          />
        )}

        {view === 'inventory' && (
          <InventoryList 
            products={products}
            onRestock={handleRestockProduct}
            onAddProduct={handleAddProduct}
            lang={lang}
          />
        )}

        {view === 'orders' && (
          <OrderList 
            orders={orders}
            dealers={dealers}
            products={products}
            onCreateOrder={handleCreateOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            lang={lang}
          />
        )}

        {view === 'analytics' && (
          <Analytics 
            dealers={dealers}
            orders={orders}
            products={products}
            lang={lang}
          />
        )}

        {view === 'ai-insights' && (
          <AIConsultant 
            dealers={dealers}
            products={products}
            orders={orders}
            lang={lang}
          />
        )}
      </main>

      {/* Corporate Humble Footer */}
      <footer className="bg-slate-950 text-slate-500 py-6 border-t border-slate-800 text-center text-xs font-mono select-none">
        <p>© 2026 DMS Cambodia Distribution System. All rights reserved.</p>
        <p className="text-[10px] text-slate-600 mt-1">PRISTINE DESIGN BOUND TO SECURE REGIONAL LOGISTICS PORTAL</p>
      </footer>
    </div>
  );
}
