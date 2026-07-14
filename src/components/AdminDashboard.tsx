import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Transaction, Product } from '../types';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: Transaction[];
  products: Product[];
  activeTab: 'users' | 'products' | 'transactions';
}

export default function AdminDashboard({ users, setUsers, transactions, products, activeTab }: AdminDashboardProps) {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProductName, setNewProductName] = useState('');
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
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editQuantity, setEditQuantity] = useState('');
  const [editNote, setEditNote] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    
    if (products.find(p => p.name.toLowerCase() === newProductName.trim().toLowerCase())) {
      alert('ឈ្មោះទំនិញនេះមានរួចហើយ!');
      return;
    }
    
    setLoading(true);
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProductName.trim(),
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
      setNewProductName('');
      setIsCreateProductModalOpen(false);
    } catch (error) {
      console.error("Error adding product: ", error);
      alert('មានបញ្ហាក្នុងការបង្កើតទំនិញ');
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

  return (
    <div className="space-y-6">
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-fit">
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
            <div className="w-full overflow-x-auto md:overflow-visible p-1 md:p-2">
              <table className="w-full text-left border-collapse">
                <thead>
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-fit">
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
            <div className="w-full overflow-x-auto md:overflow-visible p-1 md:p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100">ឈ្មោះទំនិញ</th>
                    <th className="px-2 md:px-4 py-2.5 border-b border-slate-100 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 md:px-4 py-2.5 sm:py-4 font-bold text-slate-800">{product.name}</td>
                      <td className="px-2 md:px-4 py-2.5 sm:py-4 text-right">
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] sm:text-[11px] md:text-xs font-bold transition-colors"
                        >
                          លុប
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-slate-400 font-medium">គ្មានទិន្នន័យ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-[700px] flex flex-col">
          <div className="px-5 md:px-6 py-5 border-b border-slate-50 shrink-0">
            <h3 className="text-base md:text-lg font-black text-slate-800">ប្រតិបត្តិការទាំងអស់</h3>
          </div>
          <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scroll p-1 md:p-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                <span>បង្ហាញ</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none focus:border-emerald-400 transition cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>ជួរ</span>
                <span className="text-slate-300">|</span>
                <span>
                  បង្ហាញពី {startIndex + 1} ដល់ {Math.min(startIndex + pageSize, totalItems)} នៃ {totalItems}
                </span>
              </div>

              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end space-x-1.5">
                <button
                  type="button"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-[10px] sm:text-xs text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
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
                  className="flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-[10px] sm:text-xs text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition cursor-pointer"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
                  required
                  placeholder="បញ្ចូលឈ្មោះទំនិញ"
                />
              </div>
              <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateProductModalOpen(false)}
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

    </div>
  );
}
