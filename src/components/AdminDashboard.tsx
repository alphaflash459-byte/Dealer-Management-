import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User, Transaction, Product, StockOrder, PromotionTier } from '../types';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function cleanUndefined<T extends object>(obj: T): T {
  const newObj = { ...obj } as any;
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
}

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: Transaction[];
  products: Product[];
  stockOrders: StockOrder[];
  activeTab: 'users' | 'products' | 'transactions' | 'stockOrders';
}

export default function AdminDashboard({ users, setUsers, transactions, products, stockOrders, activeTab }: AdminDashboardProps) {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductPromoBuy, setNewProductPromoBuy] = useState('');
  const [newProductPromoGet, setNewProductPromoGet] = useState('');
  const [newProductPromotions, setNewProductPromotions] = useState<PromotionTier[]>([]);

  // Product Edit States
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductPromoBuy, setEditProductPromoBuy] = useState('');
  const [editProductPromoGet, setEditProductPromoGet] = useState('');
  const [editProductPromotions, setEditProductPromotions] = useState<PromotionTier[]>([]);

  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<Transaction | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editQuantity, setEditQuantity] = useState('');
  const [editNote, setEditNote] = useState('');

  // Stock Order Admin States
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [orderUserId, setOrderUserId] = useState('admin');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderLocation, setOrderLocation] = useState('');
  interface StockItemInput {
    productName: string;
    quantity: string;
  }
  const [orderItems, setOrderItems] = useState<StockItemInput[]>([{ productName: '', quantity: '' }]);
  const [selectedOrderUser, setSelectedOrderUser] = useState<string>('all');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<'all' | 'pending' | 'delivered'>('all');

  // Edit / Delete stock order states
  const [orderToDelete, setOrderToDelete] = useState<StockOrder | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<StockOrder | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<StockOrder | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editOrderUserId, setEditOrderUserId] = useState('');
  const [editOrderProductName, setEditOrderProductName] = useState('');
  const [editOrderQuantity, setEditOrderQuantity] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editOrderCustomerName, setEditOrderCustomerName] = useState('');
  const [editOrderLocation, setEditOrderLocation] = useState('');
  const [editOrderDelivered, setEditOrderDelivered] = useState(false);

  const getOrderCustomerAndLocation = (noteStr: string) => {
    const match = (noteStr || '').match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { customer: match[1].trim(), location: match[2].trim() };
    }
    return { customer: noteStr || '', location: '' };
  };

  const addOrderItemRow = () => {
    setOrderItems(prev => [...prev, { productName: '', quantity: '' }]);
  };

  const removeOrderItemRow = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateOrderItemRow = (index: number, field: keyof StockItemInput, value: string) => {
    setOrderItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAdminCreateStockOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUserObj = users.find(u => u.id === orderUserId) || { id: 'admin', username: 'Admin' };

    const validItems = orderItems.filter(item => item.productName || item.quantity);
    if (validItems.length === 0) {
      alert("សូមជ្រើសរើសទំនិញយ៉ាងហោចណាស់មួយ និងបញ្ចូលចំនួន");
      return;
    }

    // Validate
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      if (!item.productName) {
        alert(`សូមជ្រើសរើសឈ្មោះទំនិញនៅជួរទី ${i + 1}`);
        return;
      }
      if (!item.quantity) {
        alert(`សូមបំពេញចំនួនទំនិញនៅជួរទី ${i + 1}`);
        return;
      }
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        alert(`ចំនួនសម្រាប់ទំនិញ "${item.productName}" ត្រូវតែជាលេខវិជ្ជមាន!`);
        return;
      }
    }

    setLoading(true);
    try {
      const formattedNote = orderCustomerName && orderLocation ? `${orderCustomerName} (${orderLocation})` : orderCustomerName || orderLocation || '';
      await Promise.all(validItems.map(async (item, index) => {
        const qty = parseInt(item.quantity);
        const newOrder: StockOrder = {
          id: `order-${Date.now()}-${index}`,
          userId: selectedUserObj.id,
          username: selectedUserObj.username,
          productName: item.productName,
          quantity: qty,
          date: orderDate,
          note: formattedNote,
          delivered: false
        };

        await setDoc(doc(db, 'stock_orders', newOrder.id), newOrder);
      }));

      setIsCreateOrderModalOpen(false);
      setOrderItems([{ productName: '', quantity: '' }]);
      setOrderCustomerName('');
      setOrderLocation('');
      setOrderUserId('admin');
    } catch (error) {
      console.error("Error creating stock order: ", error);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminConfirmDelivery = async (orderId: string) => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'stock_orders', orderId), {
        delivered: true,
        deliveredAt: new Date().toISOString(),
        deliveredBy: 'Admin'
      }, { merge: true });
      setSelectedOrderDetail(null);
    } catch (error) {
      console.error("Error confirming delivery: ", error);
      alert("មានបញ្ហាក្នុងការធ្វើបច្ចុប្បន្នភាពទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUnconfirmDelivery = async (orderId: string) => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'stock_orders', orderId), {
        delivered: false,
        deliveredAt: null,
        deliveredBy: null
      }, { merge: true });
      setSelectedOrderDetail(null);
    } catch (error) {
      console.error("Error marking order as pending: ", error);
      alert("មានបញ្ហាក្នុងការធ្វើបច្ចុប្បន្នភាពទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDeleteOrder = async (orderId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'stock_orders', orderId));
      setOrderToDelete(null);
      setSelectedOrderDetail(null);
    } catch (error) {
      console.error("Error deleting stock order: ", error);
      alert("មានបញ្ហាក្នុងការលុបទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orderToEdit || selectedOrderDetail;
    if (!targetOrder) return;

    if (!editOrderUserId) {
      alert("សូមជ្រើសរើសអ្នកប្រើប្រាស់");
      return;
    }
    const selectedUserObj = users.find(u => u.id === editOrderUserId);
    if (!selectedUserObj) {
      alert("រកមិនឃើញអ្នកប្រើប្រាស់នេះទេ");
      return;
    }

    if (!editOrderProductName) {
      alert("សូមជ្រើសរើសទំនិញ");
      return;
    }

    const qty = parseInt(editOrderQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("ចំនួនទំនិញត្រូវតែជាលេខវិជ្ជមាន!");
      return;
    }

    setLoading(true);
    try {
      const formattedNote = editOrderCustomerName && editOrderLocation ? `${editOrderCustomerName} (${editOrderLocation})` : editOrderCustomerName || editOrderLocation || '';
      const updatedOrder: Partial<StockOrder> = {
        userId: selectedUserObj.id,
        username: selectedUserObj.username,
        productName: editOrderProductName,
        quantity: qty,
        date: editOrderDate,
        note: formattedNote,
        delivered: editOrderDelivered
      };
      if (editOrderDelivered) {
        updatedOrder.deliveredAt = targetOrder.deliveredAt || new Date().toISOString();
        updatedOrder.deliveredBy = targetOrder.deliveredBy || 'Admin';
      } else {
        updatedOrder.deliveredAt = null;
        updatedOrder.deliveredBy = null;
      }

      await setDoc(doc(db, 'stock_orders', targetOrder.id), cleanUndefined(updatedOrder), { merge: true });
      
      setOrderToEdit(null);
      setSelectedOrderDetail(null);
      setIsEditingOrder(false);
    } catch (error) {
      console.error("Error updating order: ", error);
      alert("មានបញ្ហាក្នុងការកែប្រែទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent, totalPagesCount: number, activePageNum: number, onPageChange: (p: number) => void) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 40) { // threshold of 40px
        if (diffX > 0) {
          // Swipe Right -> Go to Prev Page
          if (activePageNum > 1) {
            onPageChange(activePageNum - 1);
          }
        } else {
          // Swipe Left -> Go to Next Page
          if (activePageNum < totalPagesCount) {
            onPageChange(activePageNum + 1);
          }
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const observerRef = useRef<ResizeObserver | null>(null);
  const tableContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (node) {
      observerRef.current = new ResizeObserver(entries => {
        for (let entry of entries) {
          const height = entry.contentRect.height;
          const isMobile = window.innerWidth < 768;
          let rows = Math.floor((height - 40) / (isMobile ? 95 : 50));
          if (isMobile) {
            if (rows < 1) rows = 1;
            if (rows > 4) rows = 4;
          } else {
            if (rows < 3) rows = 3;
            if (rows > 50) rows = 50;
          }
          setPageSize(prev => (prev !== rows ? rows : prev));
        }
      });
      observerRef.current.observe(node);
    }
  }, []);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.username === newUsername)) {
      alert('ឈ្មោះនេះមានរួចហើយ!');
      return;
    }
    
    setLoading(true);
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: newUsername,
      password: newPassword,
      role: 'User',
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
      setNewUsername('');
      setNewPassword('');
      setIsCreateUserModalOpen(false);
    } catch (error) {
      console.error("Error adding user: ", error);
      alert('មានបញ្ហាក្នុងការបង្កើតអ្នកប្រើប្រាស់');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user: ", error);
      alert('មានបញ្ហាក្នុងការលុបអ្នកប្រើប្រាស់');
    } finally {
      setLoading(false);
    }
  };

  const addCreatePromoRow = () => {
    setNewProductPromotions([...newProductPromotions, { buyQty: 0, getQty: 0 }]);
  };

  const updateCreatePromoRow = (index: number, field: 'buyQty' | 'getQty', value: string) => {
    const updated = [...newProductPromotions];
    updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    setNewProductPromotions(updated);
  };

  const removeCreatePromoRow = (index: number) => {
    setNewProductPromotions(newProductPromotions.filter((_, i) => i !== index));
  };

  const addEditPromoRow = () => {
    setEditProductPromotions([...editProductPromotions, { buyQty: 0, getQty: 0 }]);
  };

  const updateEditPromoRow = (index: number, field: 'buyQty' | 'getQty', value: string) => {
    const updated = [...editProductPromotions];
    updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    setEditProductPromotions(updated);
  };

  const removeEditPromoRow = (index: number) => {
    setEditProductPromotions(editProductPromotions.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    
    if (products.find(p => p.name.toLowerCase() === newProductName.trim().toLowerCase())) {
      alert('ឈ្មោះទំនិញនេះមានរួចហើយ!');
      return;
    }
    
    setLoading(true);
    const cleanPromos = newProductPromotions
      .map(p => ({ buyQty: Number(p.buyQty) || 0, getQty: Number(p.getQty) || 0 }))
      .filter(p => p.buyQty > 0 && p.getQty > 0);

    const firstPromo = cleanPromos[0];

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProductName.trim(),
      price: newProductPrice ? Number(newProductPrice) : undefined,
      promoBuyQty: firstPromo ? firstPromo.buyQty : (newProductPromoBuy ? Number(newProductPromoBuy) : undefined),
      promoGetQty: firstPromo ? firstPromo.getQty : (newProductPromoGet ? Number(newProductPromoGet) : undefined),
      promotions: cleanPromos.length > 0 ? cleanPromos : undefined,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'products', newProduct.id), cleanUndefined(newProduct));
      setNewProductName('');
      setNewProductPrice('');
      setNewProductPromoBuy('');
      setNewProductPromoGet('');
      setNewProductPromotions([]);
      setIsCreateProductModalOpen(false);
    } catch (error) {
      console.error("Error adding product: ", error);
      alert('មានបញ្ហាក្នុងការបង្កើតទំនិញ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit) return;
    if (!editProductName.trim()) return;
    
    setLoading(true);
    const cleanPromos = editProductPromotions
      .map(p => ({ buyQty: Number(p.buyQty) || 0, getQty: Number(p.getQty) || 0 }))
      .filter(p => p.buyQty > 0 && p.getQty > 0);

    const firstPromo = cleanPromos[0];

    try {
      // Create a fresh doc structure or merge with deleted keys
      const updatedProduct: Product = {
        ...productToEdit,
        name: editProductName.trim(),
        price: editProductPrice ? Number(editProductPrice) : undefined,
        promoBuyQty: firstPromo ? firstPromo.buyQty : (editProductPromoBuy ? Number(editProductPromoBuy) : undefined),
        promoGetQty: firstPromo ? firstPromo.getQty : (editProductPromoGet ? Number(editProductPromoGet) : undefined),
        promotions: cleanPromos.length > 0 ? cleanPromos : undefined,
      };

      // Since firestore merge doesn't remove fields, if promotions is undefined, we delete it or set it to null/empty in setDoc. Let's do setDoc without merge to fully overwrite, or just merge. Standard overwrite is safer here.
      await setDoc(doc(db, 'products', productToEdit.id), cleanUndefined(updatedProduct));
      setProductToEdit(null);
    } catch (error) {
      console.error("Error updating product: ", error);
      alert('មានបញ្ហាក្នុងការកែប្រែទំនិញ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', id));
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product: ", error);
      alert('មានបញ្ហាក្នុងការលុបទំនិញ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = userToEdit || selectedUserDetail;
    if (!targetUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', targetUser.id), { ...targetUser, username: editUsername, password: editPassword }, { merge: true });
      setUserToEdit(null);
      setSelectedUserDetail(null);
      setIsEditingUser(false);
    } catch (error) {
      console.error("Error updating user: ", error);
      alert('មានបញ្ហាក្នុងការកែប្រែអ្នកប្រើប្រាស់');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setTransactionToDelete(null);
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      alert('មានបញ្ហាក្នុងការលុបប្រតិបត្តិការ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTx = transactionToEdit || selectedTransactionDetail;
    if (!targetTx) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'transactions', targetTx.id), { ...targetTx, quantity: Number(editQuantity), note: editNote }, { merge: true });
      setTransactionToEdit(null);
      setSelectedTransactionDetail(null);
      setIsEditingTransaction(false);
    } catch (error) {
      console.error("Error updating transaction: ", error);
      alert('មានបញ្ហាក្នុងការកែប្រែប្រតិបត្តិការ');
    } finally {
      setLoading(false);
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const activePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize);

  // Filter and sort stock orders
  const filteredStockOrders = [...stockOrders]
    .filter(order => {
      const matchUser = selectedOrderUser === 'all' || order.userId === selectedOrderUser;
      const matchStatus = selectedOrderStatus === 'all' || 
        (selectedOrderStatus === 'pending' && !order.delivered) || 
        (selectedOrderStatus === 'delivered' && order.delivered);
      return matchUser && matchStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalOrderItems = filteredStockOrders.length;
  const totalOrderPages = Math.ceil(totalOrderItems / pageSize);
  const activeOrderPage = Math.min(Math.max(1, currentPage), totalOrderPages || 1);
  const orderStartIndex = (activeOrderPage - 1) * pageSize;
  const paginatedStockOrders = filteredStockOrders.slice(orderStartIndex, orderStartIndex + pageSize);

  return (
    <div className="h-full flex flex-col space-y-6 min-h-0">
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden max-h-full flex flex-col min-h-0">
            <div className="px-5 md:px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-black text-slate-800">បញ្ជីអ្នកប្រើប្រាស់</h3>
              <button
                onClick={() => setIsCreateUserModalOpen(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បង្កើតអ្នកប្រើប្រាស់</span>
              </button>
            </div>
            <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll p-1 md:p-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">ឈ្មោះអ្នកប្រើប្រាស់</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">លេខសម្ងាត់</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">តួនាទី</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {users.map(user => (
                    <tr 
                      key={user.id} 
                      onClick={() => setSelectedUserDetail(user)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-2 md:px-4 py-2.5 sm:py-4 font-bold text-slate-800">{user.username}</td>
                      <td className="px-2 md:px-4 py-2.5 sm:py-4 font-mono font-medium text-slate-500">{user.password}</td>
                      <td className="px-2 md:px-4 py-2.5 sm:py-4">
                        <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] md:text-xs font-bold ${user.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">គ្មានទិន្នន័យ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden max-h-full flex flex-col min-h-0">
            <div className="px-5 md:px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-black text-slate-800">បញ្ជីទំនិញ</h3>
              <button
                onClick={() => setIsCreateProductModalOpen(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បន្ថែមទំនិញ</span>
              </button>
            </div>
            <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll p-1 md:p-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">ឈ្មោះទំនិញ</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100 text-right">តម្លៃ ($)</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100 text-center">កម្មវិធីប្រម៉ូសិន ទិញនិងថែម</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {products.map(product => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedProductDetail(product)}
                    >
                      <td className="px-2 md:px-4 py-2.5 sm:py-4 font-bold text-slate-800">{product.name}</td>
                      <td className="px-2 md:px-4 py-2.5 sm:py-4 text-right font-black text-indigo-600">
                        {product.price !== undefined && product.price !== null ? `$${Number(product.price).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-2 md:px-4 py-2.5 sm:py-4 text-center">
                        {product.promotions && product.promotions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                            {product.promotions.slice(0, 2).map((promo, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                                ទិញ {promo.buyQty} ថែម {promo.getQty}
                              </span>
                            ))}
                            {product.promotions.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                                ច្រើនទៀត
                              </span>
                            )}
                          </div>
                        ) : product.promoBuyQty && product.promoGetQty ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ទិញ {product.promoBuyQty} ថែម {product.promoGetQty}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">គ្មានទិន្នន័យ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-5 md:px-6 py-5 border-b border-slate-50 shrink-0">
            <h3 className="text-base md:text-lg font-black text-slate-800">ប្រតិបត្តិការទាំងអស់</h3>
          </div>
          <div ref={tableContainerRef} onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, totalPages, activePage, setCurrentPage)} className="flex-1 overflow-hidden md:overflow-auto custom-scroll p-1 md:p-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider">
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100">កាលបរិច្ឆេទ</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100">អ្នកប្រើប្រាស់</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100">ប្រភេទប្រតិបត្តិការ</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100">ឈ្មោះទំនិញ</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100 text-right">ចំនួន</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100">ចំណាំ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                {paginatedTransactions.map(t => {
                  const user = users.find(u => u.id === t.userId);
                  let colorClass = 'text-slate-600';
                  let bgClass = 'bg-slate-100 text-slate-700';
                  
                  if (t.type === 'Stock Sold') {
                      colorClass = 'text-emerald-600'; bgClass = 'bg-emerald-100 text-emerald-700';
                  } else if (t.type === 'Stock Out') {
                      colorClass = 'text-rose-600'; bgClass = 'bg-rose-100 text-rose-700';
                  } else if (t.type === 'Stock Return') {
                      colorClass = 'text-amber-600'; bgClass = 'bg-amber-100 text-amber-700';
                  }

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTransactionDetail(t)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 font-medium text-slate-500 whitespace-nowrap">
                        {(() => {
                          const d = new Date(t.date);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return (
                            <div className="leading-tight">
                              <div className="font-bold text-slate-700">{day}/{month}/{year}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 font-bold text-slate-800">{user?.username || 'Unknown'}</td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4">
                        <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] md:text-xs font-bold ${bgClass} whitespace-nowrap`}>
                          {t.type === 'Stock Sold' ? 'លក់ចេញ' : t.type === 'Stock Out' ? 'ឡើងឡាន' : 'ត្រឡប់'}
                        </span>
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 font-bold text-slate-700">{t.productName}</td>
                      <td className={`px-1.5 md:px-4 py-2.5 sm:py-4 text-right font-black ${colorClass}`}>
                        {t.quantity}
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 text-slate-500 font-medium truncate max-w-[60px] sm:max-w-[150px]">{t.note || '-'}</td>
                    </tr>
                  )
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">គ្មានប្រតិបត្តិការទេ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          {totalItems > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 shrink-0">
              <div className="hidden sm:flex items-center space-x-2 text-xs md:text-sm text-slate-500 font-medium">
                <span>
                  បង្ហាញពី {startIndex + 1} ដល់ {Math.min(startIndex + pageSize, totalItems)} នៃ {totalItems}
                </span>
              </div>

              <div className="flex w-full sm:w-auto items-center justify-center sm:justify-end space-x-1.5">
                <button
                  type="button"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="hidden sm:flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-[10px] sm:text-xs text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>មុន</span>
                </button>

                <div className="flex items-center">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    if (totalPages <= maxVisible) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      let start = Math.max(1, activePage - 2);
                      let end = Math.min(totalPages, activePage + 2);
                      if (activePage <= 3) {
                        end = 5;
                      } else if (activePage >= totalPages - 2) {
                        start = totalPages - 4;
                      }
                      for (let i = start; i <= end; i++) pages.push(i);
                    }
                    return pages;
                  })().map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl font-bold text-[10px] sm:text-xs transition mx-0.5 cursor-pointer ${
                        pageNum === activePage
                          ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/10'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="hidden sm:flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-[10px] sm:text-xs text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
                >
                  <span>បន្ទាប់</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stockOrders' && (
        <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-5 md:px-6 py-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-800">ស្តុកកម្មង់</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">ការកម្មង់សរុប៖ {totalOrderItems} ជួរ</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Status filter */}
              <div className="bg-slate-100/80 p-1 rounded-2xl flex space-x-1 border border-slate-200/50">
                {(['all', 'pending', 'delivered'] as const).map((status) => {
                  let label = 'ទាំងអស់';
                  if (status === 'pending') label = 'មិនទាន់ប្រគល់';
                  if (status === 'delivered') label = 'បានប្រគល់';
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setSelectedOrderStatus(status);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        selectedOrderStatus === status
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div ref={tableContainerRef} onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, totalOrderPages, activeOrderPage, setCurrentPage)} className="flex-1 overflow-hidden md:overflow-auto custom-scroll p-1 md:p-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider">
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100 text-left">កាលបរិច្ឆេទ</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100">អ្នកកម្មង់</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100">ឈ្មោះទំនិញ</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100 text-right">ចំនួន</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100 text-left">អតិថិជន</th>
                  <th className="px-1.5 md:px-4 py-2.5 border-b border-slate-100 text-left">ទីតាំង</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                {paginatedStockOrders.map(order => {
                  const d = new Date(order.date);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  const { customer, location } = getOrderCustomerAndLocation(order.note);
                  
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrderDetail(order)}
                    >
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 font-medium text-slate-500 whitespace-nowrap">
                        <div className="leading-tight">
                          <div className="font-bold text-slate-700">{day}/{month}/{year}</div>
                        </div>
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 font-bold text-slate-800">
                        {order.username}
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 font-bold text-slate-700">
                        {order.productName}
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 text-right font-black text-slate-900 text-sm md:text-base">
                        {order.quantity}
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 text-left font-bold text-slate-600 max-w-[120px] sm:max-w-[200px] truncate" title={customer}>
                        {customer || '-'}
                      </td>
                      <td className="px-1.5 md:px-4 py-2.5 sm:py-4 text-left font-bold text-slate-600 max-w-[120px] sm:max-w-[200px] truncate" title={location}>
                        {location || '-'}
                      </td>
                    </tr>
                  );
                })}
                {filteredStockOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center text-slate-400 font-bold">
                      គ្មានទិន្នន័យស្តុកកម្មង់ទេ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalOrderItems > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 shrink-0">
              <div className="hidden sm:flex items-center space-x-2 text-xs md:text-sm text-slate-500 font-medium">
                <span>
                  បង្ហាញពី {orderStartIndex + 1} ដល់ {Math.min(orderStartIndex + pageSize, totalOrderItems)} នៃ {totalOrderItems}
                </span>
              </div>

              <div className="flex w-full sm:w-auto items-center justify-center sm:justify-end space-x-1.5">
                <button
                  type="button"
                  disabled={activeOrderPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="hidden sm:flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-[10px] sm:text-xs text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>មុន</span>
                </button>

                <div className="flex items-center">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    if (totalOrderPages <= maxVisible) {
                      for (let i = 1; i <= totalOrderPages; i++) pages.push(i);
                    } else {
                      let start = Math.max(1, activeOrderPage - 2);
                      let end = Math.min(totalOrderPages, activeOrderPage + 2);
                      if (activeOrderPage <= 3) {
                        end = 5;
                      } else if (activeOrderPage >= totalOrderPages - 2) {
                        start = totalOrderPages - 4;
                      }
                      for (let i = start; i <= end; i++) pages.push(i);
                    }
                    return pages;
                  })().map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl font-bold text-[10px] sm:text-xs transition mx-0.5 cursor-pointer ${
                        pageNum === activeOrderPage
                          ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/10'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={activeOrderPage === totalOrderPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalOrderPages, prev + 1))}
                  className="hidden sm:flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-[10px] sm:text-xs text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
                >
                  <span>បន្ទាប់</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting User */}
      {userToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុប</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបអ្នកប្រើប្រាស់ <span className="font-bold text-slate-800">"{userToDelete.username}"</span> នេះមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDeleteUser(userToDelete.id)}
                className="flex-1 hover:bg-rose-700 bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal for Deleting Product */}
      {productToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុប</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបទំនិញ <span className="font-bold text-slate-800">"{productToDelete.name}"</span> នេះមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDeleteProduct(productToDelete.id)}
                className="flex-1 hover:bg-rose-700 bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isCreateUserModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateUserModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">បង្កើតអ្នកប្រើប្រាស់ថ្មី</h3>
              <button 
                onClick={() => setIsCreateUserModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអ្នកប្រើប្រាស់</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                />
              </div>
              <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3.5 rounded-2xl transition cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'កំពុងបង្កើត...' : 'បង្កើត'}
                  </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isCreateProductModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateProductModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">បន្ថែមទំនិញថ្មី</h3>
              <button 
                onClick={() => setIsCreateProductModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះទំនិញ</label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                  placeholder="បញ្ចូលឈ្មោះទំនិញ"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តម្លៃ ($)</label>
                <input
                  type="number"
                  step="any"
                  value={newProductPrice}
                  onChange={e => setNewProductPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  placeholder="បញ្ចូលតម្លៃ (ឧទាហរណ៍៖ 5.5)"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs font-bold text-slate-500">កម្មវិធីប្រម៉ូសិន ទិញនិងថែម (Multi-Promotion)</p>
                  <button
                    type="button"
                    onClick={addCreatePromoRow}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <span>+ បន្ថែមកម្រិត</span>
                  </button>
                </div>
                
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scroll">
                  {newProductPromotions.map((p, idx) => (
                    <div key={idx} className="flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[10px] font-black text-slate-400">ទិញ</span>
                          <input
                            type="number"
                            value={p.buyQty || ''}
                            onChange={e => updateCreatePromoRow(idx, 'buyQty', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-xs focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                            placeholder="10"
                            min="1"
                            required
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[10px] font-black text-slate-400">ថែម</span>
                          <input
                            type="number"
                            value={p.getQty || ''}
                            onChange={e => updateCreatePromoRow(idx, 'getQty', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-xs focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                            placeholder="1"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeCreatePromoRow(idx)}
                        className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="លុបកម្រិតនេះ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {newProductPromotions.length === 0 && (
                    <div className="text-center py-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[11px] text-slate-400 font-bold">គ្មានការកំណត់ប្រម៉ូសិនទេ</p>
                      <button
                        type="button"
                        onClick={addCreatePromoRow}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold mt-1 inline-block hover:underline"
                      >
                        ចុចទីនេះដើម្បីបន្ថែមប្រម៉ូសិនដំបូង
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateProductModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'កំពុងបង្កើត...' : 'បង្កើត'}
                  </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {productToEdit && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProductToEdit(null)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">កែប្រែព័ត៌មានទំនិញ</h3>
              <button 
                onClick={() => setProductToEdit(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះទំនិញ</label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={e => setEditProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                  placeholder="បញ្ចូលឈ្មោះទំនិញ"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តម្លៃ ($)</label>
                <input
                  type="number"
                  step="any"
                  value={editProductPrice}
                  onChange={e => setEditProductPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  placeholder="បញ្ចូលតម្លៃ (ឧទាហរណ៍៖ 5.5)"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs font-bold text-slate-500">កម្មវិធីប្រម៉ូសិន ទិញនិងថែម (Multi-Promotion)</p>
                  <button
                    type="button"
                    onClick={addEditPromoRow}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <span>+ បន្ថែមកម្រិត</span>
                  </button>
                </div>
                
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scroll">
                  {editProductPromotions.map((p, idx) => (
                    <div key={idx} className="flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[10px] font-black text-slate-400">ទិញ</span>
                          <input
                            type="number"
                            value={p.buyQty || ''}
                            onChange={e => updateEditPromoRow(idx, 'buyQty', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-xs focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                            placeholder="10"
                            min="1"
                            required
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[10px] font-black text-slate-400">ថែម</span>
                          <input
                            type="number"
                            value={p.getQty || ''}
                            onChange={e => updateEditPromoRow(idx, 'getQty', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-xs focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                            placeholder="1"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeEditPromoRow(idx)}
                        className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="លុបកម្រិតនេះ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {editProductPromotions.length === 0 && (
                    <div className="text-center py-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[11px] text-slate-400 font-bold">គ្មានការកំណត់ប្រម៉ូសិនទេ</p>
                      <button
                        type="button"
                        onClick={addEditPromoRow}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold mt-1 inline-block hover:underline"
                      >
                        ចុចទីនេះដើម្បីបន្ថែមប្រម៉ូសិនដំបូង
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setProductToEdit(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {transactionToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setTransactionToDelete(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុប</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">តើអ្នកពិតជាចង់លុបប្រតិបត្តិការនេះមែនទេ?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={() => handleDeleteTransaction(transactionToDelete.id)}
                disabled={loading}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-rose-500/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'លុប'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedTransactionDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800">
                  {isEditingTransaction ? 'កែប្រែព័ត៌មានលម្អិត' : 'ព័ត៌មានលម្អិត'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedTransactionDetail.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : selectedTransactionDetail.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedTransactionDetail(null);
                  setIsEditingTransaction(false);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isEditingTransaction ? (
              <form onSubmit={handleUpdateTransaction} className="py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំនួន</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={e => setEditQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>

                {/* Live pricing display for editing transaction */}
                {(() => {
                  const product = products.find(p => p.name === selectedTransactionDetail.productName);
                  const qtyVal = parseInt(editQuantity) || 0;
                  const hasPrice = product && product.price !== undefined && product.price !== null;
                  const subtotal = hasPrice && qtyVal > 0 ? product.price * qtyVal : 0;
                  if (product) {
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex justify-between items-center px-4 text-xs font-medium text-slate-500">
                        <span>
                          {hasPrice ? (
                            <span>តម្លៃឯកតា៖ <span className="font-bold text-slate-700">${product.price?.toFixed(2)}</span></span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </span>
                        {hasPrice && qtyVal > 0 && (
                          <span className="font-black text-indigo-600">សរុប៖ ${subtotal.toFixed(2)}</span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំណាំ</label>
                  <textarea
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-medium text-slate-800 h-24 resize-none"
                    placeholder="គ្មានចំណាំ"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingTransaction(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="py-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">អ្នកប្រើប្រាស់</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{users.find(u => u.id === selectedTransactionDetail.userId)?.username || 'Unknown'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">ឈ្មោះទំនិញ</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{selectedTransactionDetail.productName}</span>
                  </div>
                  {(() => {
                    const product = products.find(p => p.name === selectedTransactionDetail.productName);
                    if (product && product.price !== undefined && product.price !== null) {
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-xs font-bold text-slate-400">តម្លៃឯកតា</span>
                            <span className="col-span-2 text-sm font-black text-indigo-600">${product.price.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-xs font-bold text-slate-400">តម្លៃសរុប</span>
                            <span className="col-span-2 text-sm font-black text-indigo-600">${(product.price * selectedTransactionDetail.quantity).toFixed(2)}</span>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">ចំនួន</span>
                    <span className={`col-span-2 text-base font-black ${
                        selectedTransactionDetail.type === 'Stock Sold' ? 'text-emerald-600' :
                        selectedTransactionDetail.type === 'Stock Out' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    >
                      {selectedTransactionDetail.quantity}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">ចំណាំ</span>
                    <div className="col-span-2 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 break-words">
                      {selectedTransactionDetail.note || <span className="text-slate-300 font-normal">គ្មានចំណាំ</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">កាលបរិច្ឆេទ</span>
                    <span className="col-span-2 text-xs font-bold text-slate-500">
                      {(() => {
                        const d = new Date(selectedTransactionDetail.date);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        const h = String(d.getHours()).padStart(2, '0');
                        const m = String(d.getMinutes()).padStart(2, '0');
                        return `${day}/${month}/${year} ${h}:${m}`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsEditingTransaction(true);
                      setEditQuantity(String(selectedTransactionDetail.quantity));
                      setEditNote(selectedTransactionDetail.note || '');
                    }}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    កែប្រែ
                  </button>
                  <button
                    onClick={() => {
                      setTransactionToDelete(selectedTransactionDetail);
                      setSelectedTransactionDetail(null);
                    }}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    លុប
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {selectedUserDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800">
                  {isEditingUser ? 'កែប្រែអ្នកប្រើប្រាស់' : 'ព័ត៌មានអ្នកប្រើប្រាស់'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedUserDetail(null);
                  setIsEditingUser(false);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isEditingUser ? (
              <form onSubmit={handleUpdateUser} className="py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអ្នកប្រើប្រាស់</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingUser(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="py-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">ឈ្មោះអ្នកប្រើប្រាស់</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{selectedUserDetail.username}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">លេខសម្ងាត់</span>
                    <span className="col-span-2 text-sm font-mono font-medium text-slate-500">{selectedUserDetail.password}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">តួនាទី</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${selectedUserDetail.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {selectedUserDetail.role}
                      </span>
                    </span>
                  </div>
                </div>

                {selectedUserDetail.role !== 'Admin' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsEditingUser(true);
                        setEditUsername(selectedUserDetail.username);
                        setEditPassword(selectedUserDetail.password);
                      }}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                    >
                      កែប្រែ
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(selectedUserDetail);
                        setSelectedUserDetail(null);
                      }}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                    >
                      លុប
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {selectedProductDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800">
                  ព័ត៌មានទំនិញ
                </h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedProductDetail(null);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-bold text-slate-400">ឈ្មោះទំនិញ</span>
                <span className="col-span-2 text-sm font-black text-slate-800">{selectedProductDetail.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-bold text-slate-400">តម្លៃ ($)</span>
                <span className="col-span-2 text-sm font-black text-indigo-600">
                  {selectedProductDetail.price !== undefined && selectedProductDetail.price !== null ? `$${Number(selectedProductDetail.price).toFixed(2)}` : '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-start">
                <span className="text-xs font-bold text-slate-400 pt-1">ប្រម៉ូសិន ទិញថែម</span>
                <div className="col-span-2">
                  {selectedProductDetail.promotions && selectedProductDetail.promotions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProductDetail.promotions.map((promo, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                          ទិញ {promo.buyQty} ថែម {promo.getQty}
                        </span>
                      ))}
                    </div>
                  ) : selectedProductDetail.promoBuyQty && selectedProductDetail.promoGetQty ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                      ទិញ {selectedProductDetail.promoBuyQty} ថែម {selectedProductDetail.promoGetQty}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-bold">-</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setProductToEdit(selectedProductDetail);
                  setEditProductName(selectedProductDetail.name);
                  setEditProductPrice(selectedProductDetail.price !== undefined ? String(selectedProductDetail.price) : '');
                  setEditProductPromoBuy(selectedProductDetail.promoBuyQty !== undefined ? String(selectedProductDetail.promoBuyQty) : '');
                  setEditProductPromoGet(selectedProductDetail.promoGetQty !== undefined ? String(selectedProductDetail.promoGetQty) : '');
                  
                  if (selectedProductDetail.promotions && selectedProductDetail.promotions.length > 0) {
                    setEditProductPromotions(selectedProductDetail.promotions.map(p => ({ buyQty: p.buyQty, getQty: p.getQty })));
                  } else if (selectedProductDetail.promoBuyQty && selectedProductDetail.promoGetQty) {
                    setEditProductPromotions([{ buyQty: selectedProductDetail.promoBuyQty, getQty: selectedProductDetail.promoGetQty }]);
                  } else {
                    setEditProductPromotions([]);
                  }
                  setSelectedProductDetail(null);
                }}
                className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer text-center"
              >
                កែប្រែ
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductToDelete(selectedProductDetail);
                  setSelectedProductDetail(null);
                }}
                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer text-center"
              >
                លុប
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Stock Order Modals */}
      {isCreateOrderModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto custom-scroll animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base md:text-lg font-black text-slate-800">បញ្ចូលស្តុកកម្មង់ថ្មី</h3>
              <button 
                onClick={() => setIsCreateOrderModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdminCreateStockOrder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={e => setOrderDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                />
              </div>

              {/* Order Items Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ទំនិញដែលត្រូវកម្មង់</span>
                  <button
                    type="button"
                    onClick={addOrderItemRow}
                    className="text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    + បន្ថែមទំនិញ
                  </button>
                </div>

                {orderItems.map((item, idx) => {
                  const product = products.find(p => p.name === item.productName);
                  const qtyVal = parseInt(item.quantity) || 0;
                  const hasPrice = product && product.price !== undefined && product.price !== null;
                  const subtotal = hasPrice && qtyVal > 0 ? product.price * qtyVal : 0;

                  return (
                    <div key={idx} className="bg-slate-50 hover:bg-slate-100/75 p-3 rounded-2xl border border-slate-100 space-y-2 transition animate-in fade-in duration-150">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 min-w-[120px]">
                          <select
                            value={item.productName}
                            onChange={e => updateOrderItemRow(idx, 'productName', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-400 transition outline-none font-bold text-slate-700 cursor-pointer"
                            required
                          >
                            <option value="">-- ទំនិញ --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="ចំនួន"
                            value={item.quantity}
                            onChange={e => updateOrderItemRow(idx, 'quantity', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-400 transition outline-none font-bold text-slate-700 text-right"
                            required
                            min="1"
                          />
                        </div>

                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOrderItemRow(idx)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-xl transition cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Pricing details in the row */}
                      {product && (
                        <div className="flex justify-between items-center text-[11px] px-1 text-slate-500 font-medium border-t border-slate-200/50 pt-1.5">
                          <span>
                            {hasPrice ? (
                              <span>តម្លៃឯកតា៖ <span className="font-bold text-slate-700">${product.price?.toFixed(2)}</span></span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </span>
                          {hasPrice && qtyVal > 0 && (
                            <span className="font-black text-indigo-600">សរុប៖ ${subtotal.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Grand Total */}
                {(() => {
                  const grandTotal = orderItems.reduce((sum, item) => {
                    const product = products.find(p => p.name === item.productName);
                    const qty = parseInt(item.quantity) || 0;
                    if (product && product.price !== undefined && product.price !== null) {
                      return sum + (product.price * qty);
                    }
                    return sum;
                  }, 0);
                  
                  if (grandTotal > 0) {
                    return (
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center px-4 mt-1">
                        <span className="text-xs font-black text-indigo-700">តម្លៃសរុបទាំងអស់៖</span>
                        <span className="text-sm font-black text-indigo-600">${grandTotal.toFixed(2)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1 font-black">ឈ្មោះអតិថិជន</label>
                  <input
                    type="text"
                    value={orderCustomerName}
                    onChange={e => setOrderCustomerName(e.target.value)}
                    placeholder="ឈ្មោះអតិថិជន..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1 font-black">ទីតាំង</label>
                  <input
                    type="text"
                    value={orderLocation}
                    onChange={e => setOrderLocation(e.target.value)}
                    placeholder="ទីតាំង..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOrderModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3.5 rounded-2xl transition cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកម្មង់'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {orderToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុបកម្មង់</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបការកម្មង់ <span className="font-bold text-slate-800">"{orderToDelete.productName} ({orderToDelete.quantity})"</span> របស់ <span className="font-bold text-slate-800">{orderToDelete.username}</span> នេះមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => handleAdminDeleteOrder(orderToDelete.id)}
                disabled={loading}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/20 active:scale-95 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'លុបចោល'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedOrderDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base md:text-lg font-black text-slate-800">
                {isEditingOrder ? 'កែប្រែព័ត៌មានការកម្មង់' : 'ព័ត៌មានលម្អិតពីការកម្មង់'}
              </h3>
              <button 
                onClick={() => {
                  setSelectedOrderDetail(null);
                  setIsEditingOrder(false);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isEditingOrder ? (
              <form onSubmit={handleAdminEditOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">អ្នកប្រើប្រាស់ / ឡាន</label>
                  <select
                    value={editOrderUserId}
                    onChange={e => setEditOrderUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800 cursor-pointer"
                    required
                  >
                    {users.filter(u => u.role === 'User').map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះទំនិញ</label>
                    <select
                      value={editOrderProductName}
                      onChange={e => setEditOrderProductName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800 cursor-pointer"
                      required
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំនួន</label>
                    <input
                      type="number"
                      value={editOrderQuantity}
                      onChange={e => setEditOrderQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800 text-right"
                      required
                      min="1"
                    />
                  </div>
                </div>

                {/* Live pricing display for editing order */}
                {(() => {
                  const product = products.find(p => p.name === editOrderProductName);
                  const qtyVal = parseInt(editOrderQuantity) || 0;
                  const hasPrice = product && product.price !== undefined && product.price !== null;
                  const subtotal = hasPrice && qtyVal > 0 ? product.price * qtyVal : 0;
                  if (product) {
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex justify-between items-center px-4 text-xs font-medium text-slate-500">
                        <span>
                          {hasPrice ? (
                            <span>តម្លៃឯកតា៖ <span className="font-bold text-slate-700">${product.price?.toFixed(2)}</span></span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </span>
                        {hasPrice && qtyVal > 0 && (
                          <span className="font-black text-indigo-600">សរុប៖ ${subtotal.toFixed(2)}</span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                    <input
                      type="date"
                      value={editOrderDate}
                      onChange={e => setEditOrderDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ស្ថានភាពប្រគល់</label>
                    <select
                      value={String(editOrderDelivered)}
                      onChange={e => setEditOrderDelivered(e.target.value === 'true')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="false">កំពុងរង់ចាំ</option>
                      <option value="true">បានប្រគល់រួច</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអតិថិជន</label>
                    <input
                      type="text"
                      value={editOrderCustomerName}
                      onChange={e => setEditOrderCustomerName(e.target.value)}
                      placeholder="ឈ្មោះអតិថិជន..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ទីតាំង</label>
                    <input
                      type="text"
                      value={editOrderLocation}
                      onChange={e => setEditOrderLocation(e.target.value)}
                      placeholder="ទីតាំង..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingOrder(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">កាលបរិច្ឆេទ</span>
                    <span className="col-span-2 text-sm font-bold text-slate-800">
                      {(() => {
                        const d = new Date(selectedOrderDetail.date);
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      })()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">អ្នកកម្មង់</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{selectedOrderDetail.username}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">ឈ្មោះទំនិញ</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{selectedOrderDetail.productName}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">ចំនួនទំនិញ</span>
                    <span className="col-span-2 text-sm font-black text-emerald-600 text-base">{selectedOrderDetail.quantity}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">ស្ថានភាព</span>
                    <span className="col-span-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-xl text-xs font-black ${
                        selectedOrderDetail.delivered 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700 animate-pulse'
                      }`}>
                        {selectedOrderDetail.delivered ? 'បានប្រគល់រួច' : 'កំពុងរង់ចាំប្រគល់'}
                      </span>
                    </span>
                  </div>

                  {selectedOrderDetail.delivered && (
                    <>
                      <div className="grid grid-cols-3 gap-2 items-start">
                        <span className="text-xs font-bold text-slate-400">ប្រគល់នៅ</span>
                        <span className="col-span-2 text-xs font-medium text-slate-500">
                          {selectedOrderDetail.deliveredAt ? new Date(selectedOrderDetail.deliveredAt).toLocaleString('kh-KH') : '-'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-start">
                        <span className="text-xs font-bold text-slate-400">ប្រគល់ដោយ</span>
                        <span className="col-span-2 text-xs font-bold text-slate-700">
                          {selectedOrderDetail.deliveredBy || '-'}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">ឈ្មោះអតិថិជន</span>
                    <span className="col-span-2 text-sm text-slate-600 font-bold">
                      {getOrderCustomerAndLocation(selectedOrderDetail.note).customer || '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400">ទីតាំង</span>
                    <span className="col-span-2 text-sm text-slate-600 font-bold">
                      {getOrderCustomerAndLocation(selectedOrderDetail.note).location || '-'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-5 border-t border-slate-100 mt-6">
                  {!selectedOrderDetail.delivered ? (
                    <button
                      onClick={() => handleAdminConfirmDelivery(selectedOrderDetail.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm py-3 rounded-2xl shadow-md shadow-emerald-600/10 active:scale-95 transition cursor-pointer"
                    >
                      បញ្ជាក់ការប្រគល់
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdminUnconfirmDelivery(selectedOrderDetail.id)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-3 rounded-2xl active:scale-95 transition cursor-pointer"
                    >
                      ដាក់ថា «មិនទាន់ប្រគល់»
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setOrderToEdit(selectedOrderDetail);
                      setEditOrderUserId(selectedOrderDetail.userId);
                      setEditOrderProductName(selectedOrderDetail.productName);
                      setEditOrderQuantity(String(selectedOrderDetail.quantity));
                      setEditOrderDate(selectedOrderDetail.date);
                      const { customer, location } = getOrderCustomerAndLocation(selectedOrderDetail.note);
                      setEditOrderCustomerName(customer);
                      setEditOrderLocation(location);
                      setEditOrderDelivered(selectedOrderDetail.delivered);
                      setIsEditingOrder(true);
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition cursor-pointer"
                  >
                    កែប្រែ
                  </button>
                  <button
                    onClick={() => {
                      setOrderToDelete(selectedOrderDetail);
                      setSelectedOrderDetail(null);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition cursor-pointer"
                  >
                    លុប
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
