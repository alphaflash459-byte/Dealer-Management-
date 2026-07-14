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
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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

  return (
    <div className="space-y-6">
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 md:col-span-1 h-fit">
            <h3 className="text-base md:text-lg font-black text-slate-800 mb-5">បង្កើតអ្នកប្រើប្រាស់ថ្មី</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
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
              <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm md:text-base py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-70"
                  >
                    {loading ? 'កំពុងបង្កើត...' : 'បង្កើត'}
                  </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 md:col-span-2 overflow-hidden h-fit">
            <div className="px-5 md:px-6 py-5 border-b border-slate-50">
              <h3 className="text-base md:text-lg font-black text-slate-800">បញ្ជីអ្នកប្រើប្រាស់</h3>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    <th className="px-4 py-3 border-b border-slate-100">ឈ្មោះអ្នកប្រើប្រាស់</th>
                    <th className="px-4 py-3 border-b border-slate-100">លេខសម្ងាត់</th>
                    <th className="px-4 py-3 border-b border-slate-100">តួនាទី</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-800">{user.username}</td>
                      <td className="px-4 py-4 font-mono font-medium text-slate-500">{user.password}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold ${user.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {user.role !== 'Admin' && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-colors"
                          >
                            លុប
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">គ្មានទិន្នន័យ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 md:col-span-1 h-fit">
            <h3 className="text-base md:text-lg font-black text-slate-800 mb-5">បន្ថែមទំនិញថ្មី</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
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
              <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm md:text-base py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-70"
                  >
                    {loading ? 'កំពុងបង្កើត...' : 'បង្កើត'}
                  </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 md:col-span-2 overflow-hidden h-fit">
            <div className="px-5 md:px-6 py-5 border-b border-slate-50">
              <h3 className="text-base md:text-lg font-black text-slate-800">បញ្ជីទំនិញ</h3>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    <th className="px-4 py-3 border-b border-slate-100">ឈ្មោះទំនិញ</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-800">{product.name}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-colors"
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
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scroll p-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <tr className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider">
                  <th className="px-4 py-3 border-b border-slate-100">កាលបរិច្ឆេទ</th>
                  <th className="px-4 py-3 border-b border-slate-100">អ្នកប្រើប្រាស់</th>
                  <th className="px-4 py-3 border-b border-slate-100">ប្រភេទប្រតិបត្តិការ</th>
                  <th className="px-4 py-3 border-b border-slate-100">ឈ្មោះទំនិញ</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right">ចំនួន</th>
                  <th className="px-4 py-3 border-b border-slate-100">ចំណាំ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
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
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-500 whitespace-nowrap">{new Date(t.date).toLocaleString('km-KH')}</td>
                      <td className="px-4 py-4 font-bold text-slate-800">{user?.username || 'Unknown'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold ${bgClass} whitespace-nowrap`}>
                          {t.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : t.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-700">{t.productName}</td>
                      <td className={`px-4 py-4 text-right font-black ${colorClass}`}>
                        {t.quantity}
                      </td>
                      <td className="px-4 py-4 text-slate-500 font-medium truncate max-w-[150px]">{t.note || '-'}</td>
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
    </div>
  );
}
