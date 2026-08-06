import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { User, Transaction, Product, StockOrder, PromotionTier, Role, TransactionType } from '../types';
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

export function calculateAutoតម្លៃForQty(product: Product, qty: number): number {
  const standardតម្លៃ = product.price || 0;
  if (qty <= 0) return standardតម្លៃ;

  // Check if quantity is an exact promo target number
  const freeQty = calculatePromoQty(product, qty);
  if (freeQty > 0) {
    return standardតម្លៃ;
  }

  // Check if it's an apportioned quantity (buyQty + getQty)
  const tiers: { buyQty: number; getQty: number }[] = [];
  if (product.promotions && product.promotions.length > 0) {
    tiers.push(...product.promotions.filter(p => p.buyQty > 0 && p.getQty > 0));
  } else if (product.promoBuyQty && product.promoBuyQty > 0 && product.promoGetQty) {
    tiers.push({ buyQty: product.promoBuyQty, getQty: product.promoGetQty });
  }

  if (tiers.length === 0) {
    return standardតម្លៃ;
  }

  // Sort descending by buyQty
  tiers.sort((a, b) => b.buyQty - a.buyQty);

  for (const tier of tiers) {
    if (qty >= tier.buyQty) {
      // Falls into this tier
      return (tier.buyQty * standardតម្លៃ) / (tier.buyQty + tier.getQty);
    }
  }

  // If quantity is smaller than the smallest tier, use the smallest tier's apportioned price
  const smallestTier = tiers[tiers.length - 1];
  return (smallestTier.buyQty * standardតម្លៃ) / (smallestTier.buyQty + smallestTier.getQty);
}

