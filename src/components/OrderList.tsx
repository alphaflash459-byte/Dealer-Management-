import React, { useState } from 'react';
import { Search, ShoppingBag, Plus, Filter, Calendar, FileText, CheckCircle2, Truck, Eye, RefreshCw, X, AlertCircle, Trash2 } from 'lucide-react';
import { Order, Dealer, Product, OrderStatus, PaymentStatus, OrderItem } from '../types';

interface OrderListProps {
  orders: Order[];
  dealers: Dealer[];
  products: Product[];
  onCreateOrder: (order: Omit<Order, 'id' | 'date'>) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  lang: 'kh' | 'en';
}

export default function OrderList({
  orders,
  dealers,
  products,
  onCreateOrder,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  lang
}: OrderListProps) {
  // State for search and filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Modal / Creator states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New Order Form states
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [tempProductId, setTempProductId] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);
  const [orderNote, setOrderNote] = useState('');
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [formError, setFormError] = useState<string | null>(null);

  // Conversions
  const RIEL_RATE = 4100;
  const formatCurrency = (usd: number) => {
    const usdFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
    const rielFormatted = new Intl.NumberFormat('kh-KH', { maximumFractionDigits: 0 }).format(usd * RIEL_RATE) + ' ៛';
    return { usd: usdFormatted, riel: rielFormatted };
  };

  // Find dealer by id
  const currentFormDealer = dealers.find(d => d.id === selectedDealerId);

  // Calculate discounts based on dealer tier
  const getTierDiscountPercent = (tier?: string) => {
    if (tier === 'Gold') return 0.10;
    if (tier === 'Silver') return 0.05;
    return 0.00;
  };

  // Build items array for summary
  const currentItemsDetails: OrderItem[] = orderItems.map(item => {
    const prod = products.find(p => p.id === item.productId);
    const price = prod ? prod.price : 0;
    const name = prod ? prod.name : 'Unknown';
    return {
      productId: item.productId,
      productName: name,
      quantity: item.quantity,
      unitPrice: price,
      total: price * item.quantity
    };
  });

  const formSubtotal = currentItemsDetails.reduce((sum, item) => sum + item.total, 0);
  const formDiscount = formSubtotal * getTierDiscountPercent(currentFormDealer?.tier);
  const formTotal = formSubtotal - formDiscount;

  // Add item to temporary list
  const handleAddItem = () => {
    if (!tempProductId) return;
    const prod = products.find(p => p.id === tempProductId);
    if (!prod) return;

    if (tempQuantity <= 0) {
      setFormError(lang === 'kh' ? 'បរិមាណត្រូវតែធំជាង ០' : 'Quantity must be greater than 0');
      return;
    }

    if (prod.stock < tempQuantity) {
      setFormError(lang === 'kh' 
        ? `ស្តុកមិនគ្រប់គ្រាន់ទេ៖ ស្តុកបច្ចុប្បន្នមានតែ ${prod.stock} ${prod.unit}`
        : `Insufficient warehouse stock: currently only ${prod.stock} ${prod.unit} available`);
      return;
    }

    // Check if item already added
    const existingIdx = orderItems.findIndex(i => i.productId === tempProductId);
    if (existingIdx > -1) {
      const updated = [...orderItems];
      const newQty = updated[existingIdx].quantity + tempQuantity;
      if (prod.stock < newQty) {
        setFormError(lang === 'kh' ? 'ស្តុកសរុបមិនគ្រប់គ្រាន់ទេ' : 'Cumulative quantity exceeds available stock');
        return;
      }
      updated[existingIdx].quantity = newQty;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { productId: tempProductId, quantity: tempQuantity }]);
    }

    setTempProductId('');
    setTempQuantity(1);
    setFormError(null);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  // Submit new order
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealerId) {
      setFormError(lang === 'kh' ? 'សូមជ្រើសរើសតំណាងចែកចាយ' : 'Please select a dealer');
      return;
    }
    if (orderItems.length === 0) {
      setFormError(lang === 'kh' ? 'សូមបន្ថែមទំនិញយ៉ាងហោចណាស់ ១' : 'Please add at least 1 product');
      return;
    }

    const dealer = dealers.find(d => d.id === selectedDealerId);
    if (!dealer) return;

    // Credit limit check
    if (orderPaymentStatus !== 'Paid' && (dealer.balance + formTotal) > dealer.creditLimit) {
      const isConfirm = window.confirm(lang === 'kh'
        ? `ប្រុងប្រយ័ត្ន៖ ការទិញនេះនឹងធ្វើឲ្យដេប៉ូនេះលើសកម្រិតឥណទានជំពាក់របស់ពួកគេ (ឥណទាននៅសល់៖ $${(dealer.creditLimit - dealer.balance).toFixed(2)})។ តើអ្នកចង់បន្តទេ?`
        : `Warning: This order will exceed the dealer's credit limit (available credit: $${(dealer.creditLimit - dealer.balance).toFixed(2)}). Do you wish to override and proceed?`);
      if (!isConfirm) return;
    }

    // Call creation
    onCreateOrder({
      dealerId: selectedDealerId,
      dealerName: dealer.name,
      items: currentItemsDetails,
      subtotal: formSubtotal,
      discount: formDiscount,
      total: formTotal,
      status: 'Pending',
      paymentStatus: orderPaymentStatus,
      note: orderNote
    });

    // Reset Form
    setSelectedDealerId('');
    setOrderItems([]);
    setOrderNote('');
    setOrderPaymentStatus('Unpaid');
    setFormError(null);
    setIsCreateOpen(false);
  };

  // Filters calculation
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.dealerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {lang === 'kh' ? 'គ្រប់គ្រងការបញ្ជាទិញ' : 'Wholesale Order Management'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {lang === 'kh' 
              ? 'ត្រួតពិនិត្យដំណើរការបញ្ជាទិញ អនុម័តដឹកជញ្ជូន តាមដានការបង់ប្រាក់ និងបង្កើតការទិញថ្មី។' 
              : 'Review dealer orders pipeline, approve shipping, track payments and log new invoices.'}
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'kh' ? 'បង្កើតការបញ្ជាទិញថ្មី' : 'Create New Order'}</span>
        </button>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'kh' ? 'ស្វែងរកលេខកូដវិក្កយបត្រ ឬឈ្មោះតំណាង...' : 'Search invoice ID or dealer name...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50/50"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-600"
          >
            <option value="all">{lang === 'kh' ? 'គ្រប់ស្ថានភាព (Statuses)' : 'All Order Statuses'}</option>
            <option value="Pending">Pending (រង់ចាំការពិនិត្យ)</option>
            <option value="Approved">Approved (បានអនុម័ត)</option>
            <option value="Shipped">Shipped (កំពុងដឹកជញ្ជូន)</option>
            <option value="Delivered">Delivered (បានប្រគល់ទំនិញ)</option>
            <option value="Cancelled">Cancelled (បានបោះបង់)</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-600"
          >
            <option value="all">{lang === 'kh' ? 'គ្រប់ស្ថានភាពបង់ប្រាក់' : 'All Payment Statuses'}</option>
            <option value="Paid">Paid (បានបង់សរុប)</option>
            <option value="Unpaid">Unpaid (មិនទាន់បង់)</option>
            <option value="Partial">Partial (បង់ខ្លះ)</option>
          </select>
        </div>
      </div>

      {/* Grid: Order history table & Receipt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4">{lang === 'kh' ? 'វិក្កយបត្រ' : 'Invoice'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'តំណាងចែកចាយ' : 'Dealer Name'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'សរុបប្រាក់' : 'Order Total'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'ស្ថានភាព' : 'Order Status'}</th>
                <th className="py-3.5 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-400 font-medium">
                    {lang === 'kh' ? 'រកមិនឃើញប្រវត្តិនៃការបញ្ជាទិញទេ' : 'No wholesale orders found.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id ? 'bg-indigo-50/40 border-l-4 border-indigo-500' : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-mono font-bold text-sm text-indigo-600">{order.id}</td>
                    <td className="py-4 px-4">
                      <span className="block font-semibold text-slate-800 text-sm leading-tight">{order.dealerName}</span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-500">{order.date}</td>
                    <td className="py-4 px-4">
                      <span className="block font-bold text-slate-800 text-sm">{formatCurrency(order.total).usd}</span>
                      <span className="block text-[10px] text-slate-400 font-medium">{formatCurrency(order.total).riel}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-600' :
                        order.status === 'Approved' ? 'bg-violet-50 text-violet-600' :
                        order.status === 'Cancelled' ? 'bg-slate-100 text-slate-400' :
                        'bg-amber-50 text-amber-600 animate-pulse'
                      }`}>
                        <span>{order.status}</span>
                      </span>
                      <span className={`block text-[10px] font-semibold mt-1 ${
                        order.paymentStatus === 'Paid' ? 'text-emerald-600' :
                        order.paymentStatus === 'Partial' ? 'text-amber-500' : 'text-rose-500'
                      }`}>{order.paymentStatus}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Order Detail Panel */}
        {selectedOrder && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{lang === 'kh' ? 'ព័ត៌មានវិក្កយបត្រ' : 'Invoice Slip'}</span>
                <h3 className="font-mono font-bold text-indigo-600 text-base mt-0.5">{selectedOrder.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General detail */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex justify-between">
                <span className="font-semibold">{lang === 'kh' ? 'តំណាងចែកចាយ៖' : 'Dealer:'}</span>
                <span className="font-bold text-slate-800">{selectedOrder.dealerName}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">{lang === 'kh' ? 'កាលបរិច្ឆេទ៖' : 'Order Date:'}</span>
                <span className="font-medium text-slate-800">{selectedOrder.date}</span>
              </p>
              {selectedOrder.note && (
                <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-500 italic mt-2">
                  Note: {selectedOrder.note}
                </div>
              )}
            </div>

            {/* List of items */}
            <div className="border-t border-b border-slate-50 py-3 space-y-2">
              <span className="block text-xs font-bold text-slate-700">{lang === 'kh' ? 'បញ្ជីទំនិញទិញ' : 'Line Items'}</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-50/50 pb-1.5">
                    <div className="max-w-[70%]">
                      <span className="font-medium text-slate-800 block line-clamp-1">{item.productName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.quantity} x ${item.unitPrice.toFixed(2)}</span>
                    </div>
                    <span className="font-bold text-slate-700">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receipts totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>{lang === 'kh' ? 'តម្លៃសរុបដើម៖' : 'Subtotal:'}</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>{lang === 'kh' ? 'ការបញ្ចុះតម្លៃតំណាង៖' : 'Tier Discount:'}</span>
                <span>-${selectedOrder.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-bold text-sm pt-1 border-t border-slate-50">
                <span>{lang === 'kh' ? 'តម្លៃទូទាត់សរុប៖' : 'Grand Total:'}</span>
                <div className="text-right">
                  <span className="block">${selectedOrder.total.toFixed(2)}</span>
                  <span className="block text-[10px] font-mono text-indigo-600 font-medium">{formatCurrency(selectedOrder.total).riel}</span>
                </div>
              </div>
            </div>

            {/* Receipts Actions (State Transition Controls) */}
            <div className="border-t border-slate-50 pt-4 space-y-3">
              {/* Order status updates */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">{lang === 'kh' ? 'ប្តូរស្ថានភាពការងារ' : 'Update Delivery Status'}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedOrder.status === 'Pending' && (
                    <button 
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Approved')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors"
                    >
                      {lang === 'kh' ? 'យល់ព្រមលក់' : 'Approve Order'}
                    </button>
                  )}
                  {selectedOrder.status === 'Approved' && (
                    <button 
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Shipped')}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors"
                    >
                      {lang === 'kh' ? 'ដឹកជញ្ជូន' : 'Ship Out'}
                    </button>
                  )}
                  {selectedOrder.status === 'Shipped' && (
                    <button 
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Delivered')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors"
                    >
                      {lang === 'kh' ? 'ប្រគល់ទំនិញរួច' : 'Mark Delivered'}
                    </button>
                  )}
                  
                  {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                    <button 
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Cancelled')}
                      className="border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold py-1.5 rounded-lg text-xs transition-colors"
                    >
                      {lang === 'kh' ? 'បោះបង់ចោល' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>

              {/* Payment updates */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">{lang === 'kh' ? 'ស្ថានភាពបង់លុយ' : 'Update Payment Status'}</label>
                <div className="flex space-x-1.5">
                  {['Unpaid', 'Partial', 'Paid'].map((pay) => (
                    <button
                      key={pay}
                      onClick={() => onUpdatePaymentStatus(selectedOrder.id, pay as PaymentStatus)}
                      className={`flex-1 text-[11px] font-bold py-1 rounded-lg transition-all border ${
                        selectedOrder.paymentStatus === pay
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pay}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE ORDER MODAL FORM */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative max-h-[90vh] flex flex-col justify-between">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 flex-none">
              <h3 className="text-lg font-bold text-slate-900">{lang === 'kh' ? 'បង្កើតការបញ្ជាទិញថ្មី' : 'Create New Wholesale Order'}</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {formError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-semibold flex items-center">
                  <AlertCircle className="w-4.5 h-4.5 mr-2" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Select Dealer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ជ្រើសរើសដេប៉ូ/តំណាងចែកចាយ' : 'Select Dealer'}</label>
                  <select
                    required value={selectedDealerId} onChange={(e) => {
                      setSelectedDealerId(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">{lang === 'kh' ? '-- ជ្រើសរើស --' : '-- Select Dealer --'}</option>
                    {dealers.filter(d => d.status === 'Active').map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.businessName})</option>
                    ))}
                  </select>
                </div>

                {currentFormDealer && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-700">
                      {lang === 'kh' ? `កម្រិត៖ ${currentFormDealer.tier} (បញ្ចុះតម្លៃ ${getTierDiscountPercent(currentFormDealer.tier) * 100}%)` : `Tier: ${currentFormDealer.tier} (${getTierDiscountPercent(currentFormDealer.tier) * 100}% Discount)`}
                    </p>
                    <p className="text-slate-500 mt-1">
                      {lang === 'kh' ? `សមតុល្យជំពាក់បច្ចុប្បន្ន៖ $${currentFormDealer.balance.toFixed(2)} / ឥណទានអតិបរមា៖ $${currentFormDealer.creditLimit}` : `Current Balance: $${currentFormDealer.balance.toFixed(2)} / Credit Limit: $${currentFormDealer.creditLimit}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2: Add Product Items */}
              <div className="border-t border-slate-50 pt-4">
                <span className="block text-xs font-bold text-slate-700 mb-2">{lang === 'kh' ? 'បញ្ចូលទំនិញ' : 'Add Products'}</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="sm:col-span-1.5">
                    <label className="block text-[11px] text-slate-500 mb-1">{lang === 'kh' ? 'ជ្រើសរើសមុខទំនិញ' : 'Select Product'}</label>
                    <select
                      value={tempProductId} onChange={(e) => {
                        setTempProductId(e.target.value);
                        setFormError(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">{lang === 'kh' ? '-- ជ្រើសរើសមុខទំនិញ --' : '-- Select Item --'}</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} (${p.price.toFixed(2)} / ស្តុក៖ {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{lang === 'kh' ? 'ចំនួន' : 'Quantity'}</label>
                    <input
                      type="number" min={1} value={tempQuantity} onChange={(e) => setTempQuantity(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="button" onClick={handleAddItem}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors h-9"
                  >
                    {lang === 'kh' ? 'បន្ថែមក្នុងបញ្ជី' : 'Add Item'}
                  </button>
                </div>
              </div>

              {/* Step 3: Current Basket / Items table */}
              {orderItems.length > 0 && (
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 p-2 font-bold text-slate-600 grid grid-cols-4 gap-2">
                    <span className="col-span-2">{lang === 'kh' ? 'ឈ្មោះទំនិញ' : 'Product Name'}</span>
                    <span className="text-center">{lang === 'kh' ? 'ចំនួន' : 'Qty'}</span>
                    <span className="text-right">{lang === 'kh' ? 'សរុប' : 'Total'}</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-36 overflow-y-auto">
                    {currentItemsDetails.map((item, idx) => (
                      <div key={idx} className="p-2 grid grid-cols-4 gap-2 items-center">
                        <span className="col-span-2 font-medium text-slate-800 line-clamp-1">{item.productName}</span>
                        <span className="text-center font-mono font-semibold">{item.quantity}</span>
                        <div className="text-right flex items-center justify-end space-x-2">
                          <span className="font-bold text-slate-700">${item.total.toFixed(2)}</span>
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note and Payment Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'លក្ខខណ្ឌបង់ប្រាក់' : 'Payment Status Option'}</label>
                  <select
                    value={orderPaymentStatus} onChange={(e) => setOrderPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Unpaid">Unpaid (ជំពាក់សិន / Credit Account)</option>
                    <option value="Paid">Paid (បានបង់សាច់ប្រាក់រួច)</option>
                    <option value="Partial">Partial (បង់កក់ខ្លះ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'កំណត់ចំណាំផ្សេងៗ' : 'Delivery/Order Notes'}</label>
                  <input
                    type="text" value={orderNote} onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="e.g. deliver next Tuesday"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Totals Panel */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/30 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>{lang === 'kh' ? 'តម្លៃដើមសរុប៖' : 'Subtotal:'}</span>
                  <span>${formSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-600">
                  <span>{lang === 'kh' ? 'ការបញ្ចុះតម្លៃតំណាងចែកចាយ៖' : 'Tier Discount Applied:'}</span>
                  <span>-${formDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-indigo-100/30">
                  <span>{lang === 'kh' ? 'តម្លៃទូទាត់សរុប៖' : 'Invoice Grand Total:'}</span>
                  <div className="text-right">
                    <span className="block">${formTotal.toFixed(2)}</span>
                    <span className="block text-xs font-semibold text-indigo-600">{formatCurrency(formTotal).riel}</span>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 flex-none">
              <button
                type="button" onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 font-medium text-xs rounded-lg hover:bg-slate-50"
              >
                {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button" onClick={handleFormSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg"
              >
                {lang === 'kh' ? 'ចុះឈ្មោះវិក្កយបត្រ' : 'Create Order Invoice'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
