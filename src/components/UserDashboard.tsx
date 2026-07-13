import React, { useState } from 'react';
import { User, Transaction, TransactionType } from '../types';

interface UserDashboardProps {
  currentUser: User;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export default function UserDashboard({ currentUser, transactions, setTransactions }: UserDashboardProps) {
  const [type, setType] = useState<TransactionType>('Stock Sold');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  const userTransactions = transactions.filter(t => t.userId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('ចំនួនទំនិញត្រូវតែជាលេខវិជ្ជមាន!');
      return;
    }

    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type,
      productName,
      quantity: qty,
      date: new Date().toISOString(),
      note
    };

    setTransactions([...transactions, newTransaction]);
    setProductName('');
    setQuantity('');
    setNote('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Form Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-1 h-fit">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">បញ្ចូលទិន្នន័យស្តុក</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ប្រភេទ (Type)</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="Stock Out">Stock Out (បញ្ចេញស្តុក)</option>
              <option value="Stock Sold">Stock Sold (លក់ចេញ)</option>
              <option value="Stock Return">Stock Return (ស្តុកត្រឡប់មកវិញ)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ឈ្មោះទំនិញ (Product)</label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              placeholder="ឧ. ទូរស័ព្ទដៃ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ចំនួន (Quantity)</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              min="1"
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ចំណាំ (Note - ជម្រើស)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={3}
              placeholder="ព័ត៌មានបន្ថែម..."
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            រក្សាទុក (Save)
          </button>
        </form>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 md:col-span-2 overflow-hidden flex flex-col h-[600px]">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">ប្រវត្តិប្រតិបត្តិការរបស់អ្នក (Your History)</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 shadow-sm">
              <tr className="text-slate-500 text-xs uppercase font-medium">
                <th className="px-6 py-3 border-b border-slate-200">កាលបរិច្ឆេទ</th>
                <th className="px-6 py-3 border-b border-slate-200">ប្រភេទ</th>
                <th className="px-6 py-3 border-b border-slate-200">ឈ្មោះទំនិញ</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">ចំនួន</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {userTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 text-slate-500">{new Date(t.date).toLocaleString('km-KH')}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${t.type === 'Stock Sold' ? 'bg-green-100 text-green-700' : 
                        t.type === 'Stock Return' ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-700 font-medium">{t.productName}</td>
                  <td className="px-6 py-3 text-right font-mono font-semibold text-slate-800">{t.quantity}</td>
                </tr>
              ))}
              {userTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">អ្នកមិនទាន់មានប្រតិបត្តិការណាមួយទេ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