export function calculatePromoQtyWithតម្លៃCheck(product: Product | undefined, qty: number, priceVal: number): number {
  if (!product || qty <= 0) return 0;
  
  const standardតម្លៃ = product.price || 0;
  if (Math.abs(priceVal - standardតម្លៃ) > 0.001) {
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
  currentUser: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: Transaction[];
  products: Product[];
  stockOrders: StockOrder[];
  activeTab: 'users' | 'products' | 'transactions' | 'stockOrders' | 'stockOut' | 'stockSold' | 'stockReturn' | 'warehouse';
  isAIScannerModalOpen: boolean;
  setIsAIScannerModalOpen: (val: boolean) => void;
}

export default function AdminDashboard({ currentUser, users, setUsers, transactions, products, stockOrders, activeTab, isAIScannerModalOpen, setIsAIScannerModalOpen }: AdminDashboardProps) {
  const ttyUser = users.find(u => u.username.toUpperCase() === 'TTY');
  const managedUsers = currentUser.role === 'Server'
    ? users.filter(u => u.role === 'Admin')
    : users.filter(u => 
        u.id === currentUser.id || 
        u.createdBy === currentUser.id || 
        (!u.createdBy && ttyUser && currentUser.id === ttyUser.id)
      );
  const [isបង្កើតUserModalOpen, setIsបង្កើតUserModalOpen] = useState(false);
  const [isបង្កើតProductModalOpen, setIsបង្កើតProductModalOpen] = useState(false);
  
  const getNowLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // AI Scanner State
  const [aiScannerUserId, setAiScannerUserId] = useState('');
  const [aiScannerType, setAiScannerType] = useState<TransactionType>('Stock Out');
  const [aiScannerDate, setAiScannerDate] = useState<string>(getNowLocalDate());
  const [aiScannerImage, setAiScannerImage] = useState<string>('');
  const [aiScannerFileName, setAiScannerFileName] = useState<string>('');
  const [aiScannerLoading, setAiScannerLoading] = useState(false);
  const [aiScannerResults, setAiScannerResults] = useState<{ id: string, productName: string, quantity: number, soldQty?: number, exchangedQty?: number, promoQty?: number, unit?: string, description?: string, matchedProductId?: string, actualProduct?: Product }[]>([]);
  const [manualAddMode, setManualAddMode] = useState<'none' | 'single' | 'all'>('none');
  const [manualAddItems, setManualAddItems] = useState<{ id: string, productName: string, quantity: number, soldQty: number, exchangedQty: number, promoQty: number, matchedProductId?: string, actualProduct?: Product }[]>([]);
  const [manualAddSearchText, setManualAddSearchText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newឈ្មោះអ្នកប្រើប្រាស់, setNewឈ្មោះអ្នកប្រើប្រាស់] = useState('');
  const [newពាក្យសម្ងាត់, setNewពាក្យសម្ងាត់] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('User');
  const [newPhone, setNewPhone] = useState('');
  const [newCarPlate, setNewCarPlate] = useState('');
  const [newSalesArea, setNewSalesArea] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductតម្លៃ, setNewProductតម្លៃ] = useState('');
  const [newProductPromoBuy, setNewProductPromoBuy] = useState('');
  const [newProductPromoGet, setNewProductPromoGet] = useState('');
  const [newProductPromotions, setNewProductPromotions] = useState<PromotionTier[]>([]);

  // Product កែប្រែ States
  const [productToកែប្រែ, setProductToកែប្រែ] = useState<Product | null>(null);
  const [editProductName, setកែប្រែProductName] = useState('');
  const [editProductតម្លៃ, setកែប្រែProductតម្លៃ] = useState('');
  const [editProductPromoBuy, setកែប្រែProductPromoBuy] = useState('');
  const [editProductPromoGet, setកែប្រែProductPromoGet] = useState('');
  const [editProductPromotions, setកែប្រែProductPromotions] = useState<PromotionTier[]>([]);

  const [loading, setLoading] = useState(false);
  const managedUserIds = managedUsers.map(u => u.id);
  const managedTransactions = transactions.filter(t => managedUserIds.includes(t.userId));
  const managedStockOrders = stockOrders.filter(o => managedUserIds.includes(o.userId));
  const [userToលុប, setUserToលុប] = useState<User | null>(null);
  const [productToលុប, setProductToលុប] = useState<Product | null>(null);
  const [userToកែប្រែ, setUserToកែប្រែ] = useState<User | null>(null);
  const [editឈ្មោះអ្នកប្រើប្រាស់, setកែប្រែឈ្មោះអ្នកប្រើប្រាស់] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('User');
  const [editពាក្យសម្ងាត់, setកែប្រែពាក្យសម្ងាត់] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCarPlate, setEditCarPlate] = useState('');
  const [editSalesArea, setEditSalesArea] = useState('');
  const [transactionToលុប, setTransactionToលុប] = useState<Transaction | null>(null);
  const [transactionToកែប្រែ, setTransactionToកែប្រែ] = useState<Transaction | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<Transaction | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any | null>(null);
  const [editingFullInvoice, setEditingFullInvoice] = useState<{
    id: string;
    type: TransactionType;
    originalItems: Transaction[];
    customerName: string;
    location: string;
    date: string;
    items: {
      id?: string;
      productName: string;
      quantity: number | string;
      price: number | string;
      promoQty?: number | string;
    }[];
  } | null>(null);
  const [selectedRowItem, setSelectedRowItem] = useState<Transaction | null>(null);
  const [invoiceToលុប, setInvoiceToលុប] = useState<any | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isកែប្រែingTransaction, setIsកែប្រែingTransaction] = useState(false);
  const [isកែប្រែingUser, setIsកែប្រែingUser] = useState(false);
  const [showAdminUsersList, setShowAdminUsersList] = useState(false);
  const [editQuantity, setកែប្រែបរិមាណ] = useState('');
  const [editNote, setកែប្រែNote] = useState('');
  const [editTxProductName, setកែប្រែTxProductName] = useState('');
  const [editTxDate, setកែប្រែTxDate] = useState('');
  const [editTxCustomerName, setកែប្រែTxCustomerName] = useState('');
  const [editTxLocation, setកែប្រែTxLocation] = useState('');
  const [editTxតម្លៃ, setកែប្រែTxតម្លៃ] = useState('');
  
  // Editable Report State
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editedReportData, setEditedReportData] = useState<Record<string, { stockOut: string, stockSold: string, stockExchanged: string, stockPromo: string, stockReturn: string }>>({});

  // Stock Order Admin States
  const [isបង្កើតOrderModalOpen, setIsបង្កើតOrderModalOpen] = useState(false);
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
  const [filterTxStartDate, setFilterTxStartDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [filterTxEndDate, setFilterTxEndDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // កែប្រែ / លុប stock order states
  const [orderToលុប, setOrderToលុប] = useState<StockOrder | null>(null);
  const [orderToកែប្រែ, setOrderToកែប្រែ] = useState<StockOrder | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [isកែប្រែingOrder, setIsកែប្រែingOrder] = useState(false);
  const [editOrderUserId, setកែប្រែOrderUserId] = useState('');
  const [editOrderProductName, setកែប្រែOrderProductName] = useState('');
  const [editOrderQuantity, setកែប្រែOrderQuantity] = useState('');
  const [editOrderDate, setកែប្រែOrderDate] = useState('');
  const [editOrderCustomerName, setកែប្រែOrderCustomerName] = useState('');
  const [editOrderLocation, setកែប្រែOrderLocation] = useState('');
  const [editOrderDelivered, setកែប្រែOrderDelivered] = useState(false);

  // Warehouse Stock states
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddItems, setQuickAddItems] = useState<{productName: string, quantity: string}[]>([]);
  const [isកែប្រែWarehouseStockModalOpen, setIsកែប្រែWarehouseStockModalOpen] = useState(false);
  const [productToកែប្រែWarehouseStock, setProductToកែប្រែWarehouseStock] = useState<Product | null>(null);
  const [editWarehouseStockVal, setកែប្រែWarehouseStockVal] = useState('');
  const [stockInDate, setStockInDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [stockInDeliverer, setStockInDeliverer] = useState('');
  const [stockInItems, setStockInItems] = useState<StockItemInput[]>([]);
  const [stockInScannerLoading, setStockInScannerLoading] = useState(false);
  const stockInFileInputRef = useRef<HTMLInputElement>(null);
  const [stockInImage, setStockInImage] = useState<string>('');
  const [stockInFileName, setStockInFileName] = useState<string>('');
  const [actualStockDrafts, setActualStockDrafts] = useState<{ [productId: string]: string }>({});
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('all');
  const [warehouseStockIns, setWarehouseStockIns] = useState<any[]>([]);
  const [isStockInHistoryOpen, setIsStockInHistoryOpen] = useState(false);
  const [stockInToលុប, setStockInToលុប] = useState<any | null>(null);
  
  // New States for Stock In History Row details and កែប្រែ
  const [selectedStockInRecord, setSelectedStockInRecord] = useState<any | null>(null);
  const [isកែប្រែStockInModalOpen, setIsកែប្រែStockInModalOpen] = useState(false);
  const [stockInToកែប្រែ, setStockInToកែប្រែ] = useState<any | null>(null);
  const [editStockInDate, setកែប្រែStockInDate] = useState('');
  const [editStockInDeliverer, setកែប្រែStockInDeliverer] = useState('');
  const [editStockInItems, setកែប្រែStockInItems] = useState<StockItemInput[]>([]);

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
    if (!stockInToកែប្រែ) return;

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
      await Promise.all(stockInToកែប្រែ.items.map(async (oldItem: any) => {
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
        ...stockInToកែប្រែ,
        date: editStockInDate,
        deliverer: editStockInDeliverer,
        items: validItems.map(item => ({
          productName: item.productName,
          quantity: parseInt(item.quantity)
        }))
      };
      await updateDoc(doc(db, 'warehouse_stock_ins', stockInToកែប្រែ.id), updatedRecord);

      setIsកែប្រែStockInModalOpen(false);
      setStockInToកែប្រែ(null);
      setSelectedStockInRecord(updatedRecord);
    } catch (err) {
      console.error("Error updating stock in: ", err);
      alert("មានបញ្ហាក្នុងការកែប្រែ");
    } finally {
      setLoading(false);
    }
  };

  const handleរក្សាទុកWarehouseStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToកែប្រែWarehouseStock) return;
    const qty = parseInt(editWarehouseStockVal);
    if (isNaN(qty) || qty < 0) {
      alert("សូមបញ្ចូលចំនួនត្រឹមត្រូវ ");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'products', productToកែប្រែWarehouseStock.id), {
        warehouseStock: qty
      });
      setIsកែប្រែWarehouseStockModalOpen(false);
      setProductToកែប្រែWarehouseStock(null);
      setកែប្រែWarehouseStockVal('');
    } catch (err) {
      console.error("Error saving warehouse stock: ", err);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleរក្សាទុកActualStock = async (product: Product) => {
    const draftValue = actualStockDrafts[product.id];
    if (draftValue === undefined || draftValue === '') return;
    const qty = parseInt(draftValue);
    if (isNaN(qty) || qty < 0) {
      alert("សូមបញ្ចូលចំនួនត្រឹមត្រូវ ");
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


  const handleStockInImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStockInFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 800;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setStockInImage(canvas.toDataURL('image/jpeg', 0.4));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleStockInScan = async () => {
    if (!stockInImage) return;
    setStockInScannerLoading(true);
    try {
      const response = await fetch('/api/extract-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: stockInImage, 
          targetType: 'Stock In',
          productNames: products.map(p => p.name)
        })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error('ម៉ាស៊ីនបម្រើបានបញ្ជូនការឆ្លើយតបមិនត្រឹមត្រូវ។');
      }
      
      if (!result.success) {
        throw new Error(result.error || "ការទាញយកទិន្នន័យបានបរាជ័យ");
      }
      
      const parsedItems = result.data.map((item: any) => {
        const searchName = (item.productName || '').trim().toLowerCase();
        let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
        if (!matchedProduct) {
          const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
          matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
        }
        return {
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: item.quantity ? item.quantity.toString() : ''
        };
      }).filter((item: any) => item.productName);
      
      const aggregatedItems = parsedItems.reduce((acc: any[], current: any) => {
        const existing = acc.find(item => item.productName === current.productName);
        if (existing) {
          existing.quantity = ((Number(existing.quantity) || 0) + (Number(current.quantity) || 0)).toString();
        } else {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setStockInItems(prev => {
        const newArray = [...prev];
        aggregatedItems.forEach(aggItem => {
          const existingInPrev = newArray.find(p => p.productName === aggItem.productName);
          if (existingInPrev) {
            existingInPrev.quantity = ((Number(existingInPrev.quantity) || 0) + (Number(aggItem.quantity) || 0)).toString();
          } else {
            newArray.push(aggItem);
          }
        });
        return newArray;
      });
    } catch (error: any) {
      alert("មានបញ្ហាក្នុងការស្កេន: " + error.message);
    } finally {
      setStockInScannerLoading(false);
      if (stockInFileInputRef.current) stockInFileInputRef.current.value = '';
    }
  };

  const handleរក្សាទុកStockIn = async (e: React.FormEvent) => {
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

      // បន្ថែម Stock In history record
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

  const handleលុបStockIn = async (record: any) => {
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
      setStockInToលុប(null);
    } catch (err) {
      console.error("Error deleting stock in record: ", err);
      alert("មានបញ្ហាក្នុងការលុបប្រវត្តិស្តុកចូល");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    if (currentUser.role !== 'Server' || selectedAdminId === 'all') {
      return products;
    }
    return products.filter(p => p.createdBy === selectedAdminId || (!p.createdBy && selectedAdminId === 'admin-1'));
  };

  const filteredWarehouseProducts = getFilteredProducts().filter(p =>
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

  const handleAdminបង្កើតStockOrder = async (e: React.FormEvent) => {
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

      setIsបង្កើតOrderModalOpen(false);
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

  const handleAdminបញ្ជាក់Delivery = async (orderGroup: any) => {
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

  const handleAdminលុបOrder = async (orderId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'stock_orders', orderId));
      setOrderToលុប(null);
      setSelectedOrderDetail(null);
    } catch (error) {
      console.error("Error deleting stock order: ", error);
      alert("មានបញ្ហាក្នុងការលុបទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminកែប្រែOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orderToកែប្រែ || selectedOrderDetail;
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
      
      setOrderToកែប្រែ(null);
      setSelectedOrderDetail(null);
      setIsកែប្រែingOrder(false);
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

  const handleបង្កើតUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.username === newឈ្មោះអ្នកប្រើប្រាស់)) {
      alert('ឈ្មោះនេះមានរួចហើយ!');
      return;
    }
    
    // Prevent Admin from creating Admin/Server roles
    const finalRole = currentUser.role === 'Admin' ? 'User' : newUserRole;

    setLoading(true);
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: newឈ្មោះអ្នកប្រើប្រាស់,
      password: newពាក្យសម្ងាត់,
      role: finalRole,
      phone: newPhone,
      carPlate: newCarPlate,
      salesArea: newSalesArea,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };
    
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
      setNewឈ្មោះអ្នកប្រើប្រាស់('');
      setNewពាក្យសម្ងាត់('');
      setNewUserRole('User');
      setNewPhone('');
      setNewCarPlate('');
      setNewSalesArea('');
      setIsបង្កើតUserModalOpen(false);
    } catch (error) {
      console.error("Error adding user: ", error);
      alert('មានបញ្ហាក្នុងការបង្កើតអ្នកប្រើប្រាស់');
    } finally {
      setLoading(false);
    }
  };

  const handleលុបUser = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', id));
      setUserToលុប(null);
    } catch (error) {
      console.error("Error deleting user: ", error);
      alert('មានបញ្ហាក្នុងការលុបអ្នកប្រើប្រាស់');
    } finally {
      setLoading(false);
    }
  };

  const addបង្កើតPromoRow = () => {
    setNewProductPromotions([...newProductPromotions, { buyQty: 0, getQty: 0 }]);
  };

  const updateបង្កើតPromoRow = (index: number, field: 'buyQty' | 'getQty', value: string) => {
    const updated = [...newProductPromotions];
    updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    setNewProductPromotions(updated);
  };

  const removeបង្កើតPromoRow = (index: number) => {
    setNewProductPromotions(newProductPromotions.filter((_, i) => i !== index));
  };

  const addកែប្រែPromoRow = () => {
    setកែប្រែProductPromotions([...editProductPromotions, { buyQty: 0, getQty: 0 }]);
  };

  const updateកែប្រែPromoRow = (index: number, field: 'buyQty' | 'getQty', value: string) => {
    const updated = [...editProductPromotions];
    updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    setកែប្រែProductPromotions(updated);
  };

  const removeកែប្រែPromoRow = (index: number) => {
    setកែប្រែProductPromotions(editProductPromotions.filter((_, i) => i !== index));
  };

  const handleបង្កើតProduct = async (e: React.FormEvent) => {
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
      price: newProductតម្លៃ ? Number(newProductតម្លៃ) : undefined,
      promoBuyQty: firstPromo ? firstPromo.buyQty : (newProductPromoBuy ? Number(newProductPromoBuy) : undefined),
      promoGetQty: firstPromo ? firstPromo.getQty : (newProductPromoGet ? Number(newProductPromoGet) : undefined),
      promotions: cleanPromos.length > 0 ? cleanPromos : undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };
    
    try {
      await setDoc(doc(db, 'products', newProduct.id), cleanUndefined(newProduct));
      setNewProductName('');
      setNewProductតម្លៃ('');
      setNewProductPromoBuy('');
      setNewProductPromoGet('');
      setNewProductPromotions([]);
      setIsបង្កើតProductModalOpen(false);
    } catch (error) {
      console.error("Error adding product: ", error);
      alert('មានបញ្ហាក្នុងការបង្កើតទំនិញ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToកែប្រែ) return;
    if (!editProductName.trim()) return;
    
    setLoading(true);
    const cleanPromos = editProductPromotions
      .map(p => ({ buyQty: Number(p.buyQty) || 0, getQty: Number(p.getQty) || 0 }))
      .filter(p => p.buyQty > 0 && p.getQty > 0);

    const firstPromo = cleanPromos[0];

    try {
      // បង្កើត a fresh doc structure or merge with deleted keys
      const updatedProduct: Product = {
        ...productToកែប្រែ,
        name: editProductName.trim(),
        price: editProductតម្លៃ ? Number(editProductតម្លៃ) : undefined,
        promoBuyQty: firstPromo ? firstPromo.buyQty : (editProductPromoBuy ? Number(editProductPromoBuy) : undefined),
        promoGetQty: firstPromo ? firstPromo.getQty : (editProductPromoGet ? Number(editProductPromoGet) : undefined),
        promotions: cleanPromos.length > 0 ? cleanPromos : undefined,
      };

      // Since firestore merge doesn't remove fields, if promotions is undefined, we delete it or set it to null/empty in setDoc. Let's do setDoc without merge to fully overwrite, or just merge. Standard overwrite is safer here.
      await setDoc(doc(db, 'products', productToកែប្រែ.id), cleanUndefined(updatedProduct));
      setProductToកែប្រែ(null);
    } catch (error) {
      console.error("Error updating product: ", error);
      alert('មានបញ្ហាក្នុងការកែប្រែទំនិញ');
    } finally {
      setLoading(false);
    }
  };

  const handleលុបProduct = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', id));
      setProductToលុប(null);
    } catch (error) {
      console.error("Error deleting product: ", error);
      alert('មានបញ្ហាក្នុងការលុបទំនិញ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = userToកែប្រែ || selectedUserDetail;
    if (!targetUser) return;
    setLoading(true);
    // Limit role updates: Admin cannot escalate anyone to Admin/Server, and keeps their own role
    const finalRole = targetUser.id === currentUser.id 
      ? targetUser.role 
      : (currentUser.role === 'Admin' ? 'User' : editUserRole);

    try {
      await setDoc(doc(db, 'users', targetUser.id), { 
        ...targetUser, 
        username: editឈ្មោះអ្នកប្រើប្រាស់, 
        password: editពាក្យសម្ងាត់, 
        role: finalRole,
        phone: editPhone,
        carPlate: editCarPlate,
        salesArea: editSalesArea
      }, { merge: true });
      setUserToកែប្រែ(null);
      setSelectedUserDetail(null);
      setIsកែប្រែingUser(false);
    } catch (error) {
      console.error("Error updating user: ", error);
      alert('មានបញ្ហាក្នុងការកែប្រែអ្នកប្រើប្រាស់');
    } finally {
      setLoading(false);
    }
  };

  const handleលុបTransaction = async (id: string) => {
    setLoading(true);
    try {
      if (transactionToលុប) {
        const product = products.find(p => p.name === transactionToលុប.productName);
        if (product) {
          if (transactionToលុប.type === 'Stock Out') {
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(transactionToលុប.quantity)
            });
          } else if (transactionToលុប.type === 'Stock Return') {
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(-transactionToលុប.quantity)
            });
          }
        }
      }
      await deleteDoc(doc(db, 'transactions', id));
      setTransactionToលុប(null);
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      alert('មានបញ្ហាក្នុងការលុបប្រតិបត្តិការ');
    } finally {
      setLoading(false);
    }
  };

  const handleកែប្រែTransactionClick = (t: Transaction) => {
    setTransactionToកែប្រែ(t);
    setកែប្រែTxProductName(t.productName);
    setកែប្រែបរិមាណ(String(t.quantity));
    
    const prod = products.find(p => p.name === t.productName);
    setកែប្រែTxតម្លៃ(t.price !== undefined ? String(t.price) : (prod?.price !== undefined ? String(prod.price) : ''));
    
    const tDate = t.date ? new Date(t.date) : new Date();
    const validDate = isNaN(tDate.getTime()) ? new Date() : tDate;
    const yyyy = validDate.getFullYear();
    const mm = String(validDate.getMonth() + 1).padStart(2, '0');
    const dd = String(validDate.getDate()).padStart(2, '0');
    setកែប្រែTxDate(`${yyyy}-${mm}-${dd}`);
    setកែប្រែNote(t.note || '');

    if (t.type === 'Stock Sold') {
      const currentNote = t.note || '';
      const match = currentNote.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        setកែប្រែTxCustomerName(match[1].trim());
        setកែប្រែTxLocation(match[2].trim());
      } else {
        setកែប្រែTxCustomerName(currentNote);
        setកែប្រែTxLocation('');
      }
    } else {
      setកែប្រែTxCustomerName('');
      setកែប្រែTxLocation('');
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToកែប្រែ) return;

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
      const origDate = transactionToកែប្រែ.date ? new Date(transactionToកែប្រែ.date) : new Date();
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

      const parsedតម្លៃ = parseFloat(editTxតម្លៃ);

      const product = products.find(p => p.name === editTxProductName);
      let promoQty: number | undefined = undefined;
      if (product && transactionToកែប្រែ.type === 'Stock Sold') {
        promoQty = calculatePromoQtyWithតម្លៃCheck(product, qty, isNaN(parsedតម្លៃ) ? 0 : parsedតម្លៃ);
      }

      const updatedTransaction: Partial<Transaction> = {
        productName: editTxProductName,
        quantity: qty,
        price: isNaN(parsedតម្លៃ) ? undefined : parsedតម្លៃ,
        promoQty: promoQty && promoQty > 0 ? promoQty : undefined,
        date: selectedDate.toISOString(),
        note: transactionToកែប្រែ.type === 'Stock Sold' ? (editTxCustomerName && editTxLocation ? `${editTxCustomerName} (${editTxLocation})` : editTxCustomerName || editTxLocation || '') : editNote
      };

      if (!promoQty || promoQty <= 0) {
        (updatedTransaction as any).promoQty = deleteField(); 
      }

      // Handle Warehouse Stock updates for កែប្រែ
      if (transactionToកែប្រែ.type === 'Stock Out') {
        const oldProduct = products.find(p => p.name === transactionToកែប្រែ.productName);
        const newProduct = products.find(p => p.name === editTxProductName);
        
        if (oldProduct && newProduct && oldProduct.id === newProduct.id) {
          const diff = transactionToកែប្រែ.quantity - qty;
          if (diff !== 0) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(diff)
            });
          }
        } else {
          if (oldProduct) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(transactionToកែប្រែ.quantity)
            });
          }
          if (newProduct) {
            await updateDoc(doc(db, 'products', newProduct.id), {
              warehouseStock: increment(-qty)
            });
          }
        }
      } else if (transactionToកែប្រែ.type === 'Stock Return') {
        const oldProduct = products.find(p => p.name === transactionToកែប្រែ.productName);
        const newProduct = products.find(p => p.name === editTxProductName);
        
        if (oldProduct && newProduct && oldProduct.id === newProduct.id) {
          const diff = qty - transactionToកែប្រែ.quantity;
          if (diff !== 0) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(diff)
            });
          }
        } else {
          if (oldProduct) {
            await updateDoc(doc(db, 'products', oldProduct.id), {
              warehouseStock: increment(-transactionToកែប្រែ.quantity)
            });
          }
          if (newProduct) {
            await updateDoc(doc(db, 'products', newProduct.id), {
              warehouseStock: increment(qty)
            });
          }
        }
      }

      await updateDoc(doc(db, 'transactions', transactionToកែប្រែ.id), cleanUndefined(updatedTransaction));
      setTransactionToកែប្រែ(null);
      setIsកែប្រែingTransaction(false);
    } catch (error) {
      console.error("Error updating transaction: ", error);
      alert("មានបញ្ហាក្នុងការកែប្រែទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditFullInvoice = (inv: any) => {
    if (!inv || !inv.items || inv.items.length === 0) return;
    const firstItem = inv.items[0];
    const txType: TransactionType = firstItem?.type || 'Stock Sold';

    let formattedDate = '';
    if (inv.date) {
      const d = new Date(inv.date);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}T${hours}:${mins}`;
      }
    }

    setEditingFullInvoice({
      id: inv.id,
      type: txType,
      originalItems: [...inv.items],
      customerName: inv.customerName || '',
      location: inv.location || '',
      date: formattedDate || new Date().toISOString().slice(0, 16),
      items: inv.items.map((item: Transaction) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price !== undefined ? item.price : '',
        promoQty: item.promoQty !== undefined ? item.promoQty : ''
      }))
    });
  };

  const handleSaveFullInvoice = async () => {
    if (!editingFullInvoice) return;
    if (editingFullInvoice.items.length === 0) {
      alert("វិក្កយបត្រត្រូវតែមានយ៉ាងហោចណាស់ទំនិញមួយ");
      return;
    }

    for (const item of editingFullInvoice.items) {
      const qty = parseInt(String(item.quantity));
      if (isNaN(qty) || qty <= 0) {
        alert("សូមបញ្ចូលបរិមាណដែលត្រឹមត្រូវសម្រាប់ទំនិញទាំងអស់");
        return;
      }
    }

    setLoading(true);
    try {
      const note = editingFullInvoice.type === 'Stock Sold'
        ? (editingFullInvoice.customerName && editingFullInvoice.location
            ? `${editingFullInvoice.customerName} (${editingFullInvoice.location})`
            : editingFullInvoice.customerName || editingFullInvoice.location || '')
        : (editingFullInvoice.customerName || '');

      const selectedDate = editingFullInvoice.date ? new Date(editingFullInvoice.date) : new Date();
      const isoDate = selectedDate.toISOString();

      const origItemIds = new Set(editingFullInvoice.originalItems.map(i => i.id));
      const currentItemIds = new Set(editingFullInvoice.items.filter(i => i.id).map(i => i.id));

      // 1. Delete removed items
      const itemsToDelete = editingFullInvoice.originalItems.filter(i => !currentItemIds.has(i.id));
      for (const oldItem of itemsToDelete) {
        const product = products.find(p => p.name === oldItem.productName);
        if (product) {
          if (oldItem.type === 'Stock Out') {
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(oldItem.quantity)
            });
          } else if (oldItem.type === 'Stock Return') {
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: increment(-oldItem.quantity)
            });
          }
        }
        await deleteDoc(doc(db, 'transactions', oldItem.id));
      }

      // 2. Update existing & create new items
      for (const item of editingFullInvoice.items) {
        const qty = parseInt(String(item.quantity)) || 0;
        const pr = parseFloat(String(item.price));
        const parsedPrice = isNaN(pr) ? undefined : pr;
        const product = products.find(p => p.name === item.productName);

        let promoQty: number | undefined = undefined;
        if (product && editingFullInvoice.type === 'Stock Sold') {
          promoQty = calculatePromoQtyWithតម្លៃCheck(product, qty, parsedPrice || 0);
        }

        if (item.id && origItemIds.has(item.id)) {
          // Update
          const origItem = editingFullInvoice.originalItems.find(i => i.id === item.id)!;

          if (editingFullInvoice.type === 'Stock Out') {
            const oldProduct = products.find(p => p.name === origItem.productName);
            const newProduct = product;
            if (oldProduct && newProduct && oldProduct.id === newProduct.id) {
              const diff = origItem.quantity - qty;
              if (diff !== 0) {
                await updateDoc(doc(db, 'products', oldProduct.id), {
                  warehouseStock: increment(diff)
                });
              }
            } else {
              if (oldProduct) {
                await updateDoc(doc(db, 'products', oldProduct.id), {
                  warehouseStock: increment(origItem.quantity)
                });
              }
              if (newProduct) {
                await updateDoc(doc(db, 'products', newProduct.id), {
                  warehouseStock: increment(-qty)
                });
              }
            }
          } else if (editingFullInvoice.type === 'Stock Return') {
            const oldProduct = products.find(p => p.name === origItem.productName);
            const newProduct = product;
            if (oldProduct && newProduct && oldProduct.id === newProduct.id) {
              const diff = qty - origItem.quantity;
              if (diff !== 0) {
                await updateDoc(doc(db, 'products', oldProduct.id), {
                  warehouseStock: increment(diff)
                });
              }
            } else {
              if (oldProduct) {
                await updateDoc(doc(db, 'products', oldProduct.id), {
                  warehouseStock: increment(-origItem.quantity)
                });
              }
              if (newProduct) {
                await updateDoc(doc(db, 'products', newProduct.id), {
                  warehouseStock: increment(qty)
                });
              }
            }
          }

          const updatedTx: Partial<Transaction> = {
            productName: item.productName,
            quantity: qty,
            price: parsedPrice,
            promoQty: promoQty && promoQty > 0 ? promoQty : undefined,
            date: isoDate,
            note: note
          };
          if (!promoQty || promoQty <= 0) {
            (updatedTx as any).promoQty = deleteField();
          }

          await updateDoc(doc(db, 'transactions', item.id), cleanUndefined(updatedTx));
        } else {
          // Create new
          const firstOrig = editingFullInvoice.originalItems[0];
          const newTxId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const newTx: Transaction = {
            id: newTxId,
            userId: firstOrig?.userId || currentUser.id,
            productName: item.productName,
            quantity: qty,
            type: editingFullInvoice.type,
            price: parsedPrice,
            promoQty: promoQty && promoQty > 0 ? promoQty : undefined,
            date: isoDate,
            note: note,
            createdBy: firstOrig?.createdBy || currentUser.username
          };

          if (product) {
            if (editingFullInvoice.type === 'Stock Out') {
              await updateDoc(doc(db, 'products', product.id), {
                warehouseStock: increment(-qty)
              });
            } else if (editingFullInvoice.type === 'Stock Return') {
              await updateDoc(doc(db, 'products', product.id), {
                warehouseStock: increment(qty)
              });
            }
          }

          await setDoc(doc(db, 'transactions', newTxId), cleanUndefined(newTx));
        }
      }

      setEditingFullInvoice(null);
      setSelectedInvoiceDetail(null);
    } catch (error) {
      console.error("Error updating full invoice: ", error);
      alert("មានបញ្ហាក្នុងការកែប្រែវិក្កយបត្រ");
    } finally {
      setLoading(false);
    }
  };

  const handleAIImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiScannerFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 800;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
          setAiScannerImage(compressedBase64);
        } else {
          setAiScannerImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAIScan = async () => {
    if (!aiScannerImage) {
      alert("សូមបញ្ចូលរូបភាពជាមុនសិន");
      return;
    }
    setAiScannerLoading(true);
    try {
      const response = await fetch('/api/extract-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: aiScannerImage, 
          targetType: aiScannerType,
          productNames: products.map(p => p.name)
        })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error(`ម៉ាស៊ីនបម្រើបានបញ្ជូនការឆ្លើយតបមិនត្រឹមត្រូវ (ស្ថានភាព៖ ${response.status})។ នេះអាចបណ្តាលមកពីរូបភាពមានទំហំធំពេក។`);
      }
      
      if (!result.success) {
        throw new Error(result.error || "ការទាញយកទិន្នន័យបានបរាជ័យ");
      }
      
      const parsedItems = result.data.map((item: any) => {
        // match product
        const searchName = (item.productName || '').trim().toLowerCase();
        let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
        if (!matchedProduct) {
          const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
          matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
        }
        const soldQ = Number(item.soldQuantity) || 0;
        const exQ = Number(item.exchangedQuantity) || 0;
        const proQ = Number(item.promoQuantity) || 0;
        let qty = Number(item.quantity) || 0;
        
        if (aiScannerType === 'Stock Sold') {
          // Force recalculation for Stock Sold so it exactly matches inputted numbers
          if (soldQ > 0 || exQ > 0) {
            qty = soldQ + exQ;
          } else if (Number(item.quantity) > 0) {
            qty = Number(item.quantity) - proQ;
            if (qty < 0) qty = 0;
          }
        }
        
        return {
          id: Date.now().toString() + Math.random().toString(),
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: qty,
          soldQty: soldQ,
          exchangedQty: exQ,
          promoQty: proQ,
          unit: item.unit || '',
          description: item.description || '',
          matchedProductId: matchedProduct?.id,
          actualProduct: matchedProduct
        };
      });
      
      const aggregatedItems = parsedItems.reduce((acc: any[], current: any) => {
        const existing = acc.find(item => item.productName === current.productName);
        if (existing) {
          existing.quantity = (Number(existing.quantity) || 0) + (Number(current.quantity) || 0);
          if (current.soldQty !== undefined || existing.soldQty !== undefined) {
             existing.soldQty = (Number(existing.soldQty) || 0) + (Number(current.soldQty) || 0);
          }
          if (current.exchangedQty !== undefined || existing.exchangedQty !== undefined) {
             existing.exchangedQty = (Number(existing.exchangedQty) || 0) + (Number(current.exchangedQty) || 0);
          }
          if (current.promoQty !== undefined || existing.promoQty !== undefined) {
             existing.promoQty = (Number(existing.promoQty) || 0) + (Number(current.promoQty) || 0);
          }
          if (current.description) {
            existing.description = existing.description ? existing.description + ", " + current.description : current.description;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setAiScannerResults(aggregatedItems);
    } catch (error: any) {
      alert("មានបញ្ហាក្នុងការស្កេន: " + error.message);
    } finally {
      setAiScannerLoading(false);
    }
  };

  const handleAISave = async () => {
    if (!aiScannerUserId) {
      alert("សូមជ្រើសរើសអ្នកប្រើប្រាស់");
      return;
    }
    if (aiScannerResults.length === 0) {
      alert("សូមស្កេនរូបភាព ដើម្បីបានទិន្នន័យ");
      return;
    }
    
    setAiScannerLoading(true);
    try {
      const targetUser = users.find(u => u.id === aiScannerUserId);
      if (!targetUser) throw new Error("រកមិនឃើញអ្នកប្រើប្រាស់");

      // Generate Invoice Date
      let isoDate = new Date().toISOString();
      if (aiScannerDate) {
        const selectedD = new Date(aiScannerDate);
        if (!isNaN(selectedD.getTime())) {
          isoDate = selectedD.toISOString();
        }
      } else {
        const offsetDate = new Date();
        offsetDate.setMinutes(offsetDate.getMinutes() - offsetDate.getTimezoneOffset());
        isoDate = offsetDate.toISOString();
      }

      for (const item of aiScannerResults) {
        if (!item.productName || item.quantity <= 0) continue;
        
        const newTransaction: any = {
          id: Date.now().toString() + Math.random().toString(),
          userId: aiScannerUserId,
          type: aiScannerType,
          productName: item.productName,
          quantity: item.quantity,
          soldQty: item.soldQty || 0,
          exchangedQty: item.exchangedQty || 0,
          promoQty: item.promoQty || 0,
          date: isoDate,
          note: item.description ? "AI Scan: " + item.description : "AI Scan"
        };
        
        if (item.actualProduct && item.actualProduct.price !== undefined) {
          newTransaction.price = item.actualProduct.price;
        }

        await setDoc(doc(db, 'transactions', newTransaction.id), cleanUndefined(newTransaction));
        
        // Update Warehouse Stock if matching product exists
        if (item.actualProduct) {
          if (aiScannerType === 'Stock Out') {
            await updateDoc(doc(db, 'products', item.actualProduct.id), {
              warehouseStock: increment(-item.quantity)
            });
          } else if (aiScannerType === 'Stock Return') {
            await updateDoc(doc(db, 'products', item.actualProduct.id), {
              warehouseStock: increment(item.quantity)
            });
          }
        }
      }

      alert("រក្សាទុកបានជោគជ័យ");
      setIsAIScannerModalOpen(false);
      setAiScannerResults([]);
      setAiScannerImage('');
      setAiScannerFileName('');
      setAiScannerUserId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch(err: any) {
      alert("រក្សាទុកបរាជ័យ: " + err.message);
    } finally {
      setAiScannerLoading(false);
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
        <tr style="border-bottom: 1px solid #000;">
          <td style="padding: 4px 8px; text-align: left;">
            <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${item.productName}</div>
            ${promoInfo}
          </td>
          <td style="padding: 4px 8px; text-align: center; font-weight: 800; color: #059669; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 4px 8px; text-align: right; color: #475569; font-size: 13px;">$${item.price !== undefined ? item.price.toFixed(2) : '0.00'}</td>
          <td style="padding: 4px 8px; text-align: right; font-weight: 800; color: #4f46e5; font-size: 13px;">$${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>វិក្កយបត្រ - ${invoice.customerName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Moul&family=Inter:wght@400;500;700;900&family=Kantumruy+Pro:wght@400;500;700;900&display=swap');
            body {
              font-family: 'Khmer OS Muol Light', 'Moul', 'Kantumruy Pro', 'Inter', sans-serif;
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
              border: 1px solid #000 !important;
              border-radius: 24px;
              padding: 40px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #000;
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
              border: 1px solid #000 !important;
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
            table, th, td {
              border: 1px solid #000 !important;
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
              padding: 4px 8px;
              border-bottom: 1px solid #000;
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
              border-top: 1px dashed #000;
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
              @page { size: A4 landscape; margin: 10mm; }
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
              <span class="total-label">តម្លៃសរុប </span>
              <span class="total-amount">$${totalCost.toFixed(2)}</span>
            </div>
            
            <div class="signatures">
              <div class="signature-block">
                <div>អ្នកលក់</div>
                <div class="signature-line">ហត្ថលេខា</div>
              </div>
              <div class="signature-block">
                <div>អ្នកទិញ</div>
                <div class="signature-line">ហត្ថលេខា</div>
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

  const handleExportSelectedUserStockPDF = () => {
    let dateRangeText = "ទាំងអស់";
    if (filterTxStartDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      dateRangeText = `${formatDate(filterTxStartDate)}`;
    } else if (filterTxEndDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      dateRangeText = `${formatDate(filterTxEndDate)}`;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("សូមអនុញ្ញាតឲ្យបើក Pop-up ដើម្បីទាញយក PDF");
      return;
    }

    const renderUserPage = (user: User) => {
      // Filter transactions for this specific user
      const userTxs = managedTransactions.filter(t => {
        const matchUser = t.userId === user.id;
        const txDateStr = t.date ? t.date.split('T')[0] : '';
        const matchStart = !filterTxStartDate || txDateStr >= filterTxStartDate;
        const matchEnd = !filterTxEndDate || txDateStr <= filterTxEndDate;
        return matchUser && matchStart && matchEnd;
      });

      // Group by product
      const groupedMap: {
        [productName: string]: {
          productName: string;
          stockOut: number;
          stockSold: number;
          stockExchanged: number;
          stockPromo: number;
          stockReturn: number;
          totalSoldQty: number;
        }
      } = {};
      products.forEach(p => {
        groupedMap[p.name] = { productName: p.name, stockOut: 0, stockSold: 0, stockExchanged: 0, stockPromo: 0, stockReturn: 0, totalSoldQty: 0 };
      });
      userTxs.forEach(t => {
        if (!groupedMap[t.productName]) {
          groupedMap[t.productName] = { productName: t.productName, stockOut: 0, stockSold: 0, stockExchanged: 0, stockPromo: 0, stockReturn: 0, totalSoldQty: 0 };
        }
        const group = groupedMap[t.productName];
        if (t.type === 'Stock Out') group.stockOut += t.quantity;
        else if (t.type === 'Stock Sold') { 
          group.totalSoldQty += t.quantity;
          if ((t as any).soldQty !== undefined) {
            group.stockSold += (t as any).soldQty;
          } else {
            group.stockSold += Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
          }
          group.stockExchanged += ((t as any).exchangedQty || 0);
          group.stockPromo += (t.promoQty || 0); 
        }
        else if (t.type === 'Stock Return') group.stockReturn += t.quantity;
      });
      const userGrouped = Object.values(groupedMap)
        .filter(p => p.stockOut > 0 || p.totalSoldQty > 0 || p.stockPromo > 0 || p.stockReturn > 0)
        .sort((a, b) => a.productName.localeCompare(b.productName));
      if (userGrouped.length === 0) return ''; // No data for this user

      const hasAnySalesActivity = userGrouped.some(p => (p.totalSoldQty + p.stockReturn) > 0);
      const rowsHtml = userGrouped.map(p => {
        const diff = p.stockOut - (p.stockSold + p.stockExchanged + p.stockPromo + p.stockReturn);
        let statusText = `ត្រឹមត្រូវ`;
        let statusColor = "color: #059669; background-color: #ecfdf5; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;";
         
        if (!hasAnySalesActivity && diff > 0) {
          statusText = `-`;
          statusColor = "color: #94a3b8; background-color: transparent; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;";
        } else if (diff < 0) {
          statusText = `លើស (${Math.abs(diff)})`;
          statusColor = "color: #d97706; background-color: #fffbeb; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;"; 
        } else if (diff > 0) {
          statusText = `បាត់ (${diff})`;
          statusColor = "color: #e11d48; background-color: #fff1f2; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;"; 
        }

        return `
          <tr style="border-bottom: 1px solid #000;">
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">${p.productName}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">${p.stockOut || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #059669; text-align: center;">${p.stockSold || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #8b5cf6; text-align: center;">${p.stockExchanged || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #f59e0b; text-align: center;">${p.stockPromo || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #4f46e5; text-align: center;">${p.stockReturn || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: right;"><span style="${statusColor}">${statusText}</span></td>
          </tr>
        `;
      }).join('');
      const rowsPerPage = 19; const emptyRowCount = rowsPerPage - (userGrouped.length % rowsPerPage);
      const emptyRowsHtml = emptyRowCount === 19 && userGrouped.length > 0 ? '' : Array.from({ length: emptyRowCount }).map(() => `
        <tr style="border-bottom: 1px solid #000;">
          <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        </tr>
      `).join('');
      const finalRowsHtml = rowsHtml + emptyRowsHtml;

      return `
        <div class="page-break">
          <div class="custom-print-header">
            <span>${currentUser?.username || 'Admin'}</span>
            <span>Dealer Management System</span>
          </div>
          <div class="header">
            <h1>របាយការណ៍ស្តុកលក់ប្រចាំថ្ងៃ</h1>
            
          </div>

          <div class="meta-info">
            <div class="meta-item"><span class="label">ឈ្មោះអ្នកលក់៖</span> <span class="value" style="color:#e11d48;">${user.username}</span></div>
            <div class="meta-item"><span class="label">កាលបរិច្ឆេទ៖</span> <span class="value">${dateRangeText}</span></div>
            <div class="meta-item"><span class="label">លេខទូរសព្ទ៖</span> <span class="value">${user.phone || '...............'}</span></div>
            <div class="meta-item"><span class="label">ផ្លាកលេខឡាន៖</span> <span class="value">${user.carPlate || '...............'}</span></div>
            <div class="meta-item"><span class="label">តំបន់លក់៖</span> <span class="value">${user.salesArea || '...............'}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="border: 1px solid #000; text-align: left;">ឈ្មោះទំនិញ</th>
                <th style="border: 1px solid #000; text-align: center;">ស្តុកឡើង</th>
                <th style="border: 1px solid #000; text-align: center;">ស្តុកលក់</th>
                <th style="border: 1px solid #000; text-align: center;">ប្ដូរប្រវិល</th>
                <th style="border: 1px solid #000; text-align: center;">ស្តុកថែម</th>
                <th style="border: 1px solid #000; text-align: center;">ស្តុកត្រឡប់</th>
                <th style="border: 1px solid #000; text-align: right;">បញ្ជាក់</th>
              </tr>
            </thead>
            <tbody>
              ${finalRowsHtml}
            </tbody>
          </table>

          
        </div>
      `;
    };

    let pagesHtml = '';

    if (filterTxUserId === 'all') {
      const activeUsers = currentUser.role === 'Server' ? users.filter(u => u.role === 'User' || u.role === 'Admin' || u.role === 'Server') : managedUsers.filter(u => u.role === 'User');
      const renderedPages = activeUsers.map(u => renderUserPage(u)).filter(html => html !== '');
      
      if (renderedPages.length === 0) {
        printWindow.close();
        alert("គ្មានទិន្នន័យសម្រាប់នាំចេញឡើយ");
        return;
      }
      pagesHtml = renderedPages.join('');
    } else {
      const selectedUser = users.find(u => u.id === filterTxUserId);
      if (selectedUser) {
        pagesHtml = renderUserPage(selectedUser);
      }
      
      if (!pagesHtml) {
        printWindow.close();
        alert("គ្មានទិន្នន័យសម្រាប់នាំចេញឡើយ");
        return;
      }
    }

    const documentContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>របាយការណ៍ស្តុកលក់ប្រចាំថ្ងៃ</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Moul&family=Inter:wght@400;500;700;900&family=Kantumruy+Pro:wght@400;500;700;900&display=swap');
            body {
              font-family: 'Khmer OS Muol Light', 'Moul', 'Kantumruy Pro', 'Inter', sans-serif;
              color: #334155;
              padding: 40px;
              line-height: 1.5;
            }
            .page-break {
              page-break-after: always;
              margin-bottom: 60px;
            }
            .page-break:last-of-type {
              page-break-after: auto;
              margin-bottom: 0;
            }
            .custom-print-header {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
              margin-bottom: 20px;
              font-family: 'Inter', sans-serif;
            }
            .header {
              text-align: center;
              margin-bottom: 8px;
            }
            .header h1 {
              font-size: 24px;
              color: #0f172a;
              margin: 0;
              font-weight: 700;
            }
            .header p {
              font-size: 14px;
              color: #64748b;
              margin: 0;
            }
            .meta-info {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 16px;
              margin-bottom: -1px;
              font-size: 13px;
              border: 1px solid #000 !important;
              padding: 4px 8px;
              border-radius: 8px 8px 0 0;
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .meta-item {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 6px;
            }
            .meta-item span.label {
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
              width: auto;
            }
            .meta-item span.value {
              font-size: 13px;
              font-weight: 700;
              color: #1e293b;
            }
            table, th, td {
              border: 1px solid #000 !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 700;
              padding: 4px 8px;
              border-bottom: 1px solid #000;
              font-size: 13px;
            }
            td {
              font-size: 13px;
            }
            .footer {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
              color: #94a3b8;
              font-weight: 500;
            }
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
              .page-break {
                margin-bottom: 0;
                padding-bottom: 12px;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(documentContent);
    printWindow.document.close();
  };


  
  const handleExportSelectedUserStockExcel = async () => {
    let dateRangeText = "ទាំងអស់";
    if (filterTxStartDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      dateRangeText = `${formatDate(filterTxStartDate)}`;
    } else if (filterTxEndDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      dateRangeText = `${formatDate(filterTxEndDate)}`;
    }

    const exportProductsList = [
      { khmerName: "ស្រាបៀរកម្ពុជា (មានរង្វាន់)", code: "CBC" },
      { khmerName: "ស្រាបៀរកម្ពុជា (អត់រង្វាន់)", code: "CBC ORD" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (មានរង្វាន់)", code: "CBL" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (អត់រង្វាន់)", code: "CBL ORD" },
      { khmerName: "ស្រាបៀរជបស", code: "CBLP" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ(មានរង្វាន់)", code: "CBB" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ (អត់រង្វាន់)", code: "CBB ORD" },
      { khmerName: "ស្រាបៀរជបទឹកខ្មៅ", code: "CBBP" },
      { khmerName: "ភេសជ្ជៈកូឡា 250ml", code: "COLA250" },
      { khmerName: "ភេសជ្ជៈកូឡា 330ml", code: "COLA330" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 300ml", code: "IZE300" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 500ml", code: "IZE500" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 1.5l", code: "IZE1.5" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (មានកេស)", code: "WATER350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (អត់កេស)", code: "WATERN350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (មានកេស)", code: "WATER500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (អត់កេស)", code: "WATERN500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 1.5l", code: "WATER1.5" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក", code: "WURKZ" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើកអាយស៍", code: "WICE" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង 330ml", code: "EXP330" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសដប 300ml", code: "EXP300" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក អត់រង្វាន់", code: "WURKZ ORD" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងគ្រាប់កំប៉ុង", code: "CED" },
      { khmerName: "ភេសជ្ជៈបំពោកជាតិទឹកដប 500ml", code: "CSD500" },
      { khmerName: "ភេសជ្ជៈដាស់ អត់រង្វាន់", code: "DAZZ ORD" },
      { khmerName: "ភេសជ្ជៈដាស់", code: "DAZZ" },
      { khmerName: "ស្រាបៀរកម្ពុជា4.4 (មានរង្វាន់)", code: "CB4.4" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង អត់រង្វាន់", code: "EXP330 ORD" }
    ];

    const workbook = new ExcelJS.Workbook();
    let hasData = false;

    const processUser = (user: User) => {
      const userTxs = managedTransactions.filter(t => {
        const matchUser = t.userId === user.id;
        const txDateStr = t.date ? t.date.split('T')[0] : '';
        const matchStart = !filterTxStartDate || txDateStr >= filterTxStartDate;
        const matchEnd = !filterTxEndDate || txDateStr <= filterTxEndDate;
        return matchUser && matchStart && matchEnd;
      });

      if (userTxs.length === 0) {
        return;
      }

      const groupedMap: {
        [productName: string]: {
          stockOut: number;
          stockSold: number;
          stockExchanged: number;
          stockPromo: number;
          stockReturn: number;
        }
      } = {};

      exportProductsList.forEach(p => {
        groupedMap[p.code] = { stockOut: 0, stockSold: 0, stockExchanged: 0, stockPromo: 0, stockReturn: 0 };
      });

      userTxs.forEach(t => {
        let pName = t.productName;
        if (pName === 'WURKZ ICE') pName = 'WICE';
        if (pName === 'W ORD') pName = 'WURKZ ORD';
        if (pName === 'D ORD') pName = 'DAZZ ORD';

        if (!groupedMap[pName]) {
          groupedMap[pName] = { stockOut: 0, stockSold: 0, stockExchanged: 0, stockPromo: 0, stockReturn: 0 };
        }
        const group = groupedMap[pName];
        if (t.type === 'Stock Out') group.stockOut += t.quantity;
        else if (t.type === 'Stock Sold') { 
          const soldOnly = t.soldQty !== undefined ? t.soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - (t.exchangedQty || 0));
          group.stockSold += soldOnly; 
          group.stockPromo += (t.promoQty || 0); 
          group.stockExchanged += (t.exchangedQty || 0);
        }
        else if (t.type === 'Stock Return') group.stockReturn += t.quantity;
      });

      const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      const toKhmerNumeral = (num: number) => {
        return num.toString().split('').map(digit => khmerNumerals[parseInt(digit)]).join('');
      };

      let sheetName = (user.username || "User").substring(0, 31);
      
      let dupCount = 1;
      let finalSheetName = sheetName;
      while (workbook.getWorksheet(finalSheetName)) {
        const suffix = `_${dupCount}`;
        finalSheetName = sheetName.substring(0, 31 - suffix.length) + suffix;
        dupCount++;
      }
      
      const ws = workbook.addWorksheet(finalSheetName, {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          margins: { left: 0.39, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
        }
      });
      
      // Fix for Excel ignoring fitToPage when scale is set
      delete ws.pageSetup.scale;
      ws.pageSetup.fitToPage = true;
      ws.pageSetup.fitToWidth = 1;
      ws.pageSetup.fitToHeight = 1;
      
      ws.headerFooter = { oddFooter: '&L&"Khmer OS Muol Light"ក្រវិល&C&"Khmer OS Muol Light"បាញ់លុយ' };
      
      hasData = true;

      // Add Data
      ws.addRow([`របាយការណ៍លក់ប្រចាំថ្ងៃ ( ${user.username || ''} )`, null, null, null, null, null, null, null, null]);
      ws.addRow([
        `ឈ្មោះអ្នកលក់៖ ${user.username || ""}`,
        null,
        `លេខទូរស័ព្ទ៖ ${user.phone || ''}`,
        null,
        `កាលបរិច្ឆេទ៖ ${dateRangeText}`,
        null,
        `ស្លាកលេខឡាន៖ ${user.carPlate || ''}`,
        null,
        null
      ]);
      ws.addRow([
        "ល.រ",
        "ឈ្មោះទំនិញ",
        "កូដសម្គាល់",
        "ចំនួន",
        "ចំនួនលក់",
        "ដូរប្រវិល",
        "ចំនួនថែម",
        "ស្តុកត្រឡប់",
        "ផ្សេងៗ"
      ]);

      const hasAnySalesActivity = exportProductsList.some(item => {
        const p = groupedMap[item.code];
        return (p.stockSold + p.stockReturn) > 0;
      });

      let rowIndex = 1;
      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        let remark = null;
        if (pData.stockOut > 0 || pData.stockSold > 0 || pData.stockExchanged > 0 || pData.stockPromo > 0 || pData.stockReturn > 0) {
          const diff = pData.stockOut - (pData.stockSold + pData.stockExchanged + pData.stockPromo + pData.stockReturn);
          if (!hasAnySalesActivity && diff > 0) {
            remark = "-";
          } else if (diff === 0) {
            remark = null;
          } else if (diff > 0) {
            remark = `បាត់ (${diff})`;
          } else {
            remark = `លើស (${Math.abs(diff)})`;
          }
        }
        
        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || null,
          pData.stockSold || null,
          pData.stockExchanged || null,
          pData.stockPromo || null,
          pData.stockReturn || null,
          remark
        ]);
      });

      // Merges
      ws.mergeCells('A1:I1'); // Merge Title
      ws.mergeCells('A2:B2'); // Merge Name
      ws.mergeCells('C2:D2'); // Merge Phone
      ws.mergeCells('E2:F2'); // Merge Date
      ws.mergeCells('G2:I2'); // Merge Plate

      // Row Heights
      ws.getRow(1).height = 35;
      ws.getRow(2).height = 25;
      ws.getRow(3).height = 30;
      for (let i = 4; i <= ws.rowCount; i++) {
        ws.getRow(i).height = 20;
      }

      // Column Widths
      ws.columns = [
        { width: 10 },  // ល.រ
        { width: 41 }, // ឈ្មោះទំនិញ
        { width: 17 }, // កូដសម្គាល់
        { width: 16 }, // ចំនួន
        { width: 16 }, // ចំនួនលក់
        { width: 16 }, // ដូរប្រវិល
        { width: 16 }, // ចំនួនថែម
        { width: 16 }, // ចំនួនសល់
        { width: 16 }  // ផ្សេងៗ
      ];

      // Styling
      ws.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber > 9) return; // Only style up to column I
          
          let borderStyle: Partial<ExcelJS.Borders> = {
            top: { style: 'thin', color: { argb: 'FF002060' } },
            bottom: { style: 'thin', color: { argb: 'FF002060' } },
            left: { style: 'thin', color: { argb: 'FF002060' } },
            right: { style: 'thin', color: { argb: 'FF002060' } }
          };

          let fontStyle: Partial<ExcelJS.Font> = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' } };
          let alignStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };

          if (rowNumber === 1) {
            fontStyle = { name: 'Khmer OS Muol Light', size: 14, color: { argb: 'FF002060' }, bold: true };
            borderStyle = {};
          } else if (rowNumber === 2) {
            fontStyle = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' }, bold: true };
            alignStyle = { vertical: 'middle', horizontal: 'left' };
            borderStyle = { bottom: { style: 'dotted', color: { argb: 'FF002060' } } };
          } else if (rowNumber === 3) {
            fontStyle = { name: 'Khmer OS Muol Light', size: 11, color: { argb: 'FF002060' }, bold: true };
          } else if (rowNumber > 3) {
            if (colNumber === 2 || colNumber === 3) {
              alignStyle = { vertical: 'middle', horizontal: 'left', wrapText: true };
              fontStyle = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' }, bold: true };
            } else if (colNumber === 1) {
               fontStyle = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' }, bold: true };
            }
          }

          cell.border = borderStyle;
          cell.alignment = alignStyle;
          
          if (cell.value != null && typeof cell.value !== 'object') {
            const str = cell.value.toString();
            const hasKhmer = /[\u1780-\u17FF\u19E0-\u19FF]/.test(str);
            const hasNonKhmer = /[^\u1780-\u17FF\u19E0-\u19FF\u200B\s]/.test(str);
            
            const isNumber = /^[\[\]\(\)\d\.\,\s\u17E0-\u17E9\+]+$/.test(str.trim());
            
            let khSize = fontStyle.size === 14 ? 14 : 10;
            let enSize = fontStyle.size === 14 ? 14 : 12;
            
            if (rowNumber > 3 && isNumber && str.trim() !== '') {
               khSize = 14;
               enSize = 14;
               if (colNumber === 1) {
                 khSize = 10;
                 enSize = 10;
               }
            }

            if (hasKhmer && hasNonKhmer) {
              const parts = str.split(/([\u1780-\u17FF\u19E0-\u19FF\u200B]+)/g);
              const segments = [];
              for (const part of parts) {
                if (!part) continue;
                if (/^[\u1780-\u17FF\u19E0-\u19FF\u200B]+$/.test(part)) {
                  segments.push({ font: { ...fontStyle, name: 'Khmer OS Muol Light', size: khSize }, text: part });
                } else {
                  segments.push({ font: { ...fontStyle, name: 'Times New Roman', size: enSize }, text: part });
                }
              }
              cell.value = { richText: segments };
            } else if (hasKhmer) {
              cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: khSize };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman', size: enSize };
            }
          } else {
            const enSize = fontStyle.size === 14 ? 14 : 12;
            cell.font = { ...fontStyle, name: 'Times New Roman', size: enSize };
          }
        });
      });
      
      // Fix borders for merged cells in row 2 (bottom dotted border)
      // ExcelJS requires applying borders to all cells in a merge to look right sometimes, but applying to the first is usually enough if others are empty, but we did includeEmpty: true
    };

    if (filterTxUserId === 'all') {
      const activeUsers = currentUser.role === 'Server' ? users.filter(u => u.role === 'User' || u.role === 'Admin' || u.role === 'Server') : managedUsers.filter(u => u.role === 'User');
      activeUsers.forEach(u => processUser(u));
    } else {
      const selectedUser = users.find(u => u.id === filterTxUserId);
      if (selectedUser) {
        processUser(selectedUser);
      }
    }

    // === VERIFY STOCK SHEET ===
    const verifyStockWs = workbook.addWorksheet('ស្តុករាប់បញ្ជាក់', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: { left: 0.39, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
      }
    });
    delete verifyStockWs.pageSetup.scale;
    verifyStockWs.pageSetup.fitToPage = true;
    verifyStockWs.pageSetup.fitToWidth = 1;
    verifyStockWs.pageSetup.fitToHeight = 1;
    verifyStockWs.headerFooter = { oddFooter: '&L&"Khmer OS Muol Light"ក្រវិល&C&"Khmer OS Muol Light"បាញ់លុយ' };
    
    verifyStockWs.addRow([`របាយការណ៍ស្តុករាប់បញ្ជាក់ ( ${dateRangeText} )`, null, null, null, null, null, null, null]);
    verifyStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកលក់", "ស្តុកសល់", "ផ្សេងៗ"]);
    let verifyRowIndex = 1;

    // === NEW TOTAL STOCK SHEET ===
    const totalStockWs = workbook.addWorksheet('ទិន្នន័យស្តុកសរុប', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: { left: 0.39, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
      }
    });
    delete totalStockWs.pageSetup.scale;
    totalStockWs.pageSetup.fitToPage = true;
    totalStockWs.pageSetup.fitToWidth = 1;
    totalStockWs.pageSetup.fitToHeight = 1;

    totalStockWs.headerFooter = { oddFooter: '&L&"Khmer OS Muol Light"ក្រវិល&C&"Khmer OS Muol Light"បាញ់លុយ' };
    
    totalStockWs.addRow([`របាយការណ៍ស្តុកសរុប ( ${dateRangeText} )`, null, null, null, null, null, null, null, null, null]);
    totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកដើមគ្រា", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);
    
    let totalRowIndex = 1;
    const localKhmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    const toKhmerNumeralLocal = (num: number) => {
      return num.toString().split('').map(digit => localKhmerNumerals[parseInt(digit)]).join('');
    };
    
    const globalHasAnySalesActivity = managedTransactions.some(t => {
      const dateStr = t.date ? t.date.split('T')[0] : '';
      const matchStart = !filterTxStartDate || dateStr >= filterTxStartDate;
      const matchEnd = !filterTxEndDate || dateStr <= filterTxEndDate;
      return matchStart && matchEnd && (t.type === 'Stock Sold' || t.type === 'Stock Return');
    });

    let previousDayStr = '';
    if (filterTxStartDate) {
      const d = new Date(filterTxStartDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      previousDayStr = `${year}-${month}-${day}`;
    }

    exportProductsList.forEach(p => {
      let dbName = p.code;
      if (dbName === 'WICE') dbName = 'WURKZ ICE';
      if (dbName === 'WURKZ ORD') dbName = 'W ORD';
      if (dbName === 'DAZZ ORD') dbName = 'D ORD';

      const actualProduct = products.find(prod => prod.name === dbName || prod.name === p.code);
      const currentStock = actualProduct?.warehouseStock || 0;

      let rangeStockIn = 0;
      let rangeStockOut = 0;
      let rangeStockReturn = 0;
      let rangeStockSold = 0;
      let rangeStockExchanged = 0;
      let rangeStockPromo = 0;

      let rollbackStockIn = 0;
      let rollbackStockOut = 0;
      let rollbackStockReturn = 0;
      let stockReturnPreviousDay = 0;
      let priorStockOut = 0;
      let priorStockSoldTotal = 0;

      warehouseStockIns.forEach((record: any) => {
        const dateStr = record.date ? record.date.split('T')[0] : '';
        const item = record.items?.find((i: any) => i.productName === actualProduct?.name || i.productName === dbName || i.productName === p.code);
        if (item && item.quantity) {
          const qty = Number(item.quantity);
          const matchStart = !filterTxStartDate || dateStr >= filterTxStartDate;
          const matchEnd = !filterTxEndDate || dateStr <= filterTxEndDate;
          if (matchStart && matchEnd) {
            rangeStockIn += qty;
          }
          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            rollbackStockIn += qty;
          } else if (!filterTxStartDate) {
            rollbackStockIn += qty;
          }
        }
      });

      managedTransactions.forEach(t => {
        let tName = t.productName;
        if (tName === 'WURKZ ICE') tName = 'WICE';
        if (tName === 'W ORD') tName = 'WURKZ ORD';
        if (tName === 'D ORD') tName = 'DAZZ ORD';
        
        if (tName === p.code) {
          const dateStr = t.date ? t.date.split('T')[0] : '';
          const matchStart = !filterTxStartDate || dateStr >= filterTxStartDate;
          const matchEnd = !filterTxEndDate || dateStr <= filterTxEndDate;
          
          if (matchStart && matchEnd) {
            if (t.type === 'Stock Out') rangeStockOut += t.quantity;
            if (t.type === 'Stock Return') rangeStockReturn += t.quantity;
            if (t.type === 'Stock Sold') {
               const soldOnly = (t as any).soldQty !== undefined ? (t as any).soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
               rangeStockSold += soldOnly;
               rangeStockPromo += (t.promoQty || 0);
               rangeStockExchanged += (t.exchangedQty || 0);
            }
          }

          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          } else if (!filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          }
          if (filterTxStartDate && previousDayStr && dateStr === previousDayStr) {
            if (t.type === 'Stock Return') stockReturnPreviousDay += t.quantity;
          }
          
          if (filterTxStartDate && dateStr < filterTxStartDate) {
            if (t.type === 'Stock Out') priorStockOut += t.quantity;
            if (t.type === 'Stock Sold') {
               const soldOnly = (t as any).soldQty !== undefined ? (t as any).soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
               priorStockSoldTotal += (soldOnly + (t.promoQty || 0) + ((t as any).exchangedQty || 0));
            }
          }
        }
      });

      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const closingStock = openingStock + rangeStockIn - rangeStockOut + rangeStockReturn;
      
      let verifyOpeningStock = openingStock;
      if (filterTxStartDate) {
         verifyOpeningStock = openingStock + priorStockOut - priorStockSoldTotal - stockReturnPreviousDay;
      }
      
      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - stockSoldTotal;
      
      verifyStockWs.addRow([
        toKhmerNumeralLocal(verifyRowIndex++),
        p.khmerName,
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        stockSoldTotal || null,
        verifyClosingStock || null,
        null
      ]);
      
      totalStockWs.addRow([
        toKhmerNumeralLocal(totalRowIndex++),
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        rangeStockOut || null,
        rangeStockReturn || null,
        rangeStockSold || null,
        rangeStockExchanged || null,
        rangeStockPromo || null,
        closingStock || null
      ]);
    });
    totalStockWs.mergeCells('A1:K1');
    totalStockWs.getRow(1).height = 35;
    totalStockWs.getRow(2).height = 35;
    for (let i = 3; i <= totalStockWs.rowCount; i++) {
      totalStockWs.getRow(i).height = 20;
    }
    totalStockWs.columns = [
      { width: 10 },  // ល.រ
      { width: 41 }, // ឈ្មោះទំនិញ
      { width: 17 }, // កូដសម្គាល់
      { width: 20 }, // ស្តុកដើមគ្រា
      { width: 16 }, // ស្តុកចូល
      { width: 16 }, // ស្តុកឡើងឡាន
      { width: 16 }, // ស្តុកត្រឡប់
      { width: 16 }, // ចំនួនលក់
      { width: 16 }, // ដូរក្រវិល
      { width: 16 }, // ចំនួនថែម
      { width: 16 }  // ស្តុកសល់
    ];
    totalStockWs.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 11) return;
        let borderStyle: Partial<ExcelJS.Borders> = {
          top: { style: 'thin', color: { argb: 'FF002060' } },
          bottom: { style: 'thin', color: { argb: 'FF002060' } },
          left: { style: 'thin', color: { argb: 'FF002060' } },
          right: { style: 'thin', color: { argb: 'FF002060' } }
        };
        if (rowNumber === 1) {
          borderStyle = {};
          cell.font = { name: 'Khmer OS Muol Light', size: 16, color: { argb: 'FF002060' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (rowNumber === 2) {
          cell.border = borderStyle;
          cell.font = { name: 'Khmer OS Muol Light', size: 10, color: { argb: 'FF002060' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.border = borderStyle;
          cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' };
          const fontStyle: Partial<ExcelJS.Font> = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2 || colNumber === 3) {
            cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: 11 };
          } else {
            if (cell.value != null && typeof cell.value === 'string' && /[\u1780-\u17FF\u19E0-\u19FF]/.test(cell.value)) {
              cell.font = { ...fontStyle, name: 'Khmer OS Siemreap', size: 11 };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman', size: 14 };
            }
          }
          if (colNumber === 11) {
            cell.font = { ...cell.font, color: { argb: 'FFFF0000' }, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } };
          }
        }
      });
    });


    // Formatting verifyStockWs
    verifyStockWs.mergeCells('A1:I1');
    verifyStockWs.getRow(1).height = 35;
    verifyStockWs.getRow(2).height = 35;
    for (let i = 3; i <= verifyStockWs.rowCount; i++) {
      verifyStockWs.getRow(i).height = 20;
    }
    verifyStockWs.columns = [
      { width: 10 }, // ល.រ
      { width: 41 }, // ឈ្មោះទំនិញ
      { width: 17 }, // កូដសម្គាល់
      { width: 16 }, // ស្តុកឃ្លាំង
      { width: 16 }, // ស្តុកចូល
      { width: 16 }, // ស្តុកលើឡាន
      { width: 16 }, // ស្តកលក់
      { width: 16 }, // ស្តុកសល់
      { width: 16 }  // ផ្សេងៗ
    ];
    verifyStockWs.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 9) return;
        let borderStyle = {
          top: { style: 'thin', color: { argb: 'FF002060' } },
          bottom: { style: 'thin', color: { argb: 'FF002060' } },
          left: { style: 'thin', color: { argb: 'FF002060' } },
          right: { style: 'thin', color: { argb: 'FF002060' } }
        };
        if (rowNumber === 1) {
          borderStyle = {};
          cell.font = { name: 'Khmer OS Muol Light', size: 16, color: { argb: 'FF002060' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (rowNumber === 2) {
          cell.border = borderStyle;
          cell.font = { name: 'Khmer OS Muol Light', size: 10, color: { argb: 'FF002060' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.border = borderStyle;
          cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' };
          const fontStyle = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2 || colNumber === 3) {
            cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: 11 };
          } else {
            if (cell.value != null && typeof cell.value === 'string' && /[\u1780-\u17FF\u19E0-\u19FF]/.test(cell.value)) {
              cell.font = { ...fontStyle, name: 'Khmer OS Siemreap', size: 11 };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman', size: 14 };
            }
          }
        }
      });
    });

    const fileName = `របាយការណ៍ស្តុកលក់_${dateRangeText.replace(/\//g, '-')}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };


  // Filtered transactions for Admin tab
  const filteredTransactions = managedTransactions.filter(t => {
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
          stockExchanged: number;
        stockPromo: number;
        stockReturn: number;
        totalSoldQty: number; // For total calculation if needed
      }
    } = {};

    // First populate with all active products in the system so we cover all products
    products.forEach(p => {
      groupedMap[p.name] = {
        productName: p.name,
        stockOut: 0,
        stockSold: 0,
        stockExchanged: 0,
        stockPromo: 0,
        stockReturn: 0,
        totalSoldQty: 0
      };
    });

    // Process filtered transactions
    filteredTransactions.forEach(t => {
      if (!groupedMap[t.productName]) {
        groupedMap[t.productName] = {
          productName: t.productName,
          stockOut: 0,
          stockSold: 0,
          stockExchanged: 0,
          stockPromo: 0,
          stockReturn: 0,
          totalSoldQty: 0
        };
      }
      
      const group = groupedMap[t.productName];
      if (t.type === 'Stock Out') {
        group.stockOut += t.quantity;
      } else if (t.type === 'Stock Sold') {
        group.totalSoldQty += t.quantity;
        if (t.soldQty !== undefined) {
          group.stockSold += t.soldQty;
        } else {
          // Fallback if soldQty is not recorded, we assume total quantity minus promoQty
          group.stockSold += Math.max(0, t.quantity - (t.promoQty || 0) - (t.exchangedQty || 0));
        }
        group.stockExchanged += (t.exchangedQty || 0);
        group.stockPromo += (t.promoQty || 0);
      } else if (t.type === 'Stock Return') {
        group.stockReturn += t.quantity;
      }
    });

    // Convert to array and filter out products with zero activity in the filtered range
    return Object.values(groupedMap)
      .filter(p => p.stockOut > 0 || p.totalSoldQty > 0 || p.stockPromo > 0 || p.stockReturn > 0)
      .sort((a, b) => a.productName.localeCompare(b.productName));
  })();

  const handleSaveReport = async () => {
    setLoading(true);
    try {
      for (const p of txGroupedByProduct) {
        const edited = editedReportData[p.productName];
        if (!edited) continue;
        
        const diffOut = (parseInt(edited.stockOut) || 0) - p.stockOut;
        const diffReturn = (parseInt(edited.stockReturn) || 0) - p.stockReturn;
        const diffSold = (parseInt(edited.stockSold) || 0) - p.stockSold;
        const diffExchanged = (parseInt(edited.stockExchanged) || 0) - p.stockExchanged;
        const diffPromo = (parseInt(edited.stockPromo) || 0) - p.stockPromo;
        
        const product = products.find(prod => prod.name === p.productName);
        if (!product) continue;

        if (diffOut !== 0) {
          const existingOut = filteredTransactions.find(t => t.type === 'Stock Out' && t.productName === p.productName);
          if (existingOut) {
            const newQty = existingOut.quantity + diffOut;
            if (newQty <= 0) {
               await deleteDoc(doc(db, 'transactions', existingOut.id));
            } else {
               await updateDoc(doc(db, 'transactions', existingOut.id), { quantity: newQty });
            }
          } else if (diffOut > 0) {
            const newTx = {
               id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
               userId: filterTxUserId === 'all' ? currentUser.id : filterTxUserId,
               type: 'Stock Out',
               productName: p.productName,
               quantity: diffOut,
               date: filterTxStartDate ? `${filterTxStartDate}T12:00:00.000Z` : new Date().toISOString(),
               createdBy: currentUser.username
            };
            await setDoc(doc(db, 'transactions', newTx.id), newTx);
          }
          await updateDoc(doc(db, 'products', product.id), { warehouseStock: increment(-diffOut) });
        }

        if (diffReturn !== 0) {
          const existingReturn = filteredTransactions.find(t => t.type === 'Stock Return' && t.productName === p.productName);
          if (existingReturn) {
            const newQty = existingReturn.quantity + diffReturn;
            if (newQty <= 0) {
               await deleteDoc(doc(db, 'transactions', existingReturn.id));
            } else {
               await updateDoc(doc(db, 'transactions', existingReturn.id), { quantity: newQty });
            }
          } else if (diffReturn > 0) {
            const newTx = {
               id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
               userId: filterTxUserId === 'all' ? currentUser.id : filterTxUserId,
               type: 'Stock Return',
               productName: p.productName,
               quantity: diffReturn,
               date: filterTxStartDate ? `${filterTxStartDate}T12:00:00.000Z` : new Date().toISOString(),
               createdBy: currentUser.username
            };
            await setDoc(doc(db, 'transactions', newTx.id), newTx);
          }
          await updateDoc(doc(db, 'products', product.id), { warehouseStock: increment(diffReturn) });
        }

        if (diffSold !== 0 || diffExchanged !== 0 || diffPromo !== 0) {
           const existingSold = filteredTransactions.find(t => t.type === 'Stock Sold' && t.productName === p.productName);
           if (existingSold) {
              const newSold = (existingSold.soldQty !== undefined ? existingSold.soldQty : Math.max(0, existingSold.quantity - (existingSold.promoQty || 0) - (existingSold.exchangedQty || 0))) + diffSold;
              const newEx = (existingSold.exchangedQty || 0) + diffExchanged;
              const newPro = (existingSold.promoQty || 0) + diffPromo;
              const newTot = newSold + newEx + newPro;

              if (newTot <= 0) {
                 await deleteDoc(doc(db, 'transactions', existingSold.id));
              } else {
                 await updateDoc(doc(db, 'transactions', existingSold.id), {
                   quantity: newTot,
                   soldQty: newSold > 0 ? newSold : deleteField(),
                   exchangedQty: newEx > 0 ? newEx : deleteField(),
                   promoQty: newPro > 0 ? newPro : deleteField()
                 });
              }
           } else if (diffSold > 0 || diffExchanged > 0 || diffPromo > 0) {
              const newTx = {
                 id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                 userId: filterTxUserId === 'all' ? currentUser.id : filterTxUserId,
                 type: 'Stock Sold',
                 productName: p.productName,
                 quantity: diffSold + diffExchanged + diffPromo,
                 soldQty: diffSold > 0 ? diffSold : undefined,
                 exchangedQty: diffExchanged > 0 ? diffExchanged : undefined,
                 promoQty: diffPromo > 0 ? diffPromo : undefined,
                 date: filterTxStartDate ? `${filterTxStartDate}T12:00:00.000Z` : new Date().toISOString(),
                 createdBy: currentUser.username,
                 price: product.price || 0
              };
              // remove undefined keys for firestore
              Object.keys(newTx).forEach(key => (newTx as any)[key] === undefined && delete (newTx as any)[key]);
              await setDoc(doc(db, 'transactions', newTx.id), newTx);
           }
        }
      }
      setIsEditingReport(false);
    } catch (e) {
      console.error(e);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort stock orders
  const filteredStockOrders = [...managedStockOrders]
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
        <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4">
          <div className="flex justify-between items-center mb-2 sm:mb-3 border-b border-slate-100 pb-2 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">បញ្ជីអ្នកប្រើប្រាស់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធ</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsបង្កើតUserModalOpen(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បង្កើតអ្នកប្រើប្រាស់</span>
              </button>
            </div>
          </div>
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">ឈ្មោះអ្នកប្រើប្រាស់</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">លេខសម្ងាត់</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">តួនាទី</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">លេខទូរសព្ទ</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">ផ្លាកលេខឡាន</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">តំបន់លក់</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {managedUsers.map(user => (
                    <tr 
                      key={user.id} 
                      onClick={() => setSelectedUserDetail(user)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-2 md:px-4 py-2 font-bold text-slate-800">{user.username}</td>
                      <td className="px-2 md:px-4 py-2 font-mono font-medium text-slate-500">{user.password}</td>
                      <td className="px-2 md:px-4 py-2">
                        <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] md:text-xs font-bold ${user.role === 'Server' ? 'bg-indigo-100 text-indigo-700' : user.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {user.role === 'Server' ? 'ប្រព័ន្ធមេ' : user.role === 'Admin' ? 'អ្នកគ្រប់គ្រង' : 'បុគ្គលិកលក់'}
                        </span>
                      </td>
                      <td className="px-2 md:px-4 py-2 text-slate-600">{user.phone || '-'}</td>
                      <td className="px-2 md:px-4 py-2 text-slate-600">{user.carPlate || '-'}</td>
                      <td className="px-2 md:px-4 py-2 text-slate-600">{user.salesArea || '-'}</td>
                    </tr>
                  ))}
                  {managedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">គ្មានទិន្នន័យ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4">
          <div className="flex justify-between items-center mb-2 sm:mb-3 border-b border-slate-100 pb-2 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">បញ្ជីទំនិញ</h3>
                <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">គ្រប់គ្រងទំនិញ និងកម្មវិធីប្រម៉ូសិន</p>
              </div>
              {currentUser.role === 'Server' && (
                <div className="sm:ml-4">
                  <select
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-[10px] sm:text-xs font-bold text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">បង្ហាញអ្នកគ្រប់គ្រងទាំងអស់</option>
                    {users.filter(u => u.role === 'Admin').map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsបង្កើតProductModalOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>បន្ថែមទំនិញ</span>
            </button>
          </div>
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">ឈ្មោះទំនិញ</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100 text-right">តម្លៃ ($)</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100 text-center">កម្មវិធីប្រម៉ូសិន ទិញនិងថែម</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {getFilteredProducts().map(product => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedProductDetail(product)}
                    >
                      <td className="px-2 md:px-4 py-2 font-bold text-slate-800">{product.name}</td>
                      <td className="px-2 md:px-4 py-2 text-right font-black text-indigo-600">
                        {product.price !== undefined && product.price !== null ? `$${Number(product.price).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-2 md:px-4 py-2 text-center">
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
                  {getFilteredProducts().length === 0 && (
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
        <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 border-b border-slate-100 pb-2 shrink-0 gap-2">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ប្រតិបត្តិការទាំងអស់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">របាយការណ៍ផ្ទៀងផ្ទាត់ និងតុល្យភាពស្តុកទំនិញ</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isEditingReport ? (
                <button
                  onClick={() => {
                    const initialData: Record<string, any> = {};
                    txGroupedByProduct.forEach(p => {
                      initialData[p.productName] = {
                        stockOut: String(p.stockOut),
                        stockSold: String(p.stockSold),
                        stockExchanged: String(p.stockExchanged),
                        stockPromo: String(p.stockPromo),
                        stockReturn: String(p.stockReturn)
                      };
                    });
                    setEditedReportData(initialData);
                    setIsEditingReport(true);
                  }}
                  className="flex items-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>កែប្រែ</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditingReport(false)}
                    className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold active:scale-95 transition cursor-pointer"
                  >
                    <span>បោះបង់</span>
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleSaveReport}
                    className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                       <span>កំពុងរក្សាទុក...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>រក្សាទុក</span>
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={handleExportSelectedUserStockExcel}
                className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>នាំចេញ Excel</span>
              </button>
              <button
                onClick={handleExportSelectedUserStockPDF}
                className="flex items-center space-x-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>នាំចេញ PDF</span>
              </button>
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
                {(currentUser.role === 'Server'
                  ? users.filter(u => u.role === 'User')
                  : managedUsers.filter(u => u.role === 'User')
                ).map(u => (
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
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                  <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-rose-500">ស្តុកឡើង</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-emerald-600">ស្តុកលក់</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-violet-500">ប្ដូរប្រវិល</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-amber-500">ស្តុកថែម</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-indigo-600">ស្តុកត្រឡប់</th>
                  <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-600">បញ្ជាក់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                {(() => {
                  const hasAnySalesActivity = txGroupedByProduct.some(p => (p.totalSoldQty + p.stockReturn) > 0);
                  
                  return txGroupedByProduct.map(p => {
                    const diff = p.stockOut - (p.stockSold + p.stockExchanged + p.stockPromo + p.stockReturn);
                    let badge = null;
                    
                    if (!hasAnySalesActivity && diff > 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black text-slate-400">-</span>;
                  } else if (diff === 0) {
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
                      <td className="px-1.5 md:px-3 py-2 text-left font-bold text-slate-800">
                        {p.productName}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-rose-500">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-rose-400"
                            value={editedReportData[p.productName]?.stockOut ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockOut: e.target.value } }))}
                          />
                        ) : (p.stockOut || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-emerald-600">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-emerald-400"
                            value={editedReportData[p.productName]?.stockSold ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockSold: e.target.value } }))}
                          />
                        ) : (p.stockSold || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-violet-500">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-violet-400"
                            value={editedReportData[p.productName]?.stockExchanged ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockExchanged: e.target.value } }))}
                          />
                        ) : (p.stockExchanged || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-amber-500">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-amber-400"
                            value={editedReportData[p.productName]?.stockPromo ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockPromo: e.target.value } }))}
                          />
                        ) : (p.stockPromo || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-indigo-600">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-indigo-400"
                            value={editedReportData[p.productName]?.stockReturn ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockReturn: e.target.value } }))}
                          />
                        ) : (p.stockReturn || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center">
                        {badge}
                      </td>
                    </tr>
                  )
                  });
                })()}
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
          <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកឡើងឡានរបស់អ្នកប្រើប្រាស់</h3>
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
                  {(currentUser.role === 'Server'
                    ? users.filter(u => u.role === 'User')
                    : managedUsers.filter(u => u.role === 'User')
                  ).map(u => (
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
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
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
                        <td className="px-1.5 md:px-3 py-2 text-left font-black text-indigo-900 text-[11px] sm:text-xs md:text-sm">
                          {user?.username || 'Unknown'}
                        </td>
                        {/* Column 2: Customer / Note Name */}
                        <td className="px-1.5 md:px-3 py-2 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                          {inv.customerName}
                        </td>
                        {/* Column 3: Location */}
                        <td className="px-1.5 md:px-3 py-2 text-left">
                          {inv.location ? (
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                              {inv.location}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                        {/* Column 4: Date */}
                        <td className="px-1.5 md:px-3 py-2 text-center font-medium text-slate-500 whitespace-nowrap">
                          {(() => {
                            const d = new Date(inv.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const shortYear = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${shortYear}`;
                          })()}
                        </td>
                        {/* Column 5: Product list stacked */}
                        <td className="px-1.5 md:px-3 py-2 text-left font-medium text-slate-700">
                          <div className="flex flex-col space-y-1.5">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                                {item.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* Column 6: បរិមាណ list stacked */}
                        <td className="px-1.5 md:px-3 py-2 text-center font-medium">
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
          <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកលក់ចេញរបស់អ្នកប្រើប្រាស់</h3>
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
                  {(currentUser.role === 'Server'
                    ? users.filter(u => u.role === 'User')
                    : managedUsers.filter(u => u.role === 'User')
                  ).map(u => (
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
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
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
                        <td className="px-1.5 md:px-3 py-2 text-left font-black text-indigo-900 text-[11px] sm:text-xs md:text-sm">
                          {user?.username || 'Unknown'}
                        </td>
                        {/* Column 2: Customer / Note Name */}
                        <td className="px-1.5 md:px-3 py-2 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                          {inv.customerName}
                        </td>
                        {/* Column 3: Location */}
                        <td className="px-1.5 md:px-3 py-2 text-left">
                          {inv.location ? (
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                              {inv.location}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                        {/* Column 4: Date */}
                        <td className="px-1.5 md:px-3 py-2 text-center font-medium text-slate-500 whitespace-nowrap">
                          {(() => {
                            const d = new Date(inv.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const shortYear = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${shortYear}`;
                          })()}
                        </td>
                        {/* Column 5: Product list stacked */}
                        <td className="px-1.5 md:px-3 py-2 text-left font-medium text-slate-700">
                          <div className="flex flex-col space-y-1.5">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                                {item.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* Column 6: បរិមាណ list stacked */}
                        <td className="px-1.5 md:px-3 py-2 text-center font-medium">
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
          <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកត្រឡប់របស់អ្នកប្រើប្រាស់</h3>
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
                  {(currentUser.role === 'Server'
                    ? users.filter(u => u.role === 'User')
                    : managedUsers.filter(u => u.role === 'User')
                  ).map(u => (
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
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
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
                        <td className="px-1.5 md:px-3 py-2 text-left font-black text-indigo-900 text-[11px] sm:text-xs md:text-sm">
                          {user?.username || 'Unknown'}
                        </td>
                        {/* Column 2: Customer / Note Name */}
                        <td className="px-1.5 md:px-3 py-2 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                          {inv.customerName}
                        </td>
                        {/* Column 3: Location */}
                        <td className="px-1.5 md:px-3 py-2 text-left">
                          {inv.location ? (
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                              {inv.location}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                        {/* Column 4: Date */}
                        <td className="px-1.5 md:px-3 py-2 text-center font-medium text-slate-500 whitespace-nowrap">
                          {(() => {
                            const d = new Date(inv.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const shortYear = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${shortYear}`;
                          })()}
                        </td>
                        {/* Column 5: Product list stacked */}
                        <td className="px-1.5 md:px-3 py-2 text-left font-medium text-slate-700">
                          <div className="flex flex-col space-y-1.5">
                            {inv.items.map((item: any, idx: number) => (
                              <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                                {item.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* Column 6: បរិមាណ list stacked */}
                        <td className="px-1.5 md:px-3 py-2 text-center font-medium">
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
        <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4">
          <div className="flex justify-between items-center mb-2 sm:mb-3 border-b border-slate-100 pb-2 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ស្តុកកម្មង់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">ការកម្មង់សរុប៖ {stockOrders.length} ជួរ</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* ស្ថានភាព filter */}
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
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
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
                      <td className="px-1.5 md:px-3 py-2 text-left font-black text-slate-800 text-[11px] sm:text-xs md:text-sm">
                        {orderGroup.username}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-left font-bold text-slate-700 text-[11px] sm:text-xs md:text-sm">
                        {orderGroup.customerName || <span className="text-slate-300">គ្មានឈ្មោះ</span>}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-left">
                        {orderGroup.location ? (
                          <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600">
                            {orderGroup.location}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
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
                      <td className="px-1.5 md:px-3 py-2 text-left font-medium text-slate-700">
                        <div className="flex flex-col space-y-1.5">
                          {orderGroup.items.map((item: any, idx: number) => (
                            <div key={idx} className="h-6 flex items-center font-bold text-slate-800 text-[10px] sm:text-xs truncate">
                              {item.productName}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-medium">
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
        <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">ស្តុកឃ្លាំង </h3>
              <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0.5 font-medium">គ្រប់គ្រងចំនួនស្តុកប្រព័ន្ធ ផ្ទៀងផ្ទាត់ស្តុកជាក់ស្តែង និងបញ្ចូលស្តុកថ្មី</p>
            </div>
          </div>

          {/* Metrics Dashboard Grid */}
          <div className="flex overflow-x-auto custom-scroll gap-2 mb-3 shrink-0 pb-1">
            <div className="bg-slate-50/50 border border-slate-100 p-2 rounded-xl flex items-center space-x-2 min-w-[140px] flex-1">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">មុខទំនិញសរុប</p>
                <h4 className="text-xs sm:text-sm font-black text-slate-700">{products.length} មុខ</h4>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-2 rounded-xl flex items-center space-x-2 min-w-[140px] flex-1">
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ស្តុកប្រព័ន្ធសរុប</p>
                <h4 className="text-xs sm:text-sm font-black text-sky-600">
                  {products.reduce((acc, p) => acc + (p.warehouseStock || 0), 0).toLocaleString()} ឯកតា
                </h4>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-2 rounded-xl flex items-center space-x-2 min-w-[140px] flex-1">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ស្តុកជាក់ស្តែងសរុប</p>
                <h4 className="text-xs sm:text-sm font-black text-emerald-600">
                  {products.reduce((acc, p) => acc + (p.actualStock !== undefined ? p.actualStock : 0), 0).toLocaleString()} ឯកតា
                </h4>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-2 rounded-xl flex items-center space-x-2 min-w-[140px] flex-1">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ចំនួនលម្អៀង</p>
                <h4 className="text-xs sm:text-sm font-black text-amber-600">
                  {products.filter(p => p.actualStock !== undefined && p.actualStock !== (p.warehouseStock || 0)).length} មុខ
                </h4>
              </div>
            </div>
          </div>

          {/* ស្វែងរក bar and Stock In Button */}
          <div className="mb-2 flex gap-2 shrink-0 items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="ស្វែងរកទំនិញក្នុងឃ្លាំង..."
                value={warehouseSearchQuery}
                onChange={(e) => setWarehouseSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsStockInHistoryOpen(true)}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-sm active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">ប្រវត្តិស្តុកចូល</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStockInDeliverer('Admin');
                setStockInItems([]);
                setIsStockInModalOpen(true);
              }}
              className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-sky-600/10 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>ស្តុកចូល</span>
            </button>
          </div>

          {/* Table Container */}
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-[11px] uppercase font-bold tracking-wider border-b border-slate-100">
                  <th className="px-1 md:px-3 py-2 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-sky-600 bg-sky-50/10">ស្តុកប្រព័ន្ធ </th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-emerald-600 bg-emerald-50/10">ស្តុកជាក់ស្តែង </th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-slate-500">កម្រិតលម្អៀង </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-[11px] md:text-xs">
                {filteredWarehouseProducts.map(product => {
                  const sysStock = product.warehouseStock || 0;
                  const actStock = product.actualStock;
                  const draftVal = actualStockDrafts[product.id];
                  const currentActualVal = draftVal !== undefined ? (draftVal === '' ? undefined : parseInt(draftVal)) : actStock;
                  const hasTake = currentActualVal !== undefined && !isNaN(currentActualVal);
                  const variance = hasTake ? currentActualVal - sysStock : 0;
                  const isDirty = draftVal !== undefined && draftVal !== String(actStock ?? '');

                  return (
                    <tr 
                      key={product.id} 
                      onClick={() => {
                        setProductToកែប្រែWarehouseStock(product);
                        setកែប្រែWarehouseStockVal(String(sysStock));
                        setIsកែប្រែWarehouseStockModalOpen(true);
                      }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-1 md:px-3 py-1.5">
                        <div className="font-bold text-slate-800">{product.name}</div>
                      </td>
                      <td className="px-1 md:px-3 py-1.5 text-center font-black text-sky-600 bg-sky-50/5">
                        {sysStock.toLocaleString()}
                      </td>
                      <td className="px-1 md:px-3 py-1.5 bg-emerald-50/5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center mx-auto">
                          <input
                            type="number"
                            min="0"
                            placeholder="បញ្ចូលចំនួន..."
                            value={draftVal !== undefined ? draftVal : (actStock !== undefined ? String(actStock) : '')}
                            onChange={(e) => setActualStockDrafts({
                              ...actualStockDrafts,
                              [product.id]: e.target.value
                            })}
                            onBlur={() => {
                              if (isDirty) {
                                handleរក្សាទុកActualStock(product);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isDirty) {
                                handleរក្សាទុកActualStock(product);
                              }
                            }}
                            className="w-16 sm:w-20 text-center py-1 px-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-black text-slate-800"
                          />
                        </div>
                      </td>
                      <td className="px-1 md:px-3 py-1.5 text-center font-bold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsStockInModalOpen(false); setStockInItems([]); }}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">បញ្ចូលស្តុកចូល</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួនស្តុកបន្ថែម</p>
              </div>
              <button onClick={() => { setIsStockInModalOpen(false); setStockInItems([]); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleរក្សាទុកStockIn} className="flex flex-col min-h-0 flex-1">
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

                {/* Upload Section */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-bold text-slate-500 px-1">រូបភាពវិក្កយបត្រ ឬកំណត់ត្រា</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                    <div className="flex-1 flex items-center justify-between border border-slate-200 rounded-2xl p-1 bg-slate-50 min-w-0">
                      <button
                        type="button"
                        onClick={() => stockInFileInputRef.current?.click()}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer border border-transparent whitespace-nowrap shrink-0"
                      >
                        ជ្រើសរើសរូបភាព
                      </button>
                      <span className="text-[11px] sm:text-xs text-slate-500 font-bold px-3 sm:px-4 truncate flex-1 text-right min-w-0">
                        {stockInFileName || "មិនទាន់ជ្រើសរើសឯកសារឡើយ"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={stockInFileInputRef}
                        onChange={handleStockInImageUpload}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleStockInScan}
                      disabled={stockInScannerLoading || !stockInImage}
                      className="bg-sky-400 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-sky-400/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                    >
                      {stockInScannerLoading ? 'កំពុងស្កេន...' : 'ស្កេនទាញយកទិន្នន័យ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const existingNames = new Set(stockInItems.map(i => i.productName));
                        const newItems = products
                          .filter(p => !existingNames.has(p.name))
                          .map(p => ({ productName: p.name, quantity: '' }));
                        setQuickAddItems(newItems);
                        setIsQuickAddModalOpen(true);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-emerald-500/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                    >
                      + បញ្ចូលរហ័សទាំងអស់
                    </button>
                  </div>
                </div>

                {stockInImage && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative h-48 md:h-64 flex items-center justify-center">
                     <img src={stockInImage} alt="Scanned Note" className="max-h-full object-contain" />
                  </div>
                )}

                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 px-1">ទិន្នន័យ (ស្កេន ឬបញ្ចូលដោយដៃ)</label>
                  </div>
                  
                  {stockInItems.length > 0 ? (
                    <div className="border border-slate-200 rounded-2xl overflow-y-auto custom-scroll flex-1 max-h-[40vh]">
                      <table className="w-full text-left text-sm min-w-[500px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs sticky top-0 z-10">
                          <tr>
                            <th className="p-3">ឈ្មោះទំនិញ / ផលិតផល</th>
                            <th className="p-3 w-24 text-center">បរិមាណ</th>
                            <th className="p-3 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stockInItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="p-2">
                                <select
                                  value={item.productName}
                                  onChange={(e) => updateStockInRow(idx, 'productName', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-sky-400 outline-none transition cursor-pointer truncate"
                                >
                                  {products.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e => updateStockInRow(idx, 'quantity', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-xs focus:border-sky-400 outline-none font-bold text-slate-800 transition"
                                  required
                                  placeholder="ចំនួន"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeStockInRow(idx)}
                                  className="p-2 hover:bg-rose-50 text-rose-400 hover:text-rose-500 rounded-lg transition"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-2xl py-12 px-4 text-center text-slate-400 bg-slate-50/50 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-bold text-sm">មិនទាន់មានទិន្នន័យ។ សូមស្កេន ឬបន្ថែមដោយដៃ។</p>
                    </div>
                  )}
                </div>
              </div>
{/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50/50 flex space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockInModalOpen(false);
                    setStockInItems([]);
                  }}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading || stockInItems.length === 0}
                  className="flex-[2] bg-sky-500 hover:bg-sky-600 disabled:opacity-70 text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-sky-500/20 active:scale-[0.98] transition"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {manualAddMode !== 'none' && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setManualAddMode('none')}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800">
                {manualAddMode === 'all' ? 'បញ្ចូលរហ័សទាំងអស់' : 'បន្ថែមទំនិញ'}
              </h3>
              <button onClick={() => setManualAddMode('none')} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden flex-1">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="ស្វែងរកទំនិញ..."
                  value={manualAddSearchText}
                  onChange={e => setManualAddSearchText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <div className="flex-1 overflow-auto custom-scroll border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-48">ឈ្មោះទំនិញ</th>
                      {aiScannerType === 'Stock Sold' ? (
                        <>
                          <th className="p-3 w-20 text-center">លក់</th>
                          <th className="p-3 w-20 text-center">ក្រវិល</th>
                          <th className="p-3 w-20 text-center">ថែម</th>
                          <th className="p-3 w-20 text-center font-bold text-sky-600">សរុប</th>
                        </>
                      ) : (
                        <th className="p-3 w-24 text-center">បរិមាណ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {manualAddItems.filter(item => item.productName.toLowerCase().includes(manualAddSearchText.toLowerCase())).map((item) => {
                      const actualIdx = manualAddItems.findIndex(mi => mi.id === item.id);
                      return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="p-2">
                          <select
                            value={item.productName}
                            onChange={e => {
                              const pName = e.target.value;
                              const actual = products.find(p => p.name === pName);
                              const newItems = [...manualAddItems];
                              newItems[actualIdx] = { ...item, productName: pName, matchedProductId: actual?.id, actualProduct: actual };
                              setManualAddItems(newItems);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition truncate"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        {aiScannerType === 'Stock Sold' ? (
                          <>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.soldQty || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const newItems = [...manualAddItems];
                                  newItems[actualIdx] = { ...item, soldQty: val, quantity: val + item.exchangedQty };
                                  setManualAddItems(newItems);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.exchangedQty || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const newItems = [...manualAddItems];
                                  newItems[actualIdx] = { ...item, exchangedQty: val, quantity: item.soldQty + val };
                                  setManualAddItems(newItems);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.promoQty || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const newItems = [...manualAddItems];
                                  newItems[actualIdx] = { ...item, promoQty: val, quantity: item.soldQty + item.exchangedQty };
                                  setManualAddItems(newItems);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-amber-600 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                              />
                            </td>
                            <td className="p-2">
                              <div className="w-full bg-slate-100 rounded-xl px-2 py-1.5 text-xs font-black text-sky-600 text-center border border-slate-100">
                                {item.quantity}
                              </div>
                            </td>
                          </>
                        ) : (
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity || ''}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                const newItems = [...manualAddItems];
                                newItems[actualIdx] = { ...item, quantity: val };
                                setManualAddItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                            />
                          </td>
                        )}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50/50 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setManualAddMode('none')}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  if (manualAddMode === 'all') {
                    // Replace or append? For "all", usually replace is better, but append works too.
                    const newResults = [...aiScannerResults];
                    manualAddItems.forEach(item => {
                      if (item.quantity > 0) {
                        const existingIdx = newResults.findIndex(r => r.matchedProductId === item.matchedProductId);
                        if (existingIdx >= 0) {
                          newResults[existingIdx].quantity += item.quantity;
                          newResults[existingIdx].soldQty = (newResults[existingIdx].soldQty || 0) + item.soldQty;
                          newResults[existingIdx].exchangedQty = (newResults[existingIdx].exchangedQty || 0) + item.exchangedQty;
                          newResults[existingIdx].promoQty = (newResults[existingIdx].promoQty || 0) + item.promoQty;
                        } else {
                          newResults.push(item);
                        }
                      }
                    });
                    setAiScannerResults(newResults);
                  } else {
                    setAiScannerResults([...aiScannerResults, ...manualAddItems]);
                  }
                  setManualAddMode('none');
                }}
                className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition"
              >
                បញ្ជាក់ឲ្យចូល
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Quick Add Modal */}
      {isQuickAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsQuickAddModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800">បញ្ចូលរហ័សទាំងអស់</h3>
              <button onClick={() => setIsQuickAddModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden flex-1">
              <div className="flex-1 overflow-auto custom-scroll border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-48">ឈ្មោះទំនិញ</th>
                      <th className="p-3 w-24 text-center">បរិមាណ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quickAddItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition">
                        <td className="p-2">
                          <select
                            value={item.productName}
                            onChange={e => {
                              const copy = [...quickAddItems];
                              copy[index].productName = e.target.value;
                              setQuickAddItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition truncate"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity || ''}
                            onChange={e => {
                              const copy = [...quickAddItems];
                              copy[index].quantity = e.target.value;
                              setQuickAddItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                            placeholder="ចំនួន"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50/50 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  const validItems = quickAddItems.filter(item => item.quantity && Number(item.quantity) > 0);
                  setStockInItems([...stockInItems, ...validItems]);
                  setIsQuickAddModalOpen(false);
                }}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm py-3 rounded-2xl transition shadow-md shadow-sky-500/20"
              >
                រក្សាទុក
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* កែប្រែស្តុកឃ្លាំង Modal */}
      {isកែប្រែWarehouseStockModalOpen && productToកែប្រែWarehouseStock && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">កែប្រែស្តុកឃ្លាំង (កែប្រែស្តុកឃ្លាំង)</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">កែប្រែចំនួនស្តុកប្រព័ន្ធសម្រាប់ទំនិញ <span className="font-bold text-slate-800">"{productToកែប្រែWarehouseStock.name}"</span></p>

            <form onSubmit={handleរក្សាទុកWarehouseStock} className="space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">ស្តុកប្រព័ន្ធបច្ចុប្បន្ន (ស្តុកប្រព័ន្ធ)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="ឧ. ១០០"
                  value={editWarehouseStockVal}
                  onChange={(e) => setកែប្រែWarehouseStockVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-black"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsកែប្រែWarehouseStockModalOpen(false);
                    setProductToកែប្រែWarehouseStock(null);
                    setកែប្រែWarehouseStockVal('');
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

      {/* Custom បញ្ជាក់ation Modal for Deleting User */}
      {userToលុប && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុប</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបអ្នកប្រើប្រាស់ <span className="font-bold text-slate-800">"{userToលុប.username}"</span> នេះមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setUserToលុប(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleលុបUser(userToលុប.id)}
                className="flex-1 hover:bg-rose-700 bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom បញ្ជាក់ation Modal for Deleting Product */}
      {productToលុប && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុប</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបទំនិញ <span className="font-bold text-slate-800">"{productToលុប.name}"</span> នេះមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setProductToលុប(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleលុបProduct(productToលុប.id)}
                className="flex-1 hover:bg-rose-700 bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isAIScannerModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAIScannerModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800">បញ្ចូលទិន្នន័យវៃឆ្លាត (ស្កេន AI)</h3>
              <button onClick={() => setIsAIScannerModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scroll flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 px-1">អ្នកប្រើប្រាស់</label>
                  <select
                    value={aiScannerUserId}
                    onChange={e => setAiScannerUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition outline-none font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="">-- ជ្រើសរើសអ្នកប្រើប្រាស់ --</option>
                    {(currentUser.role === 'Server'
                      ? users.filter(u => u.role === 'User')
                      : managedUsers.filter(u => u.role === 'User')
                    ).map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 px-1">ប្រភេទប្រតិបត្តិការ</label>
                  <select
                    value={aiScannerType}
                    onChange={e => setAiScannerType(e.target.value as TransactionType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition outline-none font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="Stock Out">ស្តុកឡើងឡាន</option>
                    <option value="Stock Sold">ស្តុកលក់ចេញ</option>
                    <option value="Stock Return">ស្តុកត្រឡប់</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                  <input
                    type="date"
                    value={aiScannerDate || getNowLocalDate()}
                    onChange={e => setAiScannerDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition outline-none font-bold text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-bold text-slate-500 px-1">រូបភាពវិក្កយបត្រ ឬកំណត់ត្រា</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                  <div className="flex-1 flex items-center justify-between border border-slate-200 rounded-2xl p-1 bg-slate-50 min-w-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer border border-transparent whitespace-nowrap shrink-0"
                    >
                      ជ្រើសរើសរូបភាព
                    </button>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-bold px-3 sm:px-4 truncate flex-1 text-right min-w-0">
                      {aiScannerFileName || "មិនទាន់ជ្រើសរើសឯកសារឡើយ"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleAIImageUpload}
                      className="hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAIScan}
                    disabled={aiScannerLoading || !aiScannerImage}
                    className="bg-sky-400 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-sky-400/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                  >
                    {aiScannerLoading ? 'កំពុងស្កេន...' : 'ស្កេនទាញយកទិន្នន័យ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const items = products.map(p => ({
                        id: Date.now().toString() + Math.random().toString(),
                        productName: p.name,
                        quantity: 0,
                        soldQty: 0,
                        exchangedQty: 0,
                        promoQty: 0,
                        matchedProductId: p.id,
                        actualProduct: p
                      }));
                      setManualAddItems(items);
                      setManualAddMode('all');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-emerald-500/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                  >
                    + បញ្ចូលរហ័សទាំងអស់
                  </button>
                </div>
              </div>

              {aiScannerImage && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative h-48 md:h-64 flex items-center justify-center">
                   <img src={aiScannerImage} alt="Scanned Note" className="max-h-full object-contain" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 px-1">ទិន្នន័យ (ស្កេន ឬបញ្ចូលដោយដៃ)</label>
                  
                </div>
                {aiScannerResults.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[500px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                        <tr>
                          <th className="p-3">ឈ្មោះទំនិញ / ផលិតផល</th>
                          {aiScannerType === 'Stock Sold' ? (
                            <>
                              <th className="p-3 w-20 text-center">លក់</th>
                              <th className="p-3 w-20 text-center">ក្រវិល</th>
                              <th className="p-3 w-20 text-center">ថែម</th>
                              <th className="p-3 w-20 text-center font-bold text-sky-600">សរុប</th>
                            </>
                          ) : (
                            <th className="p-3 w-24 text-center">បរិមាណ</th>
                          )}
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {aiScannerResults.map((item, idx) => (
                          <tr key={item.id} className={item.actualProduct ? 'bg-emerald-50/30' : 'bg-rose-50/30'}>
                            <td className="p-2">
                              <select
                                value={item.actualProduct ? item.actualProduct.name : item.productName}
                                onChange={(e) => {
                                  const newResults = [...aiScannerResults];
                                  const selectedName = e.target.value;
                                  const prod = products.find(p => p.name === selectedName);
                                  if (prod) {
                                    newResults[idx].productName = prod.name;
                                    newResults[idx].matchedProductId = prod.id;
                                    newResults[idx].actualProduct = prod;
                                  } else {
                                    newResults[idx].productName = selectedName;
                                    newResults[idx].matchedProductId = undefined;
                                    newResults[idx].actualProduct = undefined;
                                  }
                                  setAiScannerResults(newResults);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:border-sky-400 outline-none font-bold text-slate-700 cursor-pointer"
                              >
                                {item.actualProduct ? null : <option value={item.productName}>{item.productName} (មិនមានក្នុងស្តុក)</option>}
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            {aiScannerType === 'Stock Sold' ? (
                              <>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.soldQty || ''}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) || 0;
                                      const newResults = [...aiScannerResults];
                                      newResults[idx].soldQty = val;
                                      newResults[idx].quantity = val + (newResults[idx].exchangedQty || 0);
                                      setAiScannerResults(newResults);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.exchangedQty || ''}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) || 0;
                                      const newResults = [...aiScannerResults];
                                      newResults[idx].exchangedQty = val;
                                      newResults[idx].quantity = (newResults[idx].soldQty || 0) + val;
                                      setAiScannerResults(newResults);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.promoQty || ''}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) || 0;
                                      const newResults = [...aiScannerResults];
                                      newResults[idx].promoQty = val;
                                      newResults[idx].quantity = (newResults[idx].soldQty || 0) + (newResults[idx].exchangedQty || 0);
                                      setAiScannerResults(newResults);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                                  />
                                </td>
                                <td className="p-2">
                                  <div className="w-full bg-sky-50 border border-sky-100 rounded-xl px-2 py-1.5 text-xs font-black text-sky-700 text-center">
                                    {item.quantity}
                                  </div>
                                </td>
                              </>
                            ) : (
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newResults = [...aiScannerResults];
                                    newResults[idx].quantity = Number(e.target.value) || 0;
                                    setAiScannerResults(newResults);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:border-sky-400 outline-none font-bold text-slate-700 text-center"
                                />
                              </td>
                            )}
                            <td className="p-2 w-10 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setAiScannerResults(aiScannerResults.filter((_, i) => i !== idx));
                                }}
                                className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                                title="លុប"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-400 text-sm">មិនទាន់មានទិន្នន័យ។ សូមស្កេន ឬបន្ថែមដោយដៃ។</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-50 bg-slate-50/50 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAIScannerModalOpen(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={aiScannerLoading || aiScannerResults.length === 0}
                onClick={handleAISave}
                className="flex-[2] bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-sky-500/20 active:scale-[0.98] transition"
              >
                {aiScannerLoading ? 'កំពុងរក្សាទុក...' : 'យល់ព្រមរក្សាទុក'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isបង្កើតUserModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsបង្កើតUserModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">បង្កើតអ្នកប្រើប្រាស់ថ្មី</h3>
              <button 
                onClick={() => setIsបង្កើតUserModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleបង្កើតUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអ្នកប្រើប្រាស់</label>
                <input
                  type="text"
                  value={newឈ្មោះអ្នកប្រើប្រាស់}
                  onChange={e => setNewឈ្មោះអ្នកប្រើប្រាស់(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
                <input
                  type="text"
                  value={newពាក្យសម្ងាត់}
                  onChange={e => setNewពាក្យសម្ងាត់(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តួនាទី</label>
                {currentUser.role === 'Server' ? (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setNewUserRole('User')}
                      className={`flex-1 py-3.5 px-4 rounded-2xl text-xs md:text-sm font-bold transition border ${newUserRole === 'User' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      បុគ្គលិកលក់
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole('Admin')}
                      className={`flex-1 py-3.5 px-4 rounded-2xl text-xs md:text-sm font-bold transition border ${newUserRole === 'Admin' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      អ្នកគ្រប់គ្រង
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole('Server')}
                      className={`flex-1 py-3.5 px-4 rounded-2xl text-xs md:text-sm font-bold transition border ${newUserRole === 'Server' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      ប្រព័ន្ធមេ
                    </button>
                  </div>
                ) : (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-indigo-700">
                    បុគ្គលិកលក់
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខទូរសព្ទ (Phone)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ផ្លាកលេខឡាន (Car Plate)</label>
                <input
                  type="text"
                  value={newCarPlate}
                  onChange={e => setNewCarPlate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តំបន់លក់ (Sales Area)</label>
                <input
                  type="text"
                  value={newSalesArea}
                  onChange={e => setNewSalesArea(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                />
              </div>
              <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsបង្កើតUserModalOpen(false)}
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

      {isបង្កើតProductModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsបង្កើតProductModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">បន្ថែមទំនិញថ្មី</h3>
              <button 
                onClick={() => setIsបង្កើតProductModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleបង្កើតProduct} className="p-6 space-y-4">
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
                  value={newProductតម្លៃ}
                  onChange={e => setNewProductតម្លៃ(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  placeholder="បញ្ចូលតម្លៃ (ឧទាហរណ៍៖ 5.5)"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs font-bold text-slate-500">កម្មវិធីប្រម៉ូសិន ទិញនិងថែម (Multi-Promotion)</p>
                  <button
                    type="button"
                    onClick={addបង្កើតPromoRow}
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
                            onChange={e => updateបង្កើតPromoRow(idx, 'buyQty', e.target.value)}
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
                            onChange={e => updateបង្កើតPromoRow(idx, 'getQty', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-xs focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                            placeholder="1"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeបង្កើតPromoRow(idx)}
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
                        onClick={addបង្កើតPromoRow}
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
                    onClick={() => setIsបង្កើតProductModalOpen(false)}
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

      {productToកែប្រែ && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProductToកែប្រែ(null)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">កែប្រែព័ត៌មានទំនិញ</h3>
              <button 
                onClick={() => setProductToកែប្រែ(null)}
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
                  onChange={e => setកែប្រែProductName(e.target.value)}
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
                  value={editProductតម្លៃ}
                  onChange={e => setកែប្រែProductតម្លៃ(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  placeholder="បញ្ចូលតម្លៃ (ឧទាហរណ៍៖ 5.5)"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs font-bold text-slate-500">កម្មវិធីប្រម៉ូសិន ទិញនិងថែម (Multi-Promotion)</p>
                  <button
                    type="button"
                    onClick={addកែប្រែPromoRow}
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
                            onChange={e => updateកែប្រែPromoRow(idx, 'buyQty', e.target.value)}
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
                            onChange={e => updateកែប្រែPromoRow(idx, 'getQty', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-xs focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                            placeholder="1"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeកែប្រែPromoRow(idx)}
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
                        onClick={addកែប្រែPromoRow}
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
                    onClick={() => setProductToកែប្រែ(null)}
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

      {transactionToលុប && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setTransactionToលុប(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុប</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">តើអ្នកពិតជាចង់លុបប្រតិបត្តិការនេះមែនទេ?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setTransactionToលុប(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={() => handleលុបTransaction(transactionToលុប.id)}
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
                  {isកែប្រែingTransaction ? 'កែប្រែព័ត៌មានលម្អិត' : 'ព័ត៌មានលម្អិត'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedTransactionDetail.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : selectedTransactionDetail.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedTransactionDetail(null);
                  setIsកែប្រែingTransaction(false);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isកែប្រែingTransaction ? (
              <form onSubmit={handleUpdateTransaction} className="py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំនួន</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={e => setកែប្រែបរិមាណ(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>

                {/* Live pricing display for editing transaction */}
                {(() => {
                  const product = products.find(p => p.name === selectedTransactionDetail.productName);
                  const qtyVal = parseInt(editQuantity) || 0;
                  const hasតម្លៃ = product && product.price !== undefined && product.price !== null;
                  const subtotal = hasតម្លៃ && qtyVal > 0 ? product.price * qtyVal : 0;
                  if (product) {
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex justify-between items-center px-4 text-xs font-medium text-slate-500">
                        <span>
                          {hasតម្លៃ ? (
                            <span>តម្លៃឯកតា៖ <span className="font-bold text-slate-700">${product.price?.toFixed(2)}</span></span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </span>
                        {hasតម្លៃ && qtyVal > 0 && (
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
                    onChange={e => setកែប្រែNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-medium text-slate-800 h-24 resize-none"
                    placeholder="គ្មានចំណាំ"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsកែប្រែingTransaction(false)}
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
                      setIsកែប្រែingTransaction(true);
                      setកែប្រែបរិមាណ(String(selectedTransactionDetail.quantity));
                      setកែប្រែNote(selectedTransactionDetail.note || '');
                    }}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                  >
                    កែប្រែ
                  </button>
                  <button
                    onClick={() => {
                      setTransactionToលុប(selectedTransactionDetail);
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
                  {isកែប្រែingUser ? 'កែប្រែអ្នកប្រើប្រាស់' : 'ព័ត៌មានអ្នកប្រើប្រាស់'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedUserDetail(null);
                  setIsកែប្រែingUser(false);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isកែប្រែingUser ? (
              <form onSubmit={handleUpdateUser} className="py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអ្នកប្រើប្រាស់</label>
                  <input
                    type="text"
                    value={editឈ្មោះអ្នកប្រើប្រាស់}
                    onChange={e => setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
                  <input
                    type="text"
                    value={editពាក្យសម្ងាត់}
                    onChange={e => setកែប្រែពាក្យសម្ងាត់(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តួនាទី</label>
                  {currentUser.role === 'Server' ? (
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setEditUserRole('User')}
                        className={`flex-1 py-3 px-3 rounded-2xl text-[11px] md:text-xs font-bold transition border ${editUserRole === 'User' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                      >
                        បុគ្គលិកលក់
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUserRole('Admin')}
                        className={`flex-1 py-3 px-3 rounded-2xl text-[11px] md:text-xs font-bold transition border ${editUserRole === 'Admin' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                      >
                        អ្នកគ្រប់គ្រង
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUserRole('Server')}
                        className={`flex-1 py-3 px-3 rounded-2xl text-[11px] md:text-xs font-bold transition border ${editUserRole === 'Server' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                      >
                        ប្រព័ន្ធមេ
                      </button>
                    </div>
                  ) : (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-3 text-sm font-bold text-indigo-700">
                      {selectedUserDetail.id === currentUser.id ? 'អ្នកគ្រប់គ្រង' : 'បុគ្គលិកលក់'}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខទូរសព្ទ</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ផ្លាកលេខឡាន</label>
                  <input
                    type="text"
                    value={editCarPlate}
                    onChange={e => setEditCarPlate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តំបន់លក់</label>
                  <input
                    type="text"
                    value={editSalesArea}
                    onChange={e => setEditSalesArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsកែប្រែingUser(false)}
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
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${selectedUserDetail.role === 'Server' ? 'bg-indigo-100 text-indigo-700' : selectedUserDetail.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {selectedUserDetail.role}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">លេខទូរសព្ទ</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{selectedUserDetail.phone || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">ផ្លាកលេខឡាន</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{selectedUserDetail.carPlate || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">តំបន់លក់</span>
                    <span className="col-span-2 text-sm font-black text-slate-800">{selectedUserDetail.salesArea || '-'}</span>
                  </div>
                  {currentUser.role === 'Server' && selectedUserDetail.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => setShowAdminUsersList(true)}
                      className="w-full mt-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-3.5 rounded-2xl transition cursor-pointer flex items-center justify-center space-x-2 border border-emerald-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>បង្ហាញគណនីបុគ្គលិក ({users.filter(u => u.createdBy === selectedUserDetail.id).length})</span>
                    </button>
                  )}
                </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsកែប្រែingUser(true);
                        setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(selectedUserDetail.username);
                        setកែប្រែពាក្យសម្ងាត់(selectedUserDetail.password || '');
                        setEditUserRole(selectedUserDetail.role);
                        setEditPhone(selectedUserDetail.phone || '');
                        setEditCarPlate(selectedUserDetail.carPlate || '');
                        setEditSalesArea(selectedUserDetail.salesArea || '');
                      }}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                    >
                      កែប្រែ
                    </button>
                    {selectedUserDetail.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          setUserToលុប(selectedUserDetail);
                          setSelectedUserDetail(null);
                        }}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                      >
                        លុប
                      </button>
                    )}
                  </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {showAdminUsersList && selectedUserDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowAdminUsersList(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800">
                  បុគ្គលិករបស់ Admin: {selectedUserDetail.username}
                </h3>
                <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5 font-medium">គណនីទាំងអស់ដែលគ្រប់គ្រងដោយអ្នកគ្រប់គ្រងនេះ</p>
              </div>
              <button 
                onClick={() => setShowAdminUsersList(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="py-4 max-h-[300px] overflow-y-auto custom-scroll">
              {users.filter(u => u.createdBy === selectedUserDetail.id).length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  មិនទាន់មានគណនីបុគ្គលិកឡើយ
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                      <th className="py-2 px-3">ឈ្មោះអ្នកប្រើប្រាស់</th>
                      <th className="py-2 px-3">លេខសម្ងាត់</th>
                      <th className="py-2 px-3">លេខទូរសព្ទ</th>
                      <th className="py-2 px-3">ផ្លាកលេខឡាន</th>
                      <th className="py-2 px-3">តំបន់លក់</th>
                      <th className="py-2 px-3 text-right">តួនាទី</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.filter(u => u.createdBy === selectedUserDetail.id).map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{u.username}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-500">{u.password}</td>
                        <td className="py-2.5 px-3 text-slate-600">{u.phone || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{u.carPlate || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{u.salesArea || '-'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            {u.role === 'Admin' ? 'Admin' : 'User'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAdminUsersList(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                បិទ
              </button>
            </div>
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
                  setProductToកែប្រែ(selectedProductDetail);
                  setកែប្រែProductName(selectedProductDetail.name);
                  setកែប្រែProductតម្លៃ(selectedProductDetail.price !== undefined ? String(selectedProductDetail.price) : '');
                  setកែប្រែProductPromoBuy(selectedProductDetail.promoBuyQty !== undefined ? String(selectedProductDetail.promoBuyQty) : '');
                  setកែប្រែProductPromoGet(selectedProductDetail.promoGetQty !== undefined ? String(selectedProductDetail.promoGetQty) : '');
                  
                  if (selectedProductDetail.promotions && selectedProductDetail.promotions.length > 0) {
                    setកែប្រែProductPromotions(selectedProductDetail.promotions.map(p => ({ buyQty: p.buyQty, getQty: p.getQty })));
                  } else if (selectedProductDetail.promoBuyQty && selectedProductDetail.promoGetQty) {
                    setកែប្រែProductPromotions([{ buyQty: selectedProductDetail.promoBuyQty, getQty: selectedProductDetail.promoGetQty }]);
                  } else {
                    setកែប្រែProductPromotions([]);
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
                  setProductToលុប(selectedProductDetail);
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
      {isបង្កើតOrderModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto custom-scroll animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base md:text-lg font-black text-slate-800">បញ្ចូលស្តុកកម្មង់ថ្មី</h3>
              <button 
                onClick={() => setIsបង្កើតOrderModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdminបង្កើតStockOrder} className="space-y-4">
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
                  const hasតម្លៃ = product && product.price !== undefined && product.price !== null;
                  const subtotal = hasតម្លៃ && qtyVal > 0 ? product.price * qtyVal : 0;

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
                            {hasតម្លៃ ? (
                              <span>តម្លៃឯកតា៖ <span className="font-bold text-slate-700">${product.price?.toFixed(2)}</span></span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </span>
                          {hasតម្លៃ && qtyVal > 0 && (
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
                  onClick={() => setIsបង្កើតOrderModalOpen(false)}
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

      {orderToលុប && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុបកម្មង់</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបការកម្មង់ <span className="font-bold text-slate-800">"{orderToលុប.productName} ({orderToលុប.quantity})"</span> របស់ <span className="font-bold text-slate-800">{orderToលុប.username}</span> នេះមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setOrderToលុប(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => handleAdminលុបOrder(orderToលុប.id)}
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
                {isកែប្រែingOrder ? 'កែប្រែព័ត៌មានការកម្មង់' : 'ព័ត៌មានលម្អិតពីការកម្មង់'}
              </h3>
              <button 
                onClick={() => {
                  setSelectedOrderDetail(null);
                  setIsកែប្រែingOrder(false);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isកែប្រែingOrder ? (
              <form onSubmit={handleAdminកែប្រែOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">អ្នកប្រើប្រាស់ / ឡាន</label>
                  <select
                    value={editOrderUserId}
                    onChange={e => setកែប្រែOrderUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800 cursor-pointer"
                    required
                  >
                    {managedUsers.filter(u => u.role === 'User').map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះទំនិញ</label>
                    <select
                      value={editOrderProductName}
                      onChange={e => setកែប្រែOrderProductName(e.target.value)}
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
                      onChange={e => setកែប្រែOrderQuantity(e.target.value)}
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
                  const hasតម្លៃ = product && product.price !== undefined && product.price !== null;
                  const subtotal = hasតម្លៃ && qtyVal > 0 ? product.price * qtyVal : 0;
                  if (product) {
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex justify-between items-center px-4 text-xs font-medium text-slate-500">
                        <span>
                          {hasតម្លៃ ? (
                            <span>តម្លៃឯកតា៖ <span className="font-bold text-slate-700">${product.price?.toFixed(2)}</span></span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </span>
                        {hasតម្លៃ && qtyVal > 0 && (
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
                      onChange={e => setកែប្រែOrderDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ស្ថានភាពប្រគល់</label>
                    <select
                      value={String(editOrderDelivered)}
                      onChange={e => setកែប្រែOrderDelivered(e.target.value === 'true')}
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
                      onChange={e => setកែប្រែOrderCustomerName(e.target.value)}
                      placeholder="ឈ្មោះអតិថិជន..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ទីតាំង</label>
                    <input
                      type="text"
                      value={editOrderLocation}
                      onChange={e => setកែប្រែOrderLocation(e.target.value)}
                      placeholder="ទីតាំង..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsកែប្រែingOrder(false)}
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
                                    setOrderToកែប្រែ(item);
                                    setកែប្រែOrderUserId(item.userId);
                                    setកែប្រែOrderProductName(item.productName);
                                    setកែប្រែOrderQuantity(String(item.quantity));
                                    setកែប្រែOrderDate(item.date);
                                    const { customer, location } = getOrderCustomerAndLocation(item.note || '');
                                    setកែប្រែOrderCustomerName(customer);
                                    setកែប្រែOrderLocation(location);
                                    setកែប្រែOrderDelivered(item.delivered);
                                    setIsកែប្រែingOrder(true);
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
                                    setOrderToលុប(item);
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
                      onClick={() => handleAdminបញ្ជាក់Delivery(selectedOrderDetail)}
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

                          {/* បរិមាណ */}
                          <div className={`${selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-2" : "col-span-4"} text-center`}>
                            <span className={`font-black text-xs ${
                                selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'text-emerald-600' : 
                                selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'text-rose-600' : 'text-amber-600'
                              }`}>
                              {item.quantity}
                            </span>
                          </div>

                          {/* តម្លៃ and សរុបរង */}
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

              {/* តម្លៃសរុប */}
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

            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStartEditFullInvoice(selectedInvoiceDetail)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-amber-500/10 min-w-[120px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>កែប្រែវិក្កយបត្រ</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setInvoiceToលុប(selectedInvoiceDetail)}
                className="flex-1 hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold text-[10px] sm:text-xs py-2.5 rounded-2xl transition flex items-center justify-center space-x-1 cursor-pointer min-w-[120px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>លុបវិក្កយបត្រទាំងមូល</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportSingleInvoicePDF(selectedInvoiceDetail)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-100 min-w-[120px]"
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

      {/* Floating Modal for Editing Entire Invoice */}
      {editingFullInvoice && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  កែប្រែវិក្កយបត្រទាំងមូល ({editingFullInvoice.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : editingFullInvoice.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  កែប្រែព័ត៌មានអតិថិជន កាលបរិច្ឆេទ និងទំនិញទាំងអស់ក្នុងវិក្កយបត្រនេះ
                </p>
              </div>
              <button
                onClick={() => setEditingFullInvoice(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scroll">
              {/* Header Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">
                    {editingFullInvoice.type === 'Stock Sold' ? 'ឈ្មោះអតិថិជន' : editingFullInvoice.type === 'Stock Out' ? 'អ្នកប្រគល់' : 'អ្នកទទួល'}
                  </label>
                  <input
                    type="text"
                    value={editingFullInvoice.customerName}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, customerName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                    placeholder="ឈ្មោះអតិថិជន..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">ទីតាំង</label>
                  <input
                    type="text"
                    value={editingFullInvoice.location}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, location: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                    placeholder="ទីតាំង..."
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">កាលបរិច្ឆេទ</label>
                  <input
                    type="date"
                    value={editingFullInvoice.date ? editingFullInvoice.date.split('T')[0] : ''}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Item Rows Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    បញ្ជីទំនិញក្នុងវិក្កយបត្រ ({editingFullInvoice.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultProd = products[0];
                      const newPrice = defaultProd?.price || 0;
                      setEditingFullInvoice({
                        ...editingFullInvoice,
                        items: [
                          ...editingFullInvoice.items,
                          {
                            productName: defaultProd?.name || '',
                            quantity: 1,
                            price: editingFullInvoice.type === 'Stock Sold' ? newPrice : '',
                            promoQty: 0
                          }
                        ]
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl transition flex items-center space-x-1 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>+ ថែមទំនិញ</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="divide-y divide-slate-100">
                    {editingFullInvoice.items.map((item, idx) => {
                      const qtyNum = parseFloat(String(item.quantity)) || 0;
                      const prNum = parseFloat(String(item.price)) || 0;
                      const prodObj = products.find(p => p.name === item.productName);
                      const computedPromo = (editingFullInvoice.type === 'Stock Sold' && prodObj)
                        ? calculatePromoQtyWithតម្លៃCheck(prodObj, qtyNum, prNum)
                        : 0;
                      return (
                        <div key={idx} className="p-2 sm:p-3 bg-slate-50/50 hover:bg-slate-50 transition space-y-1.5">
                          <div className="flex items-end gap-1.5 sm:gap-2 w-full">
                            {/* Product selection */}
                            <div className="flex-1 min-w-0">
                              <label className="text-[10px] font-bold text-slate-400 block sm:hidden mb-1">ឈ្មោះទំនិញ</label>
                              <select
                                value={item.productName}
                                onChange={e => {
                                  const newProdName = e.target.value;
                                  const newProd = products.find(p => p.name === newProdName);
                                  const newPrice = newProd?.price !== undefined ? newProd.price : item.price;
                                  const updated = [...editingFullInvoice.items];
                                  updated[idx] = {
                                    ...updated[idx],
                                    productName: newProdName,
                                    price: editingFullInvoice.type === 'Stock Sold' ? newPrice : item.price
                                  };
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-400 truncate"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Quantity */}
                            <div className="w-16 sm:w-24 shrink-0">
                              <label className="text-[10px] font-bold text-slate-400 block sm:hidden mb-1">បរិមាណ</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => {
                                  const updated = [...editingFullInvoice.items];
                                  updated[idx] = { ...updated[idx], quantity: e.target.value };
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-black text-center text-slate-800 outline-none focus:border-amber-400"
                                placeholder="ចំនួន"
                              />
                            </div>
                            {/* Price (if Stock Sold) */}
                            {editingFullInvoice.type === 'Stock Sold' && (
                              <div className="w-16 sm:w-24 shrink-0">
                                <label className="text-[10px] font-bold text-slate-400 block sm:hidden mb-1">តម្លៃ ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.price}
                                  onChange={e => {
                                    const updated = [...editingFullInvoice.items];
                                    updated[idx] = { ...updated[idx], price: e.target.value };
                                    setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-right text-slate-800 outline-none focus:border-amber-400"
                                  placeholder="តម្លៃ"
                                />
                              </div>
                            )}
                            {/* Subtotal & Delete button */}
                            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                              {editingFullInvoice.type === 'Stock Sold' && (
                                <div className="hidden sm:block text-right w-16">
                                  <span className="text-xs font-black text-indigo-600">
                                    ${(qtyNum * prNum).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingFullInvoice.items.length <= 1) {
                                    alert("វិក្កយបត្រត្រូវតែមានយ៉ាងហោចណាស់ទំនិញមួយ");
                                    return;
                                  }
                                  const updated = editingFullInvoice.items.filter((_, i) => i !== idx);
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="p-1.5 hover:bg-rose-100 text-rose-500 rounded-lg transition cursor-pointer"
                                title="លុបទំនិញនេះ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {/* Promo display if computedPromo > 0 */}
                          {computedPromo > 0 && (
                            <div className="text-[10px] font-black text-emerald-600 pl-1">
                              🎁 ថែមឥតគិតថ្លៃ: +{computedPromo}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Total Cost Summary */}
              {editingFullInvoice.type === 'Stock Sold' && (() => {
                const grandTotal = editingFullInvoice.items.reduce((sum, item) => {
                  const q = parseFloat(String(item.quantity)) || 0;
                  const p = parseFloat(String(item.price)) || 0;
                  return sum + (q * p);
                }, 0);
                return (
                  <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl">
                    <span className="text-xs font-black text-indigo-900">តម្លៃសរុបវិក្កយបត្រ</span>
                    <span className="text-lg font-black text-indigo-600">${grandTotal.toFixed(2)}</span>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingFullInvoice(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-2.5 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveFullInvoice}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 transition disabled:opacity-70 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {loading ? (
                  <span>កំពុងរក្សាទុក...</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>រក្សាទុកវិក្កយបត្រ</span>
                  </>
                )}
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
                  handleកែប្រែTransactionClick(item);
                }}
                className="w-full hover:bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>កែប្រែ (កែប្រែ)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = selectedRowItem;
                  setSelectedRowItem(null);
                  setSelectedInvoiceDetail(null);
                  setTransactionToលុប(item);
                }}
                className="w-full hover:bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>លុប (លុប)</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRowItem(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-2xl transition cursor-pointer"
            >
              បិទ (បិទ)
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* បញ្ជាក់ation Modal for Deleting Entire Invoice */}
      {invoiceToលុប && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុបវិក្កយបត្រ</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបវិក្កយបត្ររបស់អតិថិជន <span className="font-bold text-slate-800">"{invoiceToលុប.customerName}"</span> នេះទាំងស្រុងមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setInvoiceToលុប(null)}
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
                    await Promise.all(invoiceToលុប.items.map(async (item: any) => {
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

                    await Promise.all(invoiceToលុប.items.map((item: any) => deleteDoc(doc(db, 'transactions', item.id))));
                    setInvoiceToលុប(null);
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

      {/* Floating Modal for កែប្រែing Transaction */}
      {transactionToកែប្រែ && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md max-h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  កែប្រែប្រតិបត្តិការ {transactionToកែប្រែ.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : transactionToកែប្រែ.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">កែប្រែព័ត៌មានខាងក្រោមដើម្បីរក្សាទុក</p>
              </div>
              <button 
                onClick={() => setTransactionToកែប្រែ(null)} 
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
                    onChange={e => setកែប្រែTxDate(e.target.value)}
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
                      onChange={e => setកែប្រែTxProductName(e.target.value)}
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

                {/* បរិមាណ Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំនួនទំនិញ</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={e => setកែប្រែបរិមាណ(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-black text-slate-800"
                    required
                    min="1"
                    placeholder="ចំនួន"
                  />
                </div>

                {/* តម្លៃ Input (Only for Stock Sold) */}
                {transactionToកែប្រែ.type === 'Stock Sold' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តម្លៃឯកតា ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editTxតម្លៃ}
                      onChange={e => setកែប្រែTxតម្លៃ(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-black text-slate-800"
                      required
                      min="0"
                      placeholder="តម្លៃឯកតា"
                    />
                  </div>
                )}

                {/* Customer Name & Location (Only for Stock Sold) */}
                {transactionToកែប្រែ.type === 'Stock Sold' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអតិថិជន</label>
                      <input
                        type="text"
                        value={editTxCustomerName}
                        onChange={e => setកែប្រែTxCustomerName(e.target.value)}
                        placeholder="ឈ្មោះអតិថិជន..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ទីតាំង</label>
                      <input
                        type="text"
                        value={editTxLocation}
                        onChange={e => setកែប្រែTxLocation(e.target.value)}
                        placeholder="ទីតាំង..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Note (For non-Stock Sold transactions) */}
                {transactionToកែប្រែ.type !== 'Stock Sold' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំណាំ (ឈ្មោះអ្នកប្រគល់/ទទួល)</label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={e => setកែប្រែNote(e.target.value)}
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
                  onClick={() => setTransactionToកែប្រែ(null)}
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
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">ប្រវត្តិស្តុកចូល </h3>
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
                  setStockInToកែប្រែ(selectedStockInRecord);
                  setកែប្រែStockInDate(selectedStockInRecord.date);
                  setកែប្រែStockInDeliverer(selectedStockInRecord.deliverer);
                  setកែប្រែStockInItems(selectedStockInRecord.items.map((i: any) => ({ productName: i.productName, quantity: String(i.quantity) })));
                  setIsកែប្រែStockInModalOpen(true);
                }}
                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                កែប្រែ
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockInToលុប(selectedStockInRecord);
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

      {/* កែប្រែ Stock In Modal */}
      {isកែប្រែStockInModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl max-h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">កែប្រែស្តុកចូល </h3>
                <p className="text-xs text-slate-500 font-medium">កែប្រែទិន្នន័យស្តុកដែលបានបញ្ចូល</p>
              </div>
              <button 
                onClick={() => setIsកែប្រែStockInModalOpen(false)} 
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
                      onChange={e => setកែប្រែStockInDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-sky-400 outline-none font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">អ្នកប្រគល់ស្តុក</label>
                    <input
                      type="text"
                      value={editStockInDeliverer}
                      onChange={e => setកែប្រែStockInDeliverer(e.target.value)}
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
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition duration-200">
                          <div className="flex-1 min-w-0">
                            <select
                              value={item.productName}
                              onChange={(e) => {
                                const newItems = [...editStockInItems];
                                newItems[idx].productName = e.target.value;
                                setកែប្រែStockInItems(newItems);
                              }}
                              className="w-full bg-transparent border-none px-2 py-1 text-sm font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer truncate"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-28 relative shrink-0">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const newItems = [...editStockInItems];
                                newItems[idx].quantity = e.target.value;
                                setកែប្រែStockInItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-sky-400 outline-none font-black text-slate-800 pr-10 text-center"
                              placeholder="0"
                              required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold pointer-events-none">
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
                  onClick={() => setIsកែប្រែStockInModalOpen(false)}
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

      {/* Custom បញ្ជាក់ation Modal for Deleting Stock In History */}
      {stockInToលុប && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុបស្តុកចូល</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបប្រវត្តិស្តុកចូលកាលពីថ្ងៃទី <span className="font-bold text-slate-800">"{stockInToលុប.date}"</span> នេះមែនទេ? ចំនួនទំនិញនឹងត្រូវកាត់ចេញពីឃ្លាំងវិញ។ ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStockInToលុប(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleលុបStockIn(stockInToលុប)}
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
