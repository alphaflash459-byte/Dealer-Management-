import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User, Transaction, Product, StockOrder, PromotionTier } from '../types';
import { doc, setDoc, deleteDoc, updateDoc, deleteField, increment, collection, onSnapshot } from 'firebase/firestore';
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

export function calculatePromoQty(product: Product | undefined, qty: number): number {
  if (!product) return 0;
  
  if (product.promotions && product.promotions.length > 0) {
    const sortedPromos = [...product.promotions]
      .filter(p => p.buyQty > 0 && p.getQty > 0)
      .sort((a, b) => b.buyQty - a.buyQty);
      
    if (sortedPromos.length > 0) {
      let remainingQty = qty;
      let totalFree = 0;
      
      for (const promo of sortedPromos) {
        if (remainingQty >= promo.buyQty) {
          const multiplier = Math.floor(remainingQty / promo.buyQty);
          totalFree += multiplier * promo.getQty;
          remainingQty %= promo.buyQty;
        }
      }
      return remainingQty === 0 ? totalFree : 0;
    }
  }
  
  if (product.promoBuyQty && product.promoGetQty && product.promoBuyQty > 0) {
    if (qty % product.promoBuyQty === 0) {
      return Math.floor(qty / product.promoBuyQty) * product.promoGetQty;
    }
    return 0;
  }
  
  return 0;
}

export function calculateAutoPriceForQty(product: Product, qty: number): number {
  const standardPrice = product.price || 0;
  if (qty <= 0) return standardPrice;

  // Check if quantity is an exact promo target number
  const freeQty = calculatePromoQty(product, qty);
  if (freeQty > 0) {
    return standardPrice;
  }

  // Check if it's an apportioned quantity (buyQty + getQty)
  const tiers: { buyQty: number; getQty: number }[] = [];
  if (product.promotions && product.promotions.length > 0) {
    tiers.push(...product.promotions.filter(p => p.buyQty > 0 && p.getQty > 0));
  } else if (product.promoBuyQty && product.promoBuyQty > 0 && product.promoGetQty) {
    tiers.push({ buyQty: product.promoBuyQty, getQty: product.promoGetQty });
  }

  // Sort descending by total (buyQty + getQty)
  tiers.sort((a, b) => (b.buyQty + b.getQty) - (a.buyQty + a.getQty));

  let remainingQty = qty;
  for (const tier of tiers) {
    const totalQty = tier.buyQty + tier.getQty;
    if (remainingQty >= totalQty) {
      remainingQty %= totalQty;
      // If it perfectly divides by one of the tiers, return its apportioned price
      if (remainingQty === 0) {
        return (tier.buyQty * standardPrice) / totalQty;
      }
    }
  }

  return standardPrice;
}

export function calculatePromoQtyWithPriceCheck(product: Product | undefined, qty: number, priceVal: number): number {
  if (!product || qty <= 0) return 0;
  
  const standardPrice = product.price || 0;
  if (Math.abs(priceVal - standardPrice) > 0.001) {
    return 0;
  }
  
  return calculatePromoQty(product, qty);
}

