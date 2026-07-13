import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: Transaction[];
}

export default function AdminDashboard({ users, setUsers, transactions }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.username === newUsername)) {
      alert('ឈ្មោះនេះមានរួចហើយ!');
      return;
    }
    
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
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបអ្នកប្រើប្រាស់នេះមែនទេ?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Error deleting user: ", error);
        alert('មានបញ្ហាក្នុងការលុបអ្នកប្រើប្រាស់');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          គ្រប់គ្រងអ្នកប្រើប្រាស់ (Users)
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          តាមដានទិន្នន័យ (Transactions)
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-1 h-fit">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">បង្កើតអ្នកប្រើប្រាស់ថ្មី</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                បង្កើត (Create)
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 md:col-span-2 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">បញ្ជីអ្នកប្រើប្រាស់</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                    <th className="px-6 py-3 border-b border-slate-200">Username</th>
                    <th className="px-6 py-3 border-b border-slate-200">Password</th>
                    <th className="px-6 py-3 border-b border-slate-200">Role</th>
                    <th className="px-6 py-3 border-b border-slate-200 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-800">{user.username}</td>
                      <td className="px-6 py-3 font-mono text-slate-600">{user.password}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {user.role !== 'Admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                          >
                            លុប
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">គ្មានទិន្នន័យ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">ប្រតិបត្តិការទាំងអស់ (All Transactions)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                  <th className="px-6 py-3 border-b border-slate-200">កាលបរិច្ឆេទ</th>
                  <th className="px-6 py-3 border-b border-slate-200">អ្នកប្រើប្រាស់</th>
                  <th className="px-6 py-3 border-b border-slate-200">ប្រភេទប្រតិបត្តិការ</th>
                  <th className="px-6 py-3 border-b border-slate-200">ឈ្មោះទំនិញ</th>
                  <th className="px-6 py-3 border-b border-slate-200 text-right">ចំនួន</th>
                  <th className="px-6 py-3 border-b border-slate-200">ចំណាំ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                  const user = users.find(u => u.id === t.userId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-slate-500">{new Date(t.date).toLocaleString('km-KH')}</td>
                      <td className="px-6 py-3 font-medium text-slate-800">{user?.username || 'Unknown'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${t.type === 'Stock Sold' ? 'bg-green-100 text-green-700' : 
                            t.type === 'Stock Return' ? 'bg-orange-100 text-orange-700' : 
                            'bg-red-100 text-red-700'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-700">{t.productName}</td>
                      <td className="px-6 py-3 text-right font-mono font-medium text-slate-800">{t.quantity}</td>
                      <td className="px-6 py-3 text-slate-500 truncate max-w-[150px]">{t.note || '-'}</td>
                    </tr>
                  )
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">គ្មានប្រតិបត្តិការទេ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
