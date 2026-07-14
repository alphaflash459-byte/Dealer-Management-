import React, { useState } from 'react';
import { User, Transaction, TransactionType, Product } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserDashboardProps {
  currentUser: User;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  products: Product[];
  activeTab: TransactionType;
}

export default function UserDashboard({ currentUser, transactions, setTransactions, products, activeTab }: UserDashboardProps) {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Divide the transaction history according to different menus/tabs (e.g. Stock Sold, Stock Out, Stock Return)
  const userTransactions = transactions.filter(t => t.userId === currentUser.id && t.type === activeTab);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('ចំនួនទំនិញត្រូវតែជាលេខវិជ្ជមាន!');
      return;
    }

    setLoading(true);

    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type: activeTab,
      productName,
      quantity: qty,
      date: new Date().toISOString(),
      note
    };

    try {
      await setDoc(doc(db, 'transactions', newTransaction.id), newTransaction);
      setProductName('');
      setQuantity('');
      setNote('');
      setIsModalOpen(false); // Close the floating modal on success
    } catch (error) {
      console.error("Error adding transaction: ", error);
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
              ប្រវត្តិប្រតិបត្តិការ{activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
            </h3>
            <p className="text-slate-500 text-[10px] md:text-xs mt-0.5 font-medium">តាមដានទិន្នន័យ{activeTab === 'Stock Sold' ? 'លក់ទំនិញចេញ' : activeTab === 'Stock Out' ? 'ទំនិញឡើងឡាន' : 'ទំនិញត្រឡប់ចូលស្តុកវិញ'}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>បញ្ចូលទិន្នន័យ</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll pr-2">
            {userTransactions.length === 0 ? (
                <div className="text-center py-24 text-slate-400 text-xs md:text-sm flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-2xl">
                    📁
                  </div>
                  <span className="font-bold text-slate-400">មិនទាន់មានប្រតិបត្តិការណាមួយក្នុងប្រភេទនេះទេ</span>
                </div>
            ) : (
                <div className="space-y-2">
                    {userTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                        let icon = '📦';
                        let colorClass = 'text-slate-600';
                        let bgClass = 'bg-slate-100';
                        if (t.type === 'Stock Sold') {
                            icon = '💸'; colorClass = 'text-emerald-600'; bgClass = 'bg-emerald-50 border border-emerald-100';
                        } else if (t.type === 'Stock Out') {
                            icon = '📤'; colorClass = 'text-rose-600'; bgClass = 'bg-rose-50 border border-rose-100';
                        } else if (t.type === 'Stock Return') {
                            icon = '📥'; colorClass = 'text-amber-600'; bgClass = 'bg-amber-50 border border-amber-100';
                        }

                        return (
                            <div key={t.id} className="flex justify-between items-center py-3 px-3 hover:bg-slate-50 rounded-2xl transition border border-transparent hover:border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl shrink-0 ${bgClass} ${colorClass}`}>
                                        {icon}
                                    </div>
                                    <div>
                                        <h4 className="text-xs md:text-sm font-bold text-slate-800">{t.productName}</h4>
                                        <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">{t.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : t.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'} • {new Date(t.date).toLocaleString('km-KH')}</p>
                                        {t.note && <p className="text-[10px] md:text-xs text-slate-400 italic mt-0.5">ចំណាំ៖ {t.note}</p>}
                                    </div>
                                </div>
                                <div className={`text-right font-black text-sm md:text-base shrink-0 ${colorClass}`}>
                                    {t.quantity}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* Floating Modal for Input Data */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  បញ្ចូលទិន្នន័យ {activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}
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
              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះទំនិញ (Product)</label>
                <div className="relative">
                  <select
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm md:text-base focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800 appearance-none"
                    required
                  >
                    <option value="" disabled>-- ជ្រើសរើសទំនិញ --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំនួន (Quantity)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm md:text-base focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-black text-slate-800"
                  required
                  min="1"
                  placeholder="10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ចំណាំ (Note - ជម្រើស)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-emerald-400 transition outline-none font-medium text-slate-700 resize-none"
                  rows={3}
                  placeholder="ព័ត៌មានបន្ថែម..."
                ></textarea>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3.5 rounded-2xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-70"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