interface StockItemInput {
  productName: string;
  quantity: string;
  price?: string;
}

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: Transaction[];
  products: Product[];
  stockOrders: StockOrder[];
  activeTab: 'users' | 'products' | 'transactions' | 'stockOrders' | 'stockOut' | 'stockSold' | 'stockReturn' | 'warehouse';
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
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any | null>(null);
  const [selectedRowItem, setSelectedRowItem] = useState<Transaction | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editQuantity, setEditQuantity] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editTxProductName, setEditTxProductName] = useState('');
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxCustomerName, setEditTxCustomerName] = useState('');
  const [editTxLocation, setEditTxLocation] = useState('');
  const [editTxPrice, setEditTxPrice] = useState('');

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

  // Filter transaction states for Admin "All Transactions"
  const [filterTxUserId, setFilterTxUserId] = useState<string>('all');
  const [filterTxStartDate, setFilterTxStartDate] = useState<string>('');
  const [filterTxEndDate, setFilterTxEndDate] = useState<string>('');

  // Edit / Delete stock order states
  const [orderToDelete, setOrderToDelete] = useState<StockOrder | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<StockOrder | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editOrderUserId, setEditOrderUserId] = useState('');
  const [editOrderProductName, setEditOrderProductName] = useState('');
  const [editOrderQuantity, setEditOrderQuantity] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editOrderCustomerName, setEditOrderCustomerName] = useState('');
  const [editOrderLocation, setEditOrderLocation] = useState('');
  const [editOrderDelivered, setEditOrderDelivered] = useState(false);

  // Warehouse Stock states
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isEditWarehouseStockModalOpen, setIsEditWarehouseStockModalOpen] = useState(false);
  const [productToEditWarehouseStock, setProductToEditWarehouseStock] = useState<Product | null>(null);
  const [editWarehouseStockVal, setEditWarehouseStockVal] = useState('');
  const [stockInDate, setStockInDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [stockInDeliverer, setStockInDeliverer] = useState('');
  const [stockInItems, setStockInItems] = useState<StockItemInput[]>([]);
  const [actualStockDrafts, setActualStockDrafts] = useState<{ [productId: string]: string }>({});
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [warehouseStockIns, setWarehouseStockIns] = useState<any[]>([]);
  const [isStockInHistoryOpen, setIsStockInHistoryOpen] = useState(false);
  const [stockInToDelete, setStockInToDelete] = useState<any | null>(null);
  
  // New States for Stock In History Row details and Edit
  const [selectedStockInRecord, setSelectedStockInRecord] = useState<any | null>(null);
  const [isEditStockInModalOpen, setIsEditStockInModalOpen] = useState(false);
  const [stockInToEdit, setStockInToEdit] = useState<any | null>(null);
  const [editStockInDate, setEditStockInDate] = useState('');
  const [editStockInDeliverer, setEditStockInDeliverer] = useState('');
  const [editStockInItems, setEditStockInItems] = useState<StockItemInput[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'warehouse_stock_ins'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setWarehouseStockIns(data);
    });
    return () => unsub();
  }, []);

  const handleUpdateStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInToEdit) return;

    const validItems = editStockInItems.filter(item => item.productName && item.quantity);
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
      // 1. Revert old items
      await Promise.all(stockInToEdit.items.map(async (oldItem: any) => {
        const product = products.find(p => p.name === oldItem.productName);
        if (product) {
          await updateDoc(doc(db, 'products', product.id), {
            warehouseStock: increment(-oldItem.quantity)
          });
        }
      }));

      // 2. Apply new items
      await Promise.all(validItems.map(async (newItem) => {
        const product = products.find(p => p.name === newItem.productName);
        if (product) {
          await updateDoc(doc(db, 'products', product.id), {
            warehouseStock: increment(parseInt(newItem.quantity))
          });
        }
      }));

      // 3. Update record
      const updatedRecord = {
        ...stockInToEdit,
        date: editStockInDate,
        deliverer: editStockInDeliverer,
        items: validItems.map(item => ({
          productName: item.productName,
          quantity: parseInt(item.quantity)
        }))
      };
      await updateDoc(doc(db, 'warehouse_stock_ins', stockInToEdit.id), updatedRecord);

      setIsEditStockInModalOpen(false);
      setStockInToEdit(null);
      setSelectedStockInRecord(updatedRecord);
    } catch (err) {
      console.error("Error updating stock in: ", err);
      alert("មានបញ្ហាក្នុងការកែប្រែ");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWarehouseStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEditWarehouseStock) return;
    const qty = parseInt(editWarehouseStockVal);
    if (isNaN(qty) || qty < 0) {
      alert("សូមបញ្ចូលចំនួនត្រឹមត្រូវ (Please enter a valid quantity)");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'products', productToEditWarehouseStock.id), {
        warehouseStock: qty
      });
      setIsEditWarehouseStockModalOpen(false);
      setProductToEditWarehouseStock(null);
      setEditWarehouseStockVal('');
    } catch (err) {
      console.error("Error saving warehouse stock: ", err);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActualStock = async (product: Product) => {
    const draftValue = actualStockDrafts[product.id];
    if (draftValue === undefined || draftValue === '') return;
    const qty = parseInt(draftValue);
    if (isNaN(qty) || qty < 0) {
      alert("សូមបញ្ចូលចំនួនត្រឹមត្រូវ (Please enter a valid quantity)");
      return;
    }
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'products', product.id), {
        actualStock: qty,
        lastStockTake: new Date().toISOString()
      });
      // Clear the draft state so it falls back to the database value
      const updatedDrafts = { ...actualStockDrafts };
      delete updatedDrafts[product.id];
      setActualStockDrafts(updatedDrafts);
    } catch (err) {
      console.error("Error saving actual stock: ", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelectToStockIn = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProdName = e.target.value;
    if (!selectedProdName) return;

    const alreadyExists = stockInItems.some(item => item.productName === selectedProdName);
    if (alreadyExists) {
      alert('មុខទំនិញនេះត្រូវបានបន្ថែមរួចហើយ!');
      e.target.value = '';
      return;
    }

    setStockInItems(prev => [...prev, { productName: selectedProdName, quantity: '' }]);
    e.target.value = '';
  };

  const updateStockInRow = (index: number, field: keyof StockItemInput, value: string) => {
    setStockInItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeStockInRow = (index: number) => {
    setStockInItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = stockInItems.filter(item => item.productName && item.quantity);
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
      await Promise.all(validItems.map(async (item) => {
        const product = products.find(p => p.name === item.productName);
        if (product) {
          const qty = parseInt(item.quantity);
          const currentStock = product.warehouseStock || 0;
          await updateDoc(doc(db, 'products', product.id), {
            warehouseStock: currentStock + qty
          });
        }
      }));

      // Add Stock In history record
      const stockInRecord = {
        id: `stock-in-${Date.now()}`,
        date: stockInDate,
        deliverer: stockInDeliverer || 'Admin',
        items: validItems.map(item => ({
          productName: item.productName,
          quantity: parseInt(item.quantity)
        })),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'warehouse_stock_ins', stockInRecord.id), stockInRecord);

      setIsStockInModalOpen(false);
      setStockInItems([]);
    } catch (err) {
      console.error("Error saving stock in: ", err);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStockIn = async (record: any) => {
    setLoading(true);
    try {
      await Promise.all(record.items.map(async (item: any) => {
        const product = products.find(p => p.name === item.productName);
        if (product) {
          const currentStock = product.warehouseStock || 0;
          await updateDoc(doc(db, 'products', product.id), {
            warehouseStock: currentStock - item.quantity
          });
        }
      }));
      await deleteDoc(doc(db, 'warehouse_stock_ins', record.id));
      setStockInToDelete(null);
    } catch (err) {
      console.error("Error deleting stock in record: ", err);
      alert("មានបញ្ហាក្នុងការលុបប្រវត្តិស្តុកចូល");
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouseProducts = products.filter(p =>
    p.name.toLowerCase().includes(warehouseSearchQuery.toLowerCase())
  );

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

  const handleAdminConfirmDelivery = async (orderGroup: any) => {
    setLoading(true);
    try {
      await Promise.all(orderGroup.items.map(async (item: any) => {
        await setDoc(doc(db, 'stock_orders', item.id), {
          delivered: true,
          deliveredAt: new Date().toISOString(),
          deliveredBy: 'Admin'
        }, { merge: true });
      }));
      setSelectedOrderDetail(null);
    } catch (error) {
      console.error("Error confirming delivery: ", error);
      alert("មានបញ្ហាក្នុងការធ្វើបច្ចុប្បន្នភាពទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUnconfirmDelivery = async (orderGroup: any) => {
    setLoading(true);
    try {
      await Promise.all(orderGroup.items.map(async (item: any) => {
        await setDoc(doc(db, 'stock_orders', item.id), {
          delivered: false,
          deliveredAt: null,
          deliveredBy: null
        }, { merge: true });
      }));
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
      if (transactionToDelete) {
        const product = products.find(p => p.name === transactionToDelete.productName);
        if (product) {
          if (transactionToDelete.type === 'Stock Out') {
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(transactionToDelete.quantity)
            });
          } else if (transactionToDelete.type === 'Stock Return') {
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(-transactionToDelete.quantity)
            });
          }
        }
      }
      await deleteDoc(doc(db, 'transactions', id));
      setTransactionToDelete(null);
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      alert('មានបញ្ហាក្នុងការលុបប្រតិបត្តិការ');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransactionClick = (t: Transaction) => {
    setTransactionToEdit(t);
    setEditTxProductName(t.productName);
    setEditQuantity(String(t.quantity));
    
    const prod = products.find(p => p.name === t.productName);
    setEditTxPrice(t.price !== undefined ? String(t.price) : (prod?.price !== undefined ? String(prod.price) : ''));
    
    const tDate = t.date ? new Date(t.date) : new Date();
    const validDate = isNaN(tDate.getTime()) ? new Date() : tDate;
    const yyyy = validDate.getFullYear();
    const mm = String(validDate.getMonth() + 1).padStart(2, '0');
    const dd = String(validDate.getDate()).padStart(2, '0');
    setEditTxDate(`${yyyy}-${mm}-${dd}`);
    setEditNote(t.note || '');

    if (t.type === 'Stock Sold') {
      const currentNote = t.note || '';
      const match = currentNote.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        setEditTxCustomerName(match[1].trim());
        setEditTxLocation(match[2].trim());
      } else {
        setEditTxCustomerName(currentNote);
        setEditTxLocation('');
      }
    } else {
      setEditTxCustomerName('');
      setEditTxLocation('');
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToEdit) return;

    if (!editTxProductName) {
      alert('សូមជ្រើសរើសឈ្មោះទំនិញ!');
      return;
    }
    if (!editQuantity) {
      alert('សូមបំពេញចំនួនទំនិញ!');
      return;
    }
    const qty = parseInt(editQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert('ចំនួនទំនិញត្រូវតែជាលេខវិជ្ជមាន!');
      return;
    }

    setLoading(true);

    try {
      const origDate = transactionToEdit.date ? new Date(transactionToEdit.date) : new Date();
      const safeOrigDate = isNaN(origDate.getTime()) ? new Date() : origDate;
      const selectedDate = new Date(editTxDate);
      
      if (!isNaN(selectedDate.getTime())) {
        selectedDate.setHours(
          safeOrigDate.getHours(),
          safeOrigDate.getMinutes(),
          safeOrigDate.getSeconds(),
          safeOrigDate.getMilliseconds()
        );
      }

      const parsedPrice = parseFloat(editTxPrice);

      const product = products.find(p => p.name === editTxProductName);
      let promoQty: number | undefined = undefined;
      if (product && transactionToEdit.type === 'Stock Sold') {
        promoQty = calculatePromoQtyWithPriceCheck(product, qty, isNaN(parsedPrice) ? 0 : parsedPrice);
      }

      const updatedTransaction: Partial<Transaction> = {
        productName: editTxProductName,
        quantity: qty,
        price: isNaN(parsedPrice) ? undefined : parsedPrice,
        promoQty: promoQty && promoQty > 0 ? promoQty : undefined,
        date: selectedDate.toISOString(),
        note: transactionToEdit.type === 'Stock Sold' ? (editTxCustomerName && editTxLocation ? `${editTxCustomerName} (${editTxLocation})` : editTxCustomerName || editTxLocation || '') : editNote
      };

      if (!promoQty || promoQty <= 0) {
        (updatedTransaction as any).promoQty = deleteField(); 
      }

      // Handle Warehouse Stock updates for Edit
      if (transactionToEdit.type === 'Stock Out') {
        const oldProduct = products.find(p => p.name === transactionToEdit.productName);
        const newProduct = products.find(p => p.name === editTxProductName);
        
        if (oldProduct && newProduct && oldProduct.id === newProduct.id) {
          const diff = transactionToEdit.quantity - qty;
          if (diff !== 0) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(diff)
            });
          }
        } else {
          if (oldProduct) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(transactionToEdit.quantity)
            });
          }
          if (newProduct) {
            await updateDoc(doc(db, 'products', newProduct.id), {
              warehouseStock: increment(-qty)
            });
          }
        }
      } else if (transactionToEdit.type === 'Stock Return') {
        const oldProduct = products.find(p => p.name === transactionToEdit.productName);
        const newProduct = products.find(p => p.name === editTxProductName);
        
        if (oldProduct && newProduct && oldProduct.id === newProduct.id) {
          const diff = qty - transactionToEdit.quantity;
          if (diff !== 0) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(diff)
            });
          }
        } else {
          if (oldProduct) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(-transactionToEdit.quantity)
            });
          }
          if (newProduct) {
            await updateDoc(doc(db, 'products', newProduct.id), {
              warehouseStock: increment(qty)
            });
          }
        }
      }

      await updateDoc(doc(db, 'transactions', transactionToEdit.id), cleanUndefined(updatedTransaction));
      setTransactionToEdit(null);
      setIsEditingTransaction(false);
    } catch (error) {
      console.error("Error updating transaction: ", error);
      alert("មានបញ្ហាក្នុងការកែប្រែទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleExportSingleInvoicePDF = (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("សូមអនុញ្ញាតឲ្យបើក Popups ដើម្បីបោះពុម្ពឬទាញយកជា PDF");
      return;
    }

    const d = new Date(invoice.date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const totalCost = invoice.items.reduce((sum: number, item: any) => {
      const qty = item.quantity || 0;
      const pr = item.price || 0;
      return sum + (qty * pr);
    }, 0);

    const itemsHtml = invoice.items.map((item: any) => {
      const subtotal = item.price !== undefined ? item.quantity * item.price : 0;
      const promoInfo = item.promoQty && item.promoQty > 0 ? `
        <div style="font-size: 11px; color: #10b981; font-weight: bold; margin-top: 2px;">
          ថែម: ${item.promoQty}
        </div>
      ` : '';

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 16px; text-align: left;">
            <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${item.productName}</div>
            ${promoInfo}
          </td>
          <td style="padding: 12px 16px; text-align: center; font-weight: 800; color: #059669; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 12px 16px; text-align: right; color: #475569; font-size: 13px;">$${item.price !== undefined ? item.price.toFixed(2) : '0.00'}</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #4f46e5; font-size: 13px;">$${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>វិក្កយបត្រ - ${invoice.customerName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Kantumruy+Pro:wght@400;500;700;900&display=swap');
            body {
              font-family: 'Kantumruy Pro', 'Inter', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-card {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 24px;
              padding: 40px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 24px;
              margin-bottom: 24px;
            }
            .title {
              font-size: 24px;
              font-weight: 900;
              color: #1e293b;
              margin: 0;
            }
            .date {
              font-size: 13px;
              color: #64748b;
              margin: 6px 0 0 0;
              font-weight: 500;
            }
            .info-grid {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 20px;
              border: 1px solid #e2e8f0;
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              align-items: center;
              font-size: 14px;
            }
            .info-label {
              width: 100px;
              color: #64748b;
              font-weight: 700;
            }
            .info-value {
              font-weight: 800;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f8fafc;
              color: #64748b;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 12px 16px;
              border-bottom: 2px solid #e2e8f0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background-color: #f5f3ff;
              border: 1px solid #ddd6fe;
              padding: 16px 24px;
              border-radius: 20px;
              font-weight: 700;
            }
            .total-label {
              color: #4c1d95;
              font-size: 15px;
              font-weight: 900;
            }
            .total-amount {
              color: #4f46e5;
              font-size: 22px;
              font-weight: 900;
            }
            .signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #64748b;
              border-top: 1px dashed #e2e8f0;
              padding-top: 30px;
              font-weight: 500;
            }
            .signature-block {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              margin-top: 50px;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
            }
            @media print {
              body {
                padding: 0;
                background-color: #ffffff;
              }
              .invoice-card {
                border: none;
                box-shadow: none;
                padding: 0;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="header">
              <div>
                <h1 class="title">វិក្កយបត្រលក់ចេញ</h1>
                <p class="date">កាលបរិច្ឆេទ: ${formattedDate}</p>
              </div>
              <div style="font-size: 32px;">🧾</div>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">អតិថិជន:</span>
                <span class="info-value" style="font-size: 15px;">${invoice.customerName}</span>
              </div>
              ${invoice.location ? `
                <div class="info-row" style="margin-top: 12px;">
                  <span class="info-label">ទីតាំង:</span>
                  <span class="info-value">${invoice.location}</span>
                </div>
              ` : ''}
            </div>

            <table>
              <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <tr>
                  <th style="text-align: left;">ទំនិញ</th>
                  <th style="text-align: center; width: 100px;">បរិមាណ</th>
                  <th style="text-align: right; width: 120px;">តម្លៃ</th>
                  <th style="text-align: right; width: 140px;">សរុបរង</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-row">
              <span class="total-label">តម្លៃសរុប (Grand Total)</span>
              <span class="total-amount">$${totalCost.toFixed(2)}</span>
            </div>
            
            <div class="signatures">
              <div class="signature-block">
                <div>អ្នកលក់ / Seller</div>
                <div class="signature-line">ហត្ថលេខា / Signature</div>
              </div>
              <div class="signature-block">
                <div>អ្នកទិញ / Buyer</div>
                <div class="signature-line">ហត្ថលេខា / Signature</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered transactions for Admin tab
  const filteredTransactions = transactions.filter(t => {
    const matchUser = filterTxUserId === 'all' || t.userId === filterTxUserId;
    
    const txDateStr = t.date ? t.date.split('T')[0] : '';
    const matchStart = !filterTxStartDate || txDateStr >= filterTxStartDate;
    const matchEnd = !filterTxEndDate || txDateStr <= filterTxEndDate;
    
    return matchUser && matchStart && matchEnd;
  });

  // Grouped transactions per product for Admin
  const txGroupedByProduct = (() => {
    const groupedMap: {
      [productName: string]: {
        productName: string;
        stockOut: number;
        stockSold: number;
        stockPromo: number;
        stockReturn: number;
      }
    } = {};

    // First populate with all active products in the system so we cover all products
    products.forEach(p => {
      groupedMap[p.name] = {
        productName: p.name,
        stockOut: 0,
        stockSold: 0,
        stockPromo: 0,
        stockReturn: 0
      };
    });

    // Process filtered transactions
    filteredTransactions.forEach(t => {
      if (!groupedMap[t.productName]) {
        groupedMap[t.productName] = {
          productName: t.productName,
          stockOut: 0,
          stockSold: 0,
          stockPromo: 0,
          stockReturn: 0
        };
      }
      
      const group = groupedMap[t.productName];
      if (t.type === 'Stock Out') {
        group.stockOut += t.quantity;
      } else if (t.type === 'Stock Sold') {
        group.stockSold += t.quantity;
        group.stockPromo += (t.promoQty || 0);
      } else if (t.type === 'Stock Return') {
        group.stockReturn += t.quantity;
      }
    });

    // Convert to array and filter out products with zero activity in the filtered range
    return Object.values(groupedMap)
      .filter(p => p.stockOut > 0 || p.stockSold > 0 || p.stockPromo > 0 || p.stockReturn > 0)
      .sort((a, b) => a.productName.localeCompare(b.productName));
  })();

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

  const groupedStockOrders = (() => {
    const groups: { [key: string]: StockOrder[] } = {};
    filteredStockOrders.forEach(o => {
      const parsedNote = getOrderCustomerAndLocation(o.note || '');
      const customer = parsedNote.customer.trim() || 'ទូទៅ';
      const location = parsedNote.location.trim();
      const dateDay = o.date ? o.date.split('T')[0] : '';
      const key = `${customer}-${location}-${dateDay}-${o.username}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(o);
    });

    return Object.entries(groups).map(([key, items]) => {
      const firstTx = items[0];
      const parsedNote = getOrderCustomerAndLocation(firstTx.note || '');
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      const isDelivered = firstTx.delivered;

      return {
        id: key,
        username: firstTx.username,
        userId: firstTx.userId,
        customerName: parsedNote.customer || firstTx.note || 'ទូទៅ',
        location: parsedNote.location || '',
        date: firstTx.date,
        quantity: totalQty,
        items: items,
        note: firstTx.note,
        delivered: isDelivered,
        deliveredAt: firstTx.deliveredAt,
        deliveredBy: firstTx.deliveredBy
      };
    });
  })();

  const sortedGroupedStockOrders = [...groupedStockOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalOrderItems = sortedGroupedStockOrders.length;
  const paginatedStockOrders = sortedGroupedStockOrders;

  return (
    <div className="w-full h-full flex flex-col min-w-0 overflow-hidden">
      {activeTab === 'users' && (
        <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-6 border-b border-slate-100 pb-2.5 sm:pb-4 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">បញ្ជីអ្នកប្រើប្រាស់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធ</p>
            </div>
            <button
              onClick={() => setIsCreateUserModalOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>បង្កើតអ្នកប្រើប្រាស់</span>
            </button>
          </div>
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
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
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-6 border-b border-slate-100 pb-2.5 sm:pb-4 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">បញ្ជីទំនិញ</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">គ្រប់គ្រងទំនិញ និងកម្មវិធីប្រម៉ូសិន</p>
            </div>
            <button
              onClick={() => setIsCreateProductModalOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>បន្ថែមទំនិញ</span>
            </button>
          </div>
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
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
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-6 border-b border-slate-100 pb-2.5 sm:pb-4 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ប្រតិបត្តិការទាំងអស់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">របាយការណ៍ផ្ទៀងផ្ទាត់ និងតុល្យភាពស្តុកទំនិញ</p>
            </div>
          </div>

          {/* Filters for Transactions */}
          <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3 bg-slate-50 p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
            {/* User Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">អ្នកប្រើប្រាស់</label>
              <select
                value={filterTxUserId}
                onChange={(e) => setFilterTxUserId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="all">ទាំងអស់</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>ចាប់ផ្តើម
              </label>
              <input
                type="date"
                value={filterTxStartDate}
                onChange={(e) => setFilterTxStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              />
            </div>

            {/* End Date Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>បញ្ចប់
              </label>
              <input
                type="date"
                value={filterTxEndDate}
                onChange={(e) => setFilterTxEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                  <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-rose-500">ស្តុកឡើង</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-emerald-600">ស្តុកលក់</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-amber-500">ស្តុកថែម</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-indigo-600">ស្តុកត្រឡប់</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-600">បញ្ជាក់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                {txGroupedByProduct.map(p => {
                  const diff = p.stockOut - (p.stockSold + p.stockPromo + p.stockReturn);
                  let badge = null;
                  if (diff === 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-600 rounded-lg">ត្រឹមត្រូវ</span>;
                  } else if (diff > 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-rose-50 text-rose-600 rounded-lg">បាត់ ({diff})</span>;
                  } else {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-amber-50 text-amber-600 rounded-lg">លើស ({Math.abs(diff)})</span>;
                  }

                  return (
                    <tr 
                      key={p.productName} 
                      className="hover:bg-slate-50/70 transition-all border-b border-slate-100"
                    >
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-bold text-slate-800">
                        {p.productName}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-black text-xs sm:text-sm md:text-base text-rose-500">
                        {p.stockOut || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-black text-xs sm:text-sm md:text-base text-emerald-600">
                        {p.stockSold || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-black text-xs sm:text-sm md:text-base text-amber-500">
                        {p.stockPromo || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-black text-xs sm:text-sm md:text-base text-indigo-600">
                        {p.stockReturn || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center">
                        {badge}
                      </td>
                    </tr>
                  )
                })}
                {txGroupedByProduct.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">គ្មានប្រតិបត្តិការទេ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stockOut' && (() => {
        const outTxs = filteredTransactions
          .filter(t => t.type === 'Stock Out')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const totalOutQty = outTxs.reduce((sum, t) => sum + t.quantity, 0);

        // Group transactions by User + Customer/Note + Location + Date to form grouped invoices like User side
        const outGroups: { [key: string]: Transaction[] } = {};
        outTxs.forEach(t => {
          const parsedNote = getOrderCustomerAndLocation(t.note || '');
          const customer = parsedNote.customer.trim() || 'ទូទៅ';
          const location = parsedNote.location.trim();
          const dateDay = t.date ? t.date.split('T')[0] : '';
          const key = `${t.userId}-${customer}-${location}-${dateDay}`;
          if (!outGroups[key]) {
            outGroups[key] = [];
          }
          outGroups[key].push(t);
        });

        const sortedOutInvoices = Object.entries(outGroups).map(([key, items]) => {
          const firstTx = items[0];
          const parsedNote = getOrderCustomerAndLocation(firstTx.note || '');
          const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
          return {
            id: key,
            userId: firstTx.userId,
            customerName: parsedNote.customer || firstTx.note || 'ទូទៅ',
            location: parsedNote.location || '',
            date: firstTx.date,
            quantity: totalQty,
            items: items,
            note: firstTx.note
          };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកឡើងឡានរបស់ User</h3>
                <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">តាមដានរាល់ទិន្នន័យឡើងឡានរបស់ភ្នាក់ងារលក់</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              <div className="bg-rose-50/50 border border-rose-100/50 p-2.5 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-black text-slate-500">សរុបឡើងឡាន</span>
                <span className="text-sm sm:text-2xl font-black text-rose-600 mt-0.5">{totalOutQty}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-black text-slate-500 font-bold">ប្រតិបត្តិការសរុប</span>
                <span className="text-sm sm:text-2xl font-black text-slate-800 mt-0.5">{sortedOutInvoices.length} វិក្កយបត្រ</span>
              </div>
            </div>

            {/* Shared Filters */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3 bg-slate-50 p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">អ្នកប្រើប្រាស់</label>
                <select
                  value={filterTxUserId}
                  onChange={(e) => setFilterTxUserId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="all">ទាំងអស់</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                  <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>ចាប់ផ្តើម
                </label>
                <input
                  type="date"
                  value={filterTxStartDate}
                  onChange={(e) => setFilterTxStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                  <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>បញ្ចប់
                </label>
                <input
                  type="date"
                  value={filterTxEndDate}
                  onChange={(e) => setFilterTxEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Grouped Table Layout (Matching User design exactly) */}
            <div className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អ្នកប្រើប្រាស់</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អ្នកប្រគល់</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ទីតាំង</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-rose-600">ទំនិញ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-rose-600">បរិមាណ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {sortedOutInvoices.map(inv => {
                    const user = users.find(u => u.id === inv.userId);
                    return (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoiceDetail(inv)}
                        className="hover:bg-slate-50/70 transition-all border-b border-slate-100 cursor-pointer"
                        title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
                      >
                        {/* Column 1: Salesperson / User */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-black text-indigo-900 text-[11px] sm:text-xs md:text-sm">
                          {user?.username || 'Unknown'}
                        </td>
                        {/* Column 2: Customer / Note Name */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                          {inv.customerName}
                        </td>
                        {/* Column 3: Location */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left">
                          {inv.location ? (
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                              {inv.location}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                        {/* Column 4: Date */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium text-slate-500 whitespace-nowrap">
                          {(() => {
                            const d = new Date(inv.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const shortYear = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${shortYear}`;
                          })()}
                        </td>
                        {/* Column 5: Product list stacked */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-medium text-slate-700">
                          <div className="flex flex-col space-y-1.5">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                                {item.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* Column 6: Quantity list stacked */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium">
                          <div className="flex flex-col space-y-1.5 items-center">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center justify-center">
                                <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap">
                                  {item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedOutInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">គ្មានទិន្នន័យឡើងឡានទេ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {activeTab === 'stockSold' && (() => {
        const soldTxs = filteredTransactions
          .filter(t => t.type === 'Stock Sold')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const totalSoldQty = soldTxs.reduce((sum, t) => sum + t.quantity, 0);
        const totalPromoQty = soldTxs.reduce((sum, t) => sum + (t.promoQty || 0), 0);

        // Group transactions by User + Customer/Note + Location + Date to form grouped invoices like User side
        const soldGroups: { [key: string]: Transaction[] } = {};
        soldTxs.forEach(t => {
          const parsedNote = getOrderCustomerAndLocation(t.note || '');
          const customer = parsedNote.customer.trim() || 'ទូទៅ';
          const location = parsedNote.location.trim();
          const dateDay = t.date ? t.date.split('T')[0] : '';
          const key = `${t.userId}-${customer}-${location}-${dateDay}`;
          if (!soldGroups[key]) {
            soldGroups[key] = [];
          }
          soldGroups[key].push(t);
        });

        const sortedSoldInvoices = Object.entries(soldGroups).map(([key, items]) => {
          const firstTx = items[0];
          const parsedNote = getOrderCustomerAndLocation(firstTx.note || '');
          const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
          return {
            id: key,
            userId: firstTx.userId,
            customerName: parsedNote.customer || firstTx.note || 'ទូទៅ',
            location: parsedNote.location || '',
            date: firstTx.date,
            quantity: totalQty,
            items: items,
            note: firstTx.note
          };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកលក់ចេញរបស់ User</h3>
                <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">តាមដានរាល់ទិន្នន័យលក់ចេញ និងការថែមជូនប្រម៉ូសិនរបស់ភ្នាក់ងារលក់</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
              <div className="bg-emerald-50/50 border border-emerald-100/50 p-2 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] sm:text-xs font-black text-slate-500 truncate">សរុបលក់ចេញ</span>
                <span className="text-xs sm:text-2xl font-black text-emerald-600 mt-0.5">{totalSoldQty}</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100/50 p-2 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] sm:text-xs font-black text-slate-500 truncate">សរុបថែម</span>
                <span className="text-xs sm:text-2xl font-black text-amber-500 mt-0.5">{totalPromoQty}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] sm:text-xs font-black text-slate-500 font-bold truncate">ប្រតិបត្តិការ</span>
                <span className="text-xs sm:text-2xl font-black text-slate-800 mt-0.5">{sortedSoldInvoices.length} វិក្កយបត្រ</span>
              </div>
            </div>

            {/* Shared Filters */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3 bg-slate-50 p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">អ្នកប្រើប្រាស់</label>
                <select
                  value={filterTxUserId}
                  onChange={(e) => setFilterTxUserId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="all">ទាំងអស់</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                  <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>ចាប់ផ្តើម
                </label>
                <input
                  type="date"
                  value={filterTxStartDate}
                  onChange={(e) => setFilterTxStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                  <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>បញ្ចប់
                </label>
                <input
                  type="date"
                  value={filterTxEndDate}
                  onChange={(e) => setFilterTxEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Grouped Table Layout (Matching User design exactly) */}
            <div className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អ្នកប្រើប្រាស់</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អតិថិជន</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ទីតាំង</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-emerald-600">ទំនិញ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-emerald-600">បរិមាណ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {sortedSoldInvoices.map(inv => {
                    const user = users.find(u => u.id === inv.userId);
                    return (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoiceDetail(inv)}
                        className="hover:bg-slate-50/70 transition-all border-b border-slate-100 cursor-pointer"
                        title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
                      >
                        {/* Column 1: Salesperson / User */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-black text-indigo-900 text-[11px] sm:text-xs md:text-sm">
                          {user?.username || 'Unknown'}
                        </td>
                        {/* Column 2: Customer / Note Name */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                          {inv.customerName}
                        </td>
                        {/* Column 3: Location */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left">
                          {inv.location ? (
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                              {inv.location}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                        {/* Column 4: Date */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium text-slate-500 whitespace-nowrap">
                          {(() => {
                            const d = new Date(inv.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const shortYear = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${shortYear}`;
                          })()}
                        </td>
                        {/* Column 5: Product list stacked */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-medium text-slate-700">
                          <div className="flex flex-col space-y-1.5">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                                {item.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* Column 6: Quantity list stacked */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium">
                          <div className="flex flex-col space-y-1.5 items-center">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center justify-center">
                                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap">
                                  {item.quantity}
                                  {item.promoQty && item.promoQty > 0 ? (
                                    <span className="text-amber-500 ml-1 font-bold">+{item.promoQty}</span>
                                  ) : null}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedSoldInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">គ្មានទិន្នន័យលក់ចេញទេ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {activeTab === 'stockReturn' && (() => {
        const returnTxs = filteredTransactions
          .filter(t => t.type === 'Stock Return')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const totalReturnQty = returnTxs.reduce((sum, t) => sum + t.quantity, 0);

        // Group transactions by User + Customer/Note + Location + Date to form grouped invoices like User side
        const returnGroups: { [key: string]: Transaction[] } = {};
        returnTxs.forEach(t => {
          const parsedNote = getOrderCustomerAndLocation(t.note || '');
          const customer = parsedNote.customer.trim() || 'ទូទៅ';
          const location = parsedNote.location.trim();
          const dateDay = t.date ? t.date.split('T')[0] : '';
          const key = `${t.userId}-${customer}-${location}-${dateDay}`;
          if (!returnGroups[key]) {
            returnGroups[key] = [];
          }
          returnGroups[key].push(t);
        });

        const sortedReturnInvoices = Object.entries(returnGroups).map(([key, items]) => {
          const firstTx = items[0];
          const parsedNote = getOrderCustomerAndLocation(firstTx.note || '');
          const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
          return {
            id: key,
            userId: firstTx.userId,
            customerName: parsedNote.customer || firstTx.note || 'ទូទៅ',
            location: parsedNote.location || '',
            date: firstTx.date,
            quantity: totalQty,
            items: items,
            note: firstTx.note
          };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកត្រឡប់របស់ User</h3>
                <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">តាមដានរាល់ទិន្នន័យត្រឡប់របស់ភ្នាក់ងារលក់</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              <div className="bg-indigo-50/50 border border-indigo-100/50 p-2.5 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-black text-slate-500">សរុបត្រឡប់</span>
                <span className="text-sm sm:text-2xl font-black text-indigo-600 mt-0.5">{totalReturnQty}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-black text-slate-500 font-bold">ប្រតិបត្តិការសរុប</span>
                <span className="text-sm sm:text-2xl font-black text-slate-800 mt-0.5">{sortedReturnInvoices.length} វិក្កយបត្រ</span>
              </div>
            </div>

            {/* Shared Filters */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3 bg-slate-50 p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">អ្នកប្រើប្រាស់</label>
                <select
                  value={filterTxUserId}
                  onChange={(e) => setFilterTxUserId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="all">ទាំងអស់</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                  <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>ចាប់ផ្តើម
                </label>
                <input
                  type="date"
                  value={filterTxStartDate}
                  onChange={(e) => setFilterTxStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                  <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>បញ្ចប់
                </label>
                <input
                  type="date"
                  value={filterTxEndDate}
                  onChange={(e) => setFilterTxEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Grouped Table Layout (Matching User design exactly) */}
            <div className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អ្នកប្រើប្រាស់</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អ្នកទទួល</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ទីតាំង</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-indigo-600">ទំនិញ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-indigo-600">បរិមាណ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {sortedReturnInvoices.map(inv => {
                    const user = users.find(u => u.id === inv.userId);
                    return (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoiceDetail(inv)}
                        className="hover:bg-slate-50/70 transition-all border-b border-slate-100 cursor-pointer"
                        title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
                      >
                        {/* Column 1: Salesperson / User */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-black text-indigo-900 text-[11px] sm:text-xs md:text-sm">
                          {user?.username || 'Unknown'}
                        </td>
                        {/* Column 2: Customer / Note Name */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                          {inv.customerName}
                        </td>
                        {/* Column 3: Location */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left">
                          {inv.location ? (
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                              {inv.location}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                        {/* Column 4: Date */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium text-slate-500 whitespace-nowrap">
                          {(() => {
                            const d = new Date(inv.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const shortYear = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${shortYear}`;
                          })()}
                        </td>
                        {/* Column 5: Product list stacked */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-medium text-slate-700">
                          <div className="flex flex-col space-y-1.5">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                                {item.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* Column 6: Quantity list stacked */}
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium">
                          <div className="flex flex-col space-y-1.5 items-center">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center justify-center">
                                <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap">
                                  {item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedReturnInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">គ្មានទិន្នន័យត្រឡប់ទេ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {activeTab === 'stockOrders' && (
        <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-6 border-b border-slate-100 pb-2.5 sm:pb-4 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកកម្មង់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">ការកម្មង់សរុប៖ {totalOrderItems} ជួរ</p>
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

          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                  <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អ្នកកម្មង់</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អតិថិជន</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ទីតាំង</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-emerald-600">ទំនិញ</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-emerald-600">បរិមាណ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                {paginatedStockOrders.map((orderGroup: any) => {
                  return (
                    <tr 
                      key={orderGroup.id} 
                      onClick={() => setSelectedOrderDetail(orderGroup)}
                      className={`${orderGroup.delivered ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-amber-50/50 hover:bg-amber-50'} transition-all cursor-pointer group`}
                      title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
                    >
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                        {orderGroup.username}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-bold text-slate-700 text-[11px] sm:text-xs md:text-sm">
                        {orderGroup.customerName || <span className="text-slate-300">គ្មានឈ្មោះ</span>}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left">
                        {orderGroup.location ? (
                          <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                            {orderGroup.location}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span className="font-medium text-slate-500">
                            {(() => {
                              const d = new Date(orderGroup.date);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const shortYear = String(d.getFullYear()).slice(-2);
                              return `${day}/${month}/${shortYear}`;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left font-medium text-slate-700">
                        <div className="flex flex-col space-y-1.5">
                          {orderGroup.items.map((item: any, idx: number) => (
                            <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                              {item.productName}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium">
                        <div className="flex flex-col space-y-1.5 items-center">
                          {orderGroup.items.map((item: any, idx: number) => (
                            <div key={idx} className="h-6 flex items-center justify-center">
                              <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap">
                                {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedStockOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center text-slate-400 font-bold">
                      គ្មានទិន្នន័យស្តុកកម្មង់ទេ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


        </div>
      )}

      {activeTab === 'warehouse' && (
        <div className="bg-white rounded-t-3xl md:rounded-3xl border-b-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-3.5 sm:p-5 md:p-6 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកឃ្លាំង (Warehouse Stock)</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">គ្រប់គ្រងចំនួនស្តុកប្រព័ន្ធ ផ្ទៀងផ្ទាត់ស្តុកជាក់ស្តែង និងបញ្ចូលស្តុកថ្មី</p>
            </div>
          </div>

          {/* Metrics Dashboard Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 shrink-0">
            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">មុខទំនិញសរុប</p>
                <h4 className="text-sm sm:text-base font-black text-slate-700">{products.length} មុខ</h4>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ស្តុកប្រព័ន្ធសរុប</p>
                <h4 className="text-sm sm:text-base font-black text-sky-600">
                  {products.reduce((acc, p) => acc + (p.warehouseStock || 0), 0).toLocaleString()} ឯកតា
                </h4>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ស្តុកជាក់ស្តែងសរុប</p>
                <h4 className="text-sm sm:text-base font-black text-emerald-600">
                  {products.reduce((acc, p) => acc + (p.actualStock !== undefined ? p.actualStock : 0), 0).toLocaleString()} ឯកតា
                </h4>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ចំនួនលម្អៀង</p>
                <h4 className="text-sm sm:text-base font-black text-amber-600">
                  {products.filter(p => p.actualStock !== undefined && p.actualStock !== (p.warehouseStock || 0)).length} មុខ
                </h4>
              </div>
            </div>
          </div>

          {/* Search bar and Stock In Button */}
          <div className="mb-4 flex gap-3 shrink-0 items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="ស្វែងរកទំនិញក្នុងឃ្លាំង..."
                value={warehouseSearchQuery}
                onChange={(e) => setWarehouseSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsStockInHistoryOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-black px-4 py-3 rounded-2xl shadow-sm active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ប្រវត្តិស្តុកចូល</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStockInDate(() => {
                  const today = new Date();
                  const yyyy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const dd = String(today.getDate()).padStart(2, '0');
                  return `${yyyy}-${mm}-${dd}`;
                });
                setStockInDeliverer('Admin');
                setStockInItems([]);
                setIsStockInModalOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-black px-4 py-3 rounded-2xl shadow-md shadow-sky-600/10 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>ស្តុកចូល</span>
            </button>
          </div>

          {/* Table Container */}
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                  <th className="px-2 md:px-4 py-3 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                  <th className="px-2 md:px-4 py-3 text-center font-bold text-sky-600 bg-sky-50/10">ស្តុកប្រព័ន្ធ (System)</th>
                  <th className="px-2 md:px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/10">ស្តុកជាក់ស្តែង (Actual)</th>
                  <th className="px-2 md:px-4 py-3 text-center font-bold text-slate-500">កម្រិតលម្អៀង (Variance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                {filteredWarehouseProducts.map(product => {
                  const sysStock = product.warehouseStock || 0;
                  const actStock = product.actualStock;
                  const hasTake = actStock !== undefined;
                  const variance = hasTake ? actStock - sysStock : 0;
                  const draftVal = actualStockDrafts[product.id];
                  const isDirty = draftVal !== undefined && draftVal !== String(actStock ?? '');

                  return (
                    <tr 
                      key={product.id} 
                      onClick={() => {
                        setProductToEditWarehouseStock(product);
                        setEditWarehouseStockVal(String(sysStock));
                        setIsEditWarehouseStockModalOpen(true);
                      }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-2 md:px-4 py-3">
                        <div className="font-bold text-slate-800">{product.name}</div>
                        {product.lastStockTake && (
                          <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                            ផ្ទៀងផ្ទាត់ចុងក្រោយ៖ {new Date(product.lastStockTake).toLocaleDateString('kh-KH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="px-2 md:px-4 py-3 text-center font-black text-sky-600 bg-sky-50/5">
                        {sysStock.toLocaleString()}
                      </td>
                      <td className="px-2 md:px-4 py-3 bg-emerald-50/5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1.5 max-w-[150px] mx-auto">
                          <input
                            type="number"
                            min="0"
                            placeholder="បញ្ចូលចំនួន..."
                            value={draftVal !== undefined ? draftVal : (actStock !== undefined ? String(actStock) : '')}
                            onChange={(e) => setActualStockDrafts({
                              ...actualStockDrafts,
                              [product.id]: e.target.value
                            })}
                            className="w-16 sm:w-20 text-center py-1 px-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-black text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveActualStock(product)}
                            disabled={!isDirty || loading}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                              isDirty 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm scale-105' 
                                : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                            }`}
                            title="កត់ត្រាស្តុកជាក់ស្តែង"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 text-center font-bold">
                        {hasTake ? (
                          variance === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                              ត្រូវគ្នា (0)
                            </span>
                          ) : variance < 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100">
                              ខ្វះឃ្លាំង ({variance.toLocaleString()})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                              លើសឃ្លាំង (+{variance.toLocaleString()})
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px] sm:text-xs">មិនទាន់ផ្ទៀងផ្ទាត់</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredWarehouseProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center text-slate-400 font-bold">
                      {products.length === 0 ? "មិនទាន់មានទំនិញនៅក្នុងប្រព័ន្ធទេ" : "រកមិនឃើញទំនិញដែលស្វែងរកឡើយ"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {isStockInModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl max-h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">បញ្ចូលស្តុកចូល (Stock In)</h3>
                <p className="text-xs text-slate-500 font-medium">សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួនស្តុកបន្ថែម</p>
              </div>
              <button 
                onClick={() => {
                  setIsStockInModalOpen(false);
                  setStockInItems([]);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveStockIn} className="flex flex-col min-h-0">
              <div className="overflow-y-auto p-6 pt-4 custom-scroll space-y-4">
                {/* Meta Inputs (Date & Deliverer) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                    <input
                      type="date"
                      value={stockInDate}
                      onChange={e => setStockInDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-sky-400 outline-none font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">អ្នកប្រគល់ស្តុក</label>
                    <input
                      type="text"
                      value={stockInDeliverer}
                      onChange={e => setStockInDeliverer(e.target.value)}
                      placeholder="ឈ្មោះ..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-sky-400 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Multi-Stock List Selection */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">
                      ជ្រើសរើសទំនិញ
                    </label>
                    <div className="relative">
                      <select
                        onChange={handleProductSelectToStockIn}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-sky-400 outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                        value=""
                      >
                        <option value="" disabled>-- ជ្រើសរើសទំនិញដើម្បីបញ្ចូលស្តុក --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* List Rows */}
                  <div className="space-y-1.5">
                    {stockInItems.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-2xl py-8 px-4 text-center text-xs text-slate-400 font-bold bg-slate-50/30">
                        📦 សូមជ្រើសរើសទំនិញខាងលើ ដើម្បីបន្ថែមចូលក្នុងបញ្ជីបញ្ចូលស្តុក
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-2xl bg-slate-50/30 p-2 sm:p-3 space-y-1">
                        {/* Column Headers */}
                        <div className="grid grid-cols-12 gap-2 px-2 pb-2 border-b border-slate-200 text-[10px] font-bold text-slate-400">
                          <div className="col-span-8">ទំនិញ</div>
                          <div className="col-span-3 text-center">បរិមាណ</div>
                          <div className="col-span-1"></div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 custom-scroll">
                          {stockInItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 py-2 items-center px-2 hover:bg-slate-50 rounded-lg transition animate-in fade-in duration-150">
                              {/* Product Name */}
                              <div className="col-span-8 flex flex-col min-w-0">
                                <span className="font-bold text-slate-800 text-xs truncate" title={item.productName}>
                                  {item.productName}
                                </span>
                              </div>

                              {/* Quantity Input */}
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={e => updateStockInRow(index, 'quantity', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-center text-xs focus:border-sky-400 outline-none font-bold text-slate-800"
                                  required
                                  min="1"
                                  placeholder="ចំនួន"
                                />
                              </div>

                              {/* Delete button */}
                              <div className="col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeStockInRow(index)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer flex justify-end w-full"
                                  title="លុបចោល"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center space-x-3 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockInModalOpen(false);
                    setStockInItems([]);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer animate-in duration-100"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading || stockInItems.length === 0}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-sky-600/30 transition disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Warehouse Stock Modal */}
      {isEditWarehouseStockModalOpen && productToEditWarehouseStock && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">កែប្រែស្តុកឃ្លាំង (Edit Warehouse Stock)</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">កែប្រែចំនួនស្តុកប្រព័ន្ធសម្រាប់ទំនិញ <span className="font-bold text-slate-800">"{productToEditWarehouseStock.name}"</span></p>

            <form onSubmit={handleSaveWarehouseStock} className="space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">ស្តុកប្រព័ន្ធបច្ចុប្បន្ន (System Stock)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="ឧ. ១០០"
                  value={editWarehouseStockVal}
                  onChange={(e) => setEditWarehouseStockVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-black"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditWarehouseStockModalOpen(false);
                    setProductToEditWarehouseStock(null);
                    setEditWarehouseStockVal('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hover:bg-sky-700 bg-sky-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-sky-600/30 transition disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
                    <span className="text-xs font-bold text-slate-400 font-black">ឈ្មោះអតិថិជន</span>
                    <span className="col-span-2 text-sm font-bold text-slate-800">
                      {selectedOrderDetail.customerName || <span className="text-slate-300">គ្មានឈ្មោះ</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <span className="text-xs font-bold text-slate-400 font-black">ទីតាំង</span>
                    <span className="col-span-2 text-sm font-bold text-slate-800">
                      {selectedOrderDetail.location || <span className="text-slate-300 font-bold">-</span>}
                    </span>
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
                        <span className="text-xs font-bold text-slate-400 font-black">ប្រគល់នៅ</span>
                        <span className="col-span-2 text-xs font-medium text-slate-500">
                          {selectedOrderDetail.deliveredAt ? new Date(selectedOrderDetail.deliveredAt).toLocaleString('kh-KH') : '-'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-start">
                        <span className="text-xs font-bold text-slate-400 font-black">ប្រគល់ដោយ</span>
                        <span className="col-span-2 text-xs font-bold text-slate-700">
                          {selectedOrderDetail.deliveredBy || '-'}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    <table className="w-full text-left">
                      <thead className="bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] border-b border-slate-100">
                        <tr className="text-slate-500 text-[10px] uppercase font-bold">
                          <th className="px-3 py-2 text-left">ទំនិញ</th>
                          <th className="px-3 py-2 text-right">បរិមាណ</th>
                          <th className="px-3 py-2 text-center w-24">សកម្មភាព</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {selectedOrderDetail.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-left">{item.productName}</td>
                            <td className="px-3 py-2 text-right text-emerald-600">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setOrderToEdit(item);
                                    setEditOrderUserId(item.userId);
                                    setEditOrderProductName(item.productName);
                                    setEditOrderQuantity(String(item.quantity));
                                    setEditOrderDate(item.date);
                                    const { customer, location } = getOrderCustomerAndLocation(item.note || '');
                                    setEditOrderCustomerName(customer);
                                    setEditOrderLocation(location);
                                    setEditOrderDelivered(item.delivered);
                                    setIsEditingOrder(true);
                                  }}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                  title="កែប្រែ"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    setOrderToDelete(item);
                                    setSelectedOrderDetail(null);
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="លុប"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/70 border-t border-slate-200">
                          <td className="px-3 py-2 font-black text-slate-800 text-right">សរុប</td>
                          <td className="px-3 py-2 font-black text-indigo-600 text-right" colSpan={2}>
                            {selectedOrderDetail.quantity}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-5 border-t border-slate-100 mt-6">
                  {!selectedOrderDetail.delivered ? (
                    <button
                      onClick={() => handleAdminConfirmDelivery(selectedOrderDetail)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm py-3 rounded-2xl shadow-md shadow-emerald-600/10 active:scale-95 transition cursor-pointer"
                    >
                      បញ្ជាក់ការប្រគល់ទាំងអស់
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdminUnconfirmDelivery(selectedOrderDetail)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-3 rounded-2xl active:scale-95 transition cursor-pointer"
                    >
                      ដាក់ថា «មិនទាន់ប្រគល់» ទាំងអស់
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Floating Modal for Grouped Invoice Details (Admin side matching User side exactly) */}
      {selectedInvoiceDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🧾</span>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800">
                    {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'វិក្កយបត្រលក់ចេញ' : 
                     selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'កំណត់ត្រាឡើងឡាន' : 'កំណត់ត្រាស្តុកត្រឡប់'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {(() => {
                      const d = new Date(selectedInvoiceDetail.date);
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      return `កាលបរិច្ឆេទ: ${day}/${month}/${year}`;
                    })()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoiceDetail(null)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Customer Info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-slate-400">
                    {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'អតិថិជន' : 
                     selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'អ្នកប្រគល់' : 'អ្នកទទួល'}
                  </span>
                  <span className="col-span-2 text-sm font-black text-slate-800">{selectedInvoiceDetail.customerName}</span>
                </div>
                {selectedInvoiceDetail.location && (
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    <span className="text-xs font-bold text-slate-400">ទីតាំង</span>
                    <span className="col-span-2 text-xs font-semibold text-slate-600">{selectedInvoiceDetail.location}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  <span className="text-xs font-bold text-slate-400">អ្នកលក់</span>
                  <span className="col-span-2 text-xs font-bold text-indigo-600">
                    {users.find(u => u.id === selectedInvoiceDetail.userId)?.username || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">បញ្ជីទំនិញ (ចុចលើទំនិញដើម្បី កែប្រែ ឬលុប)</h4>
                <div className="border border-slate-100 rounded-2xl bg-slate-50/30 p-2 sm:p-3 space-y-1">
                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-2 px-2 pb-2 border-b border-slate-200 text-[10px] font-bold text-slate-400">
                    <div className={selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-4" : "col-span-8"}>ទំនិញ</div>
                    <div className={selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-2 text-center" : "col-span-4 text-center"}>បរិមាណ</div>
                    {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' && (
                      <>
                        <div className="col-span-3 text-right">តម្លៃ</div>
                        <div className="col-span-3 text-right">សរុបរង</div>
                      </>
                    )}
                  </div>

                  {/* List Rows */}
                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1 custom-scroll">
                    {selectedInvoiceDetail.items.map((item: Transaction) => {
                      const subtotal = item.price !== undefined ? item.quantity * item.price : 0;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedRowItem(item)}
                          className="grid grid-cols-12 gap-2 py-2.5 items-center px-2 hover:bg-slate-100 rounded-lg transition animate-in fade-in duration-150 cursor-pointer"
                        >
                          {/* Product Name */}
                          <div className={`${selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-4" : "col-span-8"} flex flex-col min-w-0`}>
                            <span className="font-bold text-slate-800 text-xs truncate" title={item.productName}>
                              {item.productName}
                            </span>
                            {item.promoQty && item.promoQty > 0 ? (
                              <span className="text-[9px] font-black text-emerald-600 animate-pulse mt-0.5">
                                ថែម: {item.promoQty}
                              </span>
                            ) : null}
                          </div>

                          {/* Quantity */}
                          <div className={`${selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-2" : "col-span-4"} text-center`}>
                            <span className={`font-black text-xs ${
                                selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'text-emerald-600' : 
                                selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'text-rose-600' : 'text-amber-600'
                              }`}>
                              {item.quantity}
                            </span>
                          </div>

                          {/* Price and Subtotal */}
                          {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' && (
                            <>
                              <div className="col-span-3 text-right">
                                <span className="font-semibold text-xs text-slate-600">
                                  {item.price !== undefined ? `$${item.price.toFixed(2)}` : '-'}
                                </span>
                              </div>
                              <div className="col-span-3 text-right">
                                <span className="font-black text-xs text-indigo-600">
                                  {item.price !== undefined ? `$${subtotal.toFixed(2)}` : '-'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Total Price */}
              {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' && (() => {
                const totalCost = selectedInvoiceDetail.items.reduce((sum: number, item: any) => {
                  const qty = item.quantity || 0;
                  const pr = item.price || 0;
                  return sum + (qty * pr);
                }, 0);
                return (
                  <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl">
                    <span className="text-xs font-black text-indigo-800">តម្លៃសរុប</span>
                    <span className="text-base font-black text-indigo-600">${totalCost.toFixed(2)}</span>
                  </div>
                );
              })()}
            </div>

            <div className="pt-4 border-t border-slate-100 flex space-x-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setInvoiceToDelete(selectedInvoiceDetail)}
                className="flex-1 hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold text-[10px] sm:text-xs py-2.5 rounded-2xl transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>លុបវិក្កយបត្រទាំងមូល</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportSingleInvoicePDF(selectedInvoiceDetail)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>បោះពុម្ពជា PDF</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedRowItem && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="text-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-800">សកម្មភាពលើទំនិញ</h4>
              <p className="text-xs text-indigo-600 font-bold mt-1">{selectedRowItem.productName}</p>
            </div>
            <div className="py-4 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const item = selectedRowItem;
                  setSelectedRowItem(null);
                  setSelectedInvoiceDetail(null);
                  handleEditTransactionClick(item);
                }}
                className="w-full hover:bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>កែប្រែ (Edit)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = selectedRowItem;
                  setSelectedRowItem(null);
                  setSelectedInvoiceDetail(null);
                  setTransactionToDelete(item);
                }}
                className="w-full hover:bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>លុប (Delete)</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRowItem(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-2xl transition cursor-pointer"
            >
              បិទ (Close)
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal for Deleting Entire Invoice */}
      {invoiceToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុបវិក្កយបត្រ</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបវិក្កយបត្ររបស់អតិថិជន <span className="font-bold text-slate-800">"{invoiceToDelete.customerName}"</span> នេះទាំងស្រុងមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await Promise.all(invoiceToDelete.items.map(async (item: any) => {
                      const product = products.find(p => p.name === item.productName);
                      if (product) {
                        if (item.type === 'Stock Out') {
                          await updateDoc(doc(db, 'products', product.id), {
                            warehouseStock: increment(item.quantity)
                          });
                        } else if (item.type === 'Stock Return') {
                          await updateDoc(doc(db, 'products', product.id), {
                            warehouseStock: increment(-item.quantity)
                          });
                        }
                      }
                    }));

                    await Promise.all(invoiceToDelete.items.map((item: any) => deleteDoc(doc(db, 'transactions', item.id))));
                    setInvoiceToDelete(null);
                    setSelectedInvoiceDetail(null);
                  } catch (error) {
                    console.error("Error deleting invoice: ", error);
                    alert("មានបញ្ហាក្នុងការលុបវិក្កយបត្រ");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex-1 hover:bg-rose-700 bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Modal for Editing Transaction */}
      {transactionToEdit && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md max-h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  កែប្រែប្រតិបត្តិការ {transactionToEdit.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : transactionToEdit.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">កែប្រែព័ត៌មានខាងក្រោមដើម្បីរក្សាទុក</p>
              </div>
              <button 
                onClick={() => setTransactionToEdit(null)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateTransaction} className="flex flex-col min-h-0">
              <div className="overflow-y-auto p-6 pt-4 custom-scroll space-y-4">
                {/* Date selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                  <input
                    type="date"
                    value={editTxDate}
                    onChange={e => setEditTxDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                    required
                  />
                </div>

                {/* Product selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">មុខទំនិញ</label>
                  <div className="relative">
                    <select
                      value={editTxProductName}
                      onChange={e => setEditTxProductName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>-- ជ្រើសរើសទំនិញ --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំនួនទំនិញ</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={e => setEditQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-black text-slate-800"
                    required
                    min="1"
                    placeholder="ចំនួន"
                  />
                </div>

                {/* Price Input (Only for Stock Sold) */}
                {transactionToEdit.type === 'Stock Sold' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តម្លៃឯកតា ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editTxPrice}
                      onChange={e => setEditTxPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-black text-slate-800"
                      required
                      min="0"
                      placeholder="តម្លៃឯកតា"
                    />
                  </div>
                )}

                {/* Customer Name & Location (Only for Stock Sold) */}
                {transactionToEdit.type === 'Stock Sold' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអតិថិជន</label>
                      <input
                        type="text"
                        value={editTxCustomerName}
                        onChange={e => setEditTxCustomerName(e.target.value)}
                        placeholder="ឈ្មោះអតិថិជន..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ទីតាំង</label>
                      <input
                        type="text"
                        value={editTxLocation}
                        onChange={e => setEditTxLocation(e.target.value)}
                        placeholder="ទីតាំង..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Note (For non-Stock Sold transactions) */}
                {transactionToEdit.type !== 'Stock Sold' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំណាំ (ឈ្មោះអ្នកប្រគល់/ទទួល)</label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      placeholder="ឈ្មោះ..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="p-6 pt-4 border-t border-slate-100 flex space-x-3 shrink-0 bg-white rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setTransactionToEdit(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isStockInHistoryOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">ប្រវត្តិស្តុកចូល (Stock In History)</h3>
                <p className="text-xs text-slate-500 font-medium">បញ្ជីរាយនាមនៃការបញ្ចូលស្តុកថ្មីចូលក្នុងឃ្លាំង</p>
              </div>
              <button 
                onClick={() => setIsStockInHistoryOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 pt-4 custom-scroll space-y-4 flex-1">
              {warehouseStockIns.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold">
                  គ្មានប្រវត្តិស្តុកចូលឡើយ
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto custom-scroll">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] sm:text-xs font-bold border-b border-slate-100">
                          <th className="px-4 py-3">កាលបរិច្ឆេទ</th>
                          <th className="px-4 py-3">ឈ្មោះអ្នកប្រគល់</th>
                          <th className="px-4 py-3">ឈ្មោះទំនិញ</th>
                          <th className="px-4 py-3">បរិមាណ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouseStockIns.map((record: any) => (
                          <tr 
                            key={record.id} 
                            onClick={() => setSelectedStockInRecord(record)}
                            className="border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer text-xs sm:text-sm font-bold text-slate-700"
                          >
                            <td className="px-4 py-3">{record.date}</td>
                            <td className="px-4 py-3">{record.deliverer}</td>
                            <td className="px-4 py-3">
                              {record.items.map((item: any, idx: number) => (
                                <div key={idx} className="py-0.5">{item.productName}</div>
                              ))}
                            </td>
                            <td className="px-4 py-3">
                              {record.items.map((item: any, idx: number) => (
                                <div key={idx} className="py-0.5 text-emerald-600">+{item.quantity}</div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 flex justify-end shrink-0 bg-white rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsStockInHistoryOpen(false)}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-3 rounded-2xl transition cursor-pointer"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {selectedStockInRecord && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 mb-4">ព័ត៌មានលម្អិតស្តុកចូល</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold mb-1">កាលបរិច្ឆេទ</div>
                  <div className="text-sm font-bold text-slate-700">{selectedStockInRecord.date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold mb-1">អ្នកប្រគល់</div>
                  <div className="text-sm font-bold text-slate-700">{selectedStockInRecord.deliverer}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold mb-2">ទំនិញដែលបានបញ្ចូល</div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  {selectedStockInRecord.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700">{item.productName}</span>
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setStockInToEdit(selectedStockInRecord);
                  setEditStockInDate(selectedStockInRecord.date);
                  setEditStockInDeliverer(selectedStockInRecord.deliverer);
                  setEditStockInItems(selectedStockInRecord.items.map((i: any) => ({ productName: i.productName, quantity: String(i.quantity) })));
                  setIsEditStockInModalOpen(true);
                }}
                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                កែប្រែ
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockInToDelete(selectedStockInRecord);
                  setSelectedStockInRecord(null);
                }}
                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                លុប
              </button>
            </div>
            <button
              onClick={() => setSelectedStockInRecord(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Stock In Modal */}
      {isEditStockInModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl max-h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">កែប្រែស្តុកចូល (Edit Stock In)</h3>
                <p className="text-xs text-slate-500 font-medium">កែប្រែទិន្នន័យស្តុកដែលបានបញ្ចូល</p>
              </div>
              <button 
                onClick={() => setIsEditStockInModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStockIn} className="flex flex-col min-h-0">
              <div className="overflow-y-auto p-6 pt-4 custom-scroll space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                    <input
                      type="date"
                      value={editStockInDate}
                      onChange={e => setEditStockInDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-sky-400 outline-none font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">អ្នកប្រគល់ស្តុក</label>
                    <input
                      type="text"
                      value={editStockInDeliverer}
                      onChange={e => setEditStockInDeliverer(e.target.value)}
                      placeholder="ឈ្មោះ..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-sky-400 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">
                      បញ្ជីទំនិញ
                    </label>
                    <div className="space-y-2">
                      {editStockInItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-700 mb-1">{item.productName}</div>
                          </div>
                          <div className="w-28 relative">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const newItems = [...editStockInItems];
                                newItems[idx].quantity = e.target.value;
                                setEditStockInItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-sky-400 outline-none font-bold text-slate-800 pr-8"
                              placeholder="ចំនួន"
                              required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                              ឯកតា
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-slate-100 flex gap-3 shrink-0 bg-white rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsEditStockInModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-sky-500/30 transition disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកែប្រែ'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal for Deleting Stock In History */}
      {stockInToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុបស្តុកចូល</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបប្រវត្តិស្តុកចូលកាលពីថ្ងៃទី <span className="font-bold text-slate-800">"{stockInToDelete.date}"</span> នេះមែនទេ? ចំនួនទំនិញនឹងត្រូវកាត់ចេញពីឃ្លាំងវិញ។ ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStockInToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDeleteStockIn(stockInToDelete)}
                className="flex-1 hover:bg-rose-700 bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
