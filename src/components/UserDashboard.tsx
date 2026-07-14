import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Transaction, TransactionType, Product, StockOrder } from '../types';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserDashboardProps {
  currentUser: User;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  products: Product[];
  stockOrders: StockOrder[];
  activeTab: TransactionType | 'Report' | 'Stock Order';
}

export default function UserDashboard({ currentUser, transactions, setTransactions, products, stockOrders, activeTab }: UserDashboardProps) {
  interface StockItemInput {
    productName: string;
    quantity: string;
  }

  const [items, setItems] = useState<StockItemInput[]>([{ productName: '', quantity: '' }]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editProductName, setEditProductName] = useState('');

  // Stock Order Specific States
  const [reportSubTab, setReportSubTab] = useState<'total' | 'orders'>('total');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StockOrder | null>(null);
  const [orderItems, setOrderItems] = useState<StockItemInput[]>([{ productName: '', quantity: '' }]);
  const [orderNote, setOrderNote] = useState('');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered'>('all');

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

  const openOrderModal = () => {
    setOrderItems([{ productName: '', quantity: '' }]);
    setOrderNote('');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setOrderDate(`${yyyy}-${mm}-${dd}`);
    setIsOrderModalOpen(true);
  };

  const handleCreateStockOrder = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await Promise.all(validItems.map(async (item, index) => {
        const qty = parseInt(item.quantity);
        const newOrder: StockOrder = {
          id: `order-${Date.now()}-${index}`,
          userId: currentUser.id,
          username: currentUser.username,
          productName: item.productName,
          quantity: qty,
          date: orderDate,
          note: orderNote,
          delivered: false
        };

        await setDoc(doc(db, 'stock_orders', newOrder.id), newOrder);
      }));

      setIsOrderModalOpen(false);
      setOrderItems([{ productName: '', quantity: '' }]);
      setOrderNote('');
    } catch (error) {
      console.error("Error creating stock order: ", error);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const orderDocRef = doc(db, 'stock_orders', orderId);
      await updateDoc(orderDocRef, {
        delivered: true,
        deliveredAt: new Date().toISOString(),
        deliveredBy: currentUser.username
      });
    } catch (error) {
      console.error("Error confirming delivery: ", error);
      alert("មានបញ្ហាក្នុងការធ្វើបច្ចុប្បន្នភាពទិន្នន័យ");
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);
  const [editQuantity, setEditQuantity] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setEditProductName(t.productName);
    setEditQuantity(String(t.quantity));
    
    const tDate = t.date ? new Date(t.date) : new Date();
    const validDate = isNaN(tDate.getTime()) ? new Date() : tDate;
    const yyyy = validDate.getFullYear();
    const mm = String(validDate.getMonth() + 1).padStart(2, '0');
    const dd = String(validDate.getDate()).padStart(2, '0');
    setEditDate(`${yyyy}-${mm}-${dd}`);
    setEditNote(t.note || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    if (!editProductName) {
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
      const origDate = editingTransaction.date ? new Date(editingTransaction.date) : new Date();
      const safeOrigDate = isNaN(origDate.getTime()) ? new Date() : origDate;
      const selectedDate = new Date(editDate);
      
      if (!isNaN(selectedDate.getTime())) {
        selectedDate.setHours(
          safeOrigDate.getHours(),
          safeOrigDate.getMinutes(),
          safeOrigDate.getSeconds(),
          safeOrigDate.getMilliseconds()
        );
      }

      const updatedTransaction = {
        productName: editProductName,
        quantity: qty,
        date: selectedDate.toISOString(),
        note: editNote
      };

      await updateDoc(doc(db, 'transactions', editingTransaction.id), updatedTransaction);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error updating transaction: ", error);
      alert("មានបញ្ហាក្នុងការកែប្រែទិន្នន័យ");
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
      alert("មានបញ្ហាក្នុងការលុបប្រតិបត្តិការ");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setItems([{ productName: '', quantity: '' }]);
    setNote('');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { productName: '', quantity: '' }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof StockItemInput, value: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Divide the transaction history according to different menus/tabs (e.g. Stock Sold, Stock Out, Stock Return)
  const userTransactions = transactions.filter(t => t.userId === currentUser.id && (activeTab === 'Report' ? true : t.type === activeTab));

  const sortedTransactions = [...userTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const activePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize);

  const filteredReportTransactions = transactions.filter(t => {
    if (t.userId !== currentUser.id) return false;
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(t.date) < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(t.date) > end) return false;
    }
    return true;
  });

  const handleExportPDF = () => {
    const activeProducts = products.map(product => {
      const loaded = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Out').reduce((sum, t) => sum + t.quantity, 0);
      const sold = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold').reduce((sum, t) => sum + t.quantity, 0);
      const returned = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Return').reduce((sum, t) => sum + t.quantity, 0);
      return { product, loaded, sold, returned };
    }).filter(item => item.loaded > 0 || item.sold > 0 || item.returned > 0);

    if (activeProducts.length === 0) {
      alert("គ្មានទិន្នន័យទំនិញសម្រាប់នាំចេញឡើយ");
      return;
    }

    let dateRangeText = "ទាំងអស់";
    if (filterStartDate && filterEndDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      dateRangeText = `${formatDate(filterStartDate)} ដល់ ${formatDate(filterEndDate)}`;
    } else if (filterStartDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      dateRangeText = `ចាប់ពី ${formatDate(filterStartDate)}`;
    } else if (filterEndDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      dateRangeText = `រហូតដល់ ${formatDate(filterEndDate)}`;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("សូមអនុញ្ញាតឲ្យបើក Pop-up ដើម្បីទាញយក PDF");
      return;
    }

    const rowsHtml = activeProducts.map(({ product, loaded, sold, returned }) => {
      const balance = loaded - sold - returned;
      let statusText = `ត្រឹមត្រូវ ${balance}`;
      let statusColor = "color: #059669;"; 
      if (balance < 0) {
        statusText = `លើស ${Math.abs(balance)}`;
        statusColor = "color: #d97706;"; 
      } else if (balance > 0) {
        statusText = `បាត់ ${balance}`;
        statusColor = "color: #e11d48;"; 
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: bold; text-align: left; color: #1e293b;">${product.name}</td>
          <td style="padding: 12px; font-weight: bold; color: #e11d48; text-align: center;">${loaded}</td>
          <td style="padding: 12px; font-weight: bold; color: #059669; text-align: center;">${sold}</td>
          <td style="padding: 12px; font-weight: bold; color: #d97706; text-align: center;">${returned}</td>
          <td style="padding: 12px; font-weight: bold; text-align: right; ${statusColor}">${statusText}</td>
        </tr>
      `;
    }).join('');

    const documentContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>របាយការណ៍ស្តុកសរុប - ${dateRangeText}</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;700&family=Inter:wght@400;500;700&display=swap');
            body {
              font-family: 'Kantumruy Pro', 'Inter', sans-serif;
              color: #334155;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 24px;
              color: #0f172a;
              margin: 0 0 10px 0;
              font-weight: 700;
            }
            .header p {
              font-size: 14px;
              color: #64748b;
              margin: 0;
            }
            .meta-info {
              margin-bottom: 30px;
              font-size: 14px;
            }
            .meta-info div {
              margin-bottom: 8px;
            }
            .meta-info span.label {
              font-weight: 700;
              color: #475569;
              display: inline-block;
              width: 140px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 700;
              padding: 12px;
              border-bottom: 2px solid #e2e8f0;
              font-size: 13px;
            }
            td {
              font-size: 13px;
            }
            .footer {
              margin-top: 60px;
              text-align: right;
              font-size: 12px;
              color: #94a3b8;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>របាយការណ៍ស្តុកសរុប</h1>
            <p>ប្រព័ន្ធគ្រប់គ្រងការលក់ និងស្តុកទំនិញ</p>
          </div>

          <div class="meta-info">
            <div><span class="label">កាលបរិច្ឆេទរបាយការណ៍៖</span> ${dateRangeText}</div>
            <div><span class="label">ថ្ងៃទីនាំចេញ៖</span> ${new Date().toLocaleString('km-KH')}</div>
            <div><span class="label">អ្នកនាំចេញ៖</span> ${currentUser.username || 'អ្នកប្រើប្រាស់'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">ឈ្មោះទំនិញ</th>
                <th style="text-align: center;">ឡើងឡាន</th>
                <th style="text-align: center;">លក់ចេញ</th>
                <th style="text-align: center;">ត្រឡប់</th>
                <th style="text-align: right;">ស្ថានភាពបញ្ជាក់</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <p>នាំចេញដោយស្វ័យប្រវត្តិចេញពីប្រព័ន្ធគ្រប់គ្រងស្តុក</p>
          </div>

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

    printWindow.document.open();
    printWindow.document.write(documentContent);
    printWindow.document.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out completely empty rows
    const validItems = items.filter(item => item.productName || item.quantity);
    if (validItems.length === 0) {
      alert('សូមជ្រើសរើសទំនិញ និងបំពេញចំនួនយ៉ាងហោចណាស់ ១!');
      return;
    }

    // Validate that if either is filled, both must be filled, and quantity must be positive
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
      const txDate = new Date(date);
      const currentTime = new Date();
      txDate.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds());

      await Promise.all(validItems.map(async (item, index) => {
        const qty = parseInt(item.quantity);
        // Add a slight millisecond offset to keep chronological order if they are on the exact same date
        const offsetDate = new Date(txDate.getTime() + index).toISOString();
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}-${index}`,
          userId: currentUser.id,
          type: activeTab as TransactionType,
          productName: item.productName,
          quantity: qty,
          date: offsetDate,
          note
        };
        await setDoc(doc(db, 'transactions', newTransaction.id), newTransaction);
      }));

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding transactions: ", error);
      alert("មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* History Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px] p-5 md:p-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-800">
              {activeTab === 'Report' 
                ? 'របាយការណ៍ស្តុកសរុប'
                : activeTab === 'Stock Order'
                ? 'តាមដានស្តុកកម្មង់'
                : `ប្រវត្តិប្រតិបត្តិការ${activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}`}
            </h3>
            <p className="text-slate-500 text-[10px] md:text-xs mt-0.5 font-medium">
              {activeTab === 'Report' 
                ? 'ព័ត៌មាននិងចំនួនស្តុកលម្អិតសម្រាប់ទំនិញនីមួយៗ'
                : activeTab === 'Stock Order'
                ? 'បញ្ជីកម្មង់ទំនិញទាំងអស់របស់សមាជិក'
                : `តាមដានទិន្នន័យ${activeTab === 'Stock Sold' ? 'លក់ទំនិញចេញ' : activeTab === 'Stock Out' ? 'ទំនិញឡើងឡាន' : 'ទំនិញត្រឡប់ចូលស្តុកវិញ'}`}
            </p>
          </div>
          {activeTab !== 'Report' && activeTab !== 'Stock Order' ? (
            <button
              onClick={openModal}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>បញ្ចូលទិន្នន័យ</span>
            </button>
          ) : (
            activeTab === 'Stock Order' && (
              <button
                onClick={openOrderModal}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បង្កើតការកម្មង់</span>
              </button>
            )
          )}
        </div>

        {activeTab === 'Report' && (
          <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 px-1">ចាប់ពីថ្ងៃ</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 px-1">ដល់ថ្ងៃ</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>នាំចេញ PDF</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scroll pr-2">
          {activeTab === 'Report' ? (
              products.length === 0 ? (
                <div className="text-center py-24 text-slate-400 text-xs md:text-sm flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-2xl">
                    📦
                  </div>
                  <span className="font-bold text-slate-400">មិនទាន់មានទំនិញក្នុងប្រព័ន្ធឡើយ</span>
                </div>
              ) : (
                <div className="w-full overflow-x-auto md:overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100 text-center">
                        <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-rose-600 whitespace-nowrap">ឡើងឡាន</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-emerald-600 whitespace-nowrap">លក់ចេញ</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-amber-600 whitespace-nowrap">ត្រឡប់</th>
                        <th className="px-1.5 md:px-3 py-2.5 text-right font-bold text-indigo-600 whitespace-nowrap">បញ្ជាក់</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                      {(() => {
                        const activeProducts = products.map(product => {
                          const loaded = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Out').reduce((sum, t) => sum + t.quantity, 0);
                          const sold = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold').reduce((sum, t) => sum + t.quantity, 0);
                          const returned = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Return').reduce((sum, t) => sum + t.quantity, 0);
                          return { product, loaded, sold, returned };
                        }).filter(item => item.loaded > 0 || item.sold > 0 || item.returned > 0);

                        if (activeProducts.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="text-center py-16 text-slate-400 text-xs md:text-sm font-bold">
                                គ្មានទិន្នន័យទំនិញសម្រាប់បង្ហាញឡើយ
                              </td>
                            </tr>
                          );
                        }

                        return activeProducts.map(({ product, loaded, sold, returned }) => {
                          const balance = loaded - sold - returned;

                          let badgeColorClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                          let statusText = `ត្រូវ ${balance}`;
                          if (balance < 0) {
                            badgeColorClass = "bg-amber-50 text-amber-700 border border-amber-100";
                            statusText = `លើស ${Math.abs(balance)}`;
                          } else if (balance > 0) {
                            badgeColorClass = "bg-rose-50 text-rose-700 border border-rose-100";
                            statusText = `បាត់ ${balance}`;
                          }

                          return (
                            <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-1.5 md:px-3 py-2.5 sm:py-4 font-black text-slate-800 text-left">{product.name}</td>
                              <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-bold text-rose-600 text-xs sm:text-sm">{loaded}</td>
                              <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-bold text-emerald-600 text-xs sm:text-sm">{sold}</td>
                              <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-bold text-amber-600 text-xs sm:text-sm">{returned}</td>
                              <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-right">
                                <span className={`${badgeColorClass} px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl font-black text-[9px] sm:text-xs md:text-sm whitespace-nowrap`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === 'Stock Order' ? (
              <div className="flex flex-col h-full">
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 self-start shrink-0">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      orderFilter === 'all'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    ទាំងអស់
                  </button>
                  <button
                    onClick={() => setOrderFilter('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      orderFilter === 'pending'
                        ? 'bg-white text-amber-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    មិនទាន់ដឹក
                  </button>
                  <button
                    onClick={() => setOrderFilter('delivered')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      orderFilter === 'delivered'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    ដឹករួច
                  </button>
                </div>
                {stockOrders.filter(o => orderFilter === 'all' ? true : orderFilter === 'pending' ? !o.delivered : o.delivered).length === 0 ? (
                  <div className="text-center py-24 text-slate-400 text-xs md:text-sm flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-2xl">
                      📝
                    </div>
                    <span className="font-bold text-slate-400">មិនទាន់មានការកម្មង់ទំនិញឡើយ</span>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto md:overflow-visible animate-in fade-in duration-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                          <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អ្នកកម្មង់</th>
                          <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ទំនិញ</th>
                          <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-500">ចំនួន</th>
                          <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">អតិថិជន / ចំណាំ</th>
                          <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                        {[...stockOrders]
                          .filter(o => orderFilter === 'all' ? true : orderFilter === 'pending' ? !o.delivered : o.delivered)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(order => {
                            return (
                              <tr 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                className="hover:bg-indigo-50/40 active:bg-indigo-50/80 transition-all cursor-pointer group"
                                title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
                              >
                                <td className="px-1.5 md:px-3 py-2.5 sm:py-4 font-bold text-slate-800 text-left">
                                  <span className="text-[10px] sm:text-xs font-black group-hover:text-indigo-600 transition-colors">{order.username}</span>
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 sm:py-4 font-black text-slate-800 text-left">
                                  <div className="flex items-center space-x-1">
                                    <span>{order.productName}</span>
                                  </div>
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-bold text-indigo-600 text-xs sm:text-sm">{order.quantity}</td>
                                <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left text-[10px] sm:text-xs text-slate-500 max-w-[80px] sm:max-w-xs truncate" title={order.note || ''}>
                                  {order.note || <span className="text-slate-300">គ្មានចំណាំ</span>}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    <span>{order.date}</span>
                                    {order.delivered ? (
                                      <span className="w-4 h-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center text-[8px] font-black" title="បានដឹកជញ្ជូនរួចរាល់">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="កំពុងរង់ចាំ"></span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : userTransactions.length === 0 ? (
            <div className="text-center py-24 text-slate-400 text-xs md:text-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-2xl">
                📁
              </div>
              <span className="font-bold text-slate-400">មិនទាន់មានប្រតិបត្តិការណាមួយក្នុងប្រភេទនេះទេ</span>
            </div>
          ) : (
            <div className="w-full overflow-x-auto md:overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ចំណាំ</th>
                    <th className="px-1.5 md:px-3 py-2.5 text-center font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                    <th className={`px-1.5 md:px-3 py-2.5 text-center font-bold ${
                      activeTab === 'Stock Out' ? 'text-rose-600' :
                      activeTab === 'Stock Sold' ? 'text-emerald-600' :
                      activeTab === 'Stock Return' ? 'text-amber-600' : 'text-slate-600'
                    }`}>បរិមាណ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {paginatedTransactions.map(t => {
                    let colorClass = 'text-slate-600';
                    if (t.type === 'Stock Sold') {
                      colorClass = 'text-emerald-600';
                    } else if (t.type === 'Stock Out') {
                      colorClass = 'text-rose-600';
                    } else if (t.type === 'Stock Return') {
                      colorClass = 'text-amber-600';
                    }

                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTransactionDetail(t)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        title="ចុចដើម្បីមើលលម្អិត"
                      >
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left">
                          <span className="font-black text-slate-800 block text-[11px] sm:text-xs md:text-sm">{t.productName}</span>
                        </td>
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-left max-w-[70px] sm:max-w-[200px] truncate">
                          {t.note ? (
                            <span className="text-slate-700 font-medium text-[10px] sm:text-xs">{t.note}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-medium text-slate-500 whitespace-nowrap">
                          {(() => {
                            const d = new Date(t.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const shortYear = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${shortYear}`;
                          })()}
                        </td>
                        <td className={`px-1.5 md:px-3 py-2.5 sm:py-4 text-center font-black text-xs sm:text-sm md:text-base ${colorClass}`}>
                          {t.quantity}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {activeTab !== 'Report' && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-3 shrink-0">
            <div className="flex items-center space-x-2 text-xs md:text-sm text-slate-500 font-medium">
              <span>បង្ហាញ</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 outline-none focus:border-emerald-400 transition cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>ជួរ</span>
              <span className="text-slate-300">|</span>
              <span>
                បង្ហាញពី {startIndex + 1} ដល់ {Math.min(startIndex + pageSize, totalItems)} នៃ {totalItems}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="flex items-center justify-center space-x-1 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-xs md:text-sm text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl font-bold text-xs md:text-sm transition mx-0.5 cursor-pointer ${
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
                className="flex items-center justify-center space-x-1 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-xs md:text-sm text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
              >
                <span>បន្ទាប់</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Modal for Input Data */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  បញ្ចូលទិន្នន័យ {activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : activeTab === 'Stock Return' ? 'ស្តុកត្រឡប់' : ''}
                </h3>
                <p className="text-xs text-slate-500 font-medium">បំពេញព័ត៌មានខាងក្រោមដើម្បីរក្សាទុក</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Date selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                  required
                />
              </div>

              {/* Multi-Stock List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500">មុខទំនិញ និងចំនួនទំនិញ</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>បន្ថែមទំនិញ</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scroll">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Product Name Dropdown */}
                      <div className="flex-1 relative">
                        <select
                          value={item.productName}
                          onChange={e => updateItemRow(index, 'productName', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800 appearance-none"
                          required
                        >
                          <option value="" disabled>-- ជ្រើសរើសទំនិញ --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-24 md:w-32">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItemRow(index, 'quantity', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:bg-white focus:border-emerald-400 outline-none font-black text-slate-800"
                          required
                          min="1"
                          placeholder="ចំនួន"
                        />
                      </div>

                      {/* Delete Row button */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition shrink-0"
                          title="លុបជួរនេះ"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំណាំ (ជម្រើស)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 transition outline-none font-medium text-slate-700 resize-none"
                  rows={2}
                  placeholder="ព័ត៌មានបន្ថែម..."
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-70"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Modal for Editing Data */}
      {editingTransaction && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  កែប្រែប្រតិបត្តិការ {editingTransaction.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : editingTransaction.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">កែប្រែព័ត៌មានខាងក្រោមដើម្បីរក្សាទុក</p>
              </div>
              <button 
                onClick={() => setEditingTransaction(null)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              {/* Date selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                  required
                />
              </div>

              {/* Product selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">មុខទំនិញ</label>
                <div className="relative">
                  <select
                    value={editProductName}
                    onChange={e => setEditProductName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800 appearance-none"
                    required
                  >
                    <option value="" disabled>-- ជ្រើសរើសទំនិញ --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
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

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំណាំ (ជម្រើស)</label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 transition outline-none font-medium text-slate-700 resize-none"
                  rows={2}
                  placeholder="ព័ត៌មានបន្ថែម..."
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-70"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal for Deletion */}
      {transactionToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">បញ្ជាក់ការលុប</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 px-2">
              តើអ្នកពិតជាចង់លុបប្រតិបត្តិការ <span className="font-bold text-slate-800">"{transactionToDelete.productName}" ({transactionToDelete.quantity})</span> នេះមែនទេ? ការលុបនេះមិនអាចសង្គ្រោះវិញបានឡើយ។
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDeleteTransaction(transactionToDelete.id)}
                className="flex-1 hover:bg-rose-700 bg-rose-600 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'កំពុងលុប...' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Modal for Transaction Details */}
      {selectedTransactionDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800">
                  ព័ត៌មានលម្អិត
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedTransactionDetail.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : selectedTransactionDetail.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedTransactionDetail(null)} 
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
                <span className="col-span-2 text-sm font-black text-slate-800">{selectedTransactionDetail.productName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-bold text-slate-400">ចំណាំ</span>
                <span className="col-span-2 text-sm font-semibold text-slate-700">
                  {selectedTransactionDetail.note || <span className="text-slate-300 font-normal">—</span>}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-bold text-slate-400">កាលបរិច្ឆេទ</span>
                <span className="col-span-2 text-sm font-bold text-slate-600">
                  {(() => {
                    const d = new Date(selectedTransactionDetail.date);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                  })()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-bold text-slate-400">បរិមាណ</span>
                <span className={`col-span-2 text-base font-black ${
                  selectedTransactionDetail.type === 'Stock Out' ? 'text-rose-600' :
                  selectedTransactionDetail.type === 'Stock Sold' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {selectedTransactionDetail.quantity}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  const t = selectedTransactionDetail;
                  setSelectedTransactionDetail(null);
                  handleEditClick(t);
                }}
                className="flex-1 hover:bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-sm py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>កែប្រែ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = selectedTransactionDetail;
                  setSelectedTransactionDetail(null);
                  setTransactionToDelete(t);
                }}
                className="flex-1 hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold text-sm py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>លុប</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isOrderModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  បង្កើតការកម្មង់ទំនិញថ្មី
                </h3>
                <p className="text-xs text-slate-500 font-medium">បំពេញព័ត៌មានអតិថិជន និងចំនួនទំនិញកម្មង់ខាងក្រោម</p>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateStockOrder} className="space-y-4 pt-4">
              {/* Date selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={e => setOrderDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800"
                  required
                />
              </div>

              {/* Multi-Stock List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500">មុខទំនិញ និងចំនួនទំនិញ</label>
                  <button
                    type="button"
                    onClick={addOrderItemRow}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center space-x-1 hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>បន្ថែមទំនិញ</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scroll">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Product Name Dropdown */}
                      <div className="flex-1 relative">
                        <select
                          value={item.productName}
                          onChange={e => updateOrderItemRow(index, 'productName', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800 appearance-none"
                          required
                        >
                          <option value="" disabled>-- ជ្រើសរើសទំនិញ --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-24 md:w-32">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateOrderItemRow(index, 'quantity', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:bg-white focus:border-indigo-400 outline-none font-black text-slate-800"
                          required
                          min="1"
                          placeholder="ចំនួន"
                        />
                      </div>

                      {/* Delete Row button */}
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItemRow(index)}
                          className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition shrink-0"
                          title="លុបជួរនេះ"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Note / Customer Info */}
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1 font-black">ព័ត៌មានអតិថិជន ឬ ចំណាំ</label>
                <textarea
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-medium text-slate-800 h-24 resize-none"
                  placeholder="បញ្ចូលព័ត៌មានអតិថិជន លេខទូរស័ព្ទ ឬ ទីតាំងដឹកជញ្ជូន..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="flex-1 hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold text-sm py-3 rounded-2xl transition active:scale-95 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm py-3 rounded-2xl transition shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកម្មង់'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Selected Order Detail Modal */}
      {selectedOrder && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden p-6 relative border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl text-indigo-600">
                📦
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">ព័ត៌មានលម្អិតនៃការកម្មង់</h3>
                <p className="text-xs text-slate-400 font-bold">ព័ត៌មានលម្អិត និងស្ថានភាពនៃការដឹកជញ្ជូន</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-b border-slate-100 py-4 mb-6">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-bold text-slate-400 font-black">អ្នកកម្មង់៖</span>
                <span className="text-xs font-black text-slate-800 col-span-2">{selectedOrder.username}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-bold text-slate-400 font-black">ទំនិញ៖</span>
                <span className="text-xs font-black text-slate-800 col-span-2">{selectedOrder.productName}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-bold text-slate-400 font-black">ចំនួន៖</span>
                <span className="text-sm font-black text-indigo-600 col-span-2">{selectedOrder.quantity}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-bold text-slate-400 font-black">កាលបរិច្ឆេទ៖</span>
                <span className="text-xs font-bold text-slate-500 col-span-2">{selectedOrder.date}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-bold text-slate-400 font-black">អតិថិជន / ចំណាំ៖</span>
                <div className="text-xs font-medium text-slate-700 col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-24 overflow-y-auto whitespace-pre-wrap break-all custom-scroll">
                  {selectedOrder.note || <span className="text-slate-300 font-bold">គ្មានចំណាំ</span>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-bold text-slate-400 font-black">ស្ថានភាព៖</span>
                <div className="col-span-2">
                  {selectedOrder.delivered ? (
                    <div className="flex flex-col">
                      <span className="inline-flex bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-xl font-black text-xs whitespace-nowrap items-center gap-1 w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>បានដឹកជញ្ជូនរួចរាល់</span>
                      </span>
                      {selectedOrder.deliveredBy && (
                        <span className="text-[10px] text-slate-400 mt-1 font-bold">
                          ដឹកដោយ៖ {selectedOrder.deliveredBy}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-xl font-black text-xs whitespace-nowrap items-center gap-1 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>មិនទាន់ដឹកជញ្ជូន</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs md:text-sm py-3 rounded-2xl transition active:scale-95 cursor-pointer"
              >
                បិទផ្ទាំងនេះ
              </button>
              {!selectedOrder.delivered && (
                <button
                  onClick={async () => {
                    await handleConfirmDelivery(selectedOrder.id);
                    setSelectedOrder(prev => prev ? { ...prev, delivered: true, deliveredBy: currentUser.username } : null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm py-3 rounded-2xl transition shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>បញ្ជាក់ការដឹករួច</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
