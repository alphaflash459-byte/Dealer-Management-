import React, { useState, useEffect } from 'react';
import { User, Transaction } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { usersCollection, transactionsCollection, db } from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    // Check if there are any users, if not create default Admin
    const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      if (usersData.length === 0) {
        // Create default Admin
        const defaultAdmin: User = {
          id: 'admin-1',
          username: 'Admin',
          password: '12345678',
          role: 'Admin',
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'users', defaultAdmin.id), defaultAdmin);
      } else {
        setUsers(usersData);
      }
      setLoading(false);
    });

    const unsubscribeTransactions = onSnapshot(transactionsCollection, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTransactions();
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="text-slate-500">កំពុងផ្ទុកទិន្នន័យ...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">ប្រព័ន្ធតាមដានស្តុក (Stock Tracking)</h1>
            <p className="text-sm text-slate-500">អ្នកកំពុងប្រើប្រាស់ជា: <span className="font-medium text-blue-600">{currentUser.username}</span> ({currentUser.role})</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            ចាកចេញ (Logout)
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'Admin' ? (
          <AdminDashboard 
            users={users} 
            setUsers={setUsers} 
            transactions={transactions} 
          />
        ) : (
          <UserDashboard 
            currentUser={currentUser} 
            transactions={transactions} 
            setTransactions={setTransactions} 
          />
        )}
      </main>
    </div>
  );
}
