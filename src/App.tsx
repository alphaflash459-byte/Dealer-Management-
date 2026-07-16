import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction, Product, StockOrder } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { usersCollection, transactionsCollection, productsCollection, stockOrdersCollection, db } from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockOrders, setStockOrders] = useState<StockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAdminView, setActiveAdminView] = useState<'users' | 'products' | 'transactions' | 'stockOrders'>('users');
  const [activeUserView, setActiveUserView] = useState<'Stock Sold' | 'Stock Out' | 'Stock Return' | 'Report' | 'Stock Order'>('Stock Out');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

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

    const unsubscribeProducts = onSnapshot(productsCollection, (snapshot) => {
      const prodData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prodData);
    });

    const unsubscribeStockOrders = onSnapshot(stockOrdersCollection, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockOrder));
      setStockOrders(ordersData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTransactions();
      unsubscribeProducts();
      unsubscribeStockOrders();
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Reset mobile header visibility when switching tabs
  useEffect(() => {
    setIsHeaderVisible(true);
  }, [activeAdminView, activeUserView]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex justify-center items-center">
        <div className="text-slate-500 font-bold">កំពុងផ្ទុកទិន្នន័យ...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-[100dvh] font-sans bg-[#f1f5f9]">
      {/* NAVIGATION (Sidebar on Tablet/PC, Bottom Bar on Mobile) */}
      <nav className="md:relative w-full md:w-64 bg-white/95 md:bg-white backdrop-blur-md md:backdrop-blur-none border-t md:border-t-0 md:border-r border-slate-200/50 z-40 shrink-0 order-2 md:order-1 transition-all shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none pb-safe">
        <div className="hidden md:flex items-center space-x-3 p-6 mb-2 border-b border-slate-50">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md shadow-emerald-600/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <h1 className="text-base font-black text-slate-800 tracking-wide leading-tight">គ្រប់គ្រង<br/><span className="text-emerald-600">ស្តុកទំនិញ</span></h1>
        </div>

        <div className="flex md:flex-col justify-around md:justify-start w-full h-[65px] md:h-auto pb-2 md:pb-0 pt-2 md:pt-4 px-2 md:px-4 md:space-y-2">
            {currentUser.role === 'Admin' ? (
              <>
                <button onClick={() => setActiveAdminView('users')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeAdminView === 'users' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeAdminView === 'users' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold">អ្នកប្រើប្រាស់</span>
                </button>
                <button onClick={() => setActiveAdminView('products')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeAdminView === 'products' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeAdminView === 'products' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold">គ្រប់គ្រងទំនិញ</span>
                </button>
                 <button onClick={() => setActiveAdminView('stockOrders')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeAdminView === 'stockOrders' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeAdminView === 'stockOrders' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">ស្តុកកម្មង់</span>
                </button>
                 <button onClick={() => setActiveAdminView('transactions')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeAdminView === 'transactions' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeAdminView === 'transactions' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">របាយការណ៍</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveUserView('Stock Out')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeUserView === 'Stock Out' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeUserView === 'Stock Out' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16H5a2 2 0 01-2-2V6a2 2 0 012-2h9M14 16h4.5a1.5 1.5 0 001.5-1.5v-3.5L17 7h-3M5.5 18.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm13 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        </svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold">ស្តុកឡើងឡាន</span>
                </button>
                <button onClick={() => setActiveUserView('Stock Sold')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeUserView === 'Stock Sold' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeUserView === 'Stock Sold' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M3 9l1.285-4.5A1.5 1.5 0 015.735 3h12.53a1.5 1.5 0 011.45 1.5L21 9M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M9 21V13h6v8" />
                        </svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold">ស្តុកលក់ចេញ</span>
                </button>
                <button onClick={() => setActiveUserView('Stock Return')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeUserView === 'Stock Return' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeUserView === 'Stock Return' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">ស្តុកត្រឡប់</span>
                </button>
                <button onClick={() => setActiveUserView('Stock Order')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeUserView === 'Stock Order' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeUserView === 'Stock Order' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">ស្តុកកម្មង់</span>
                </button>
                <button onClick={() => setActiveUserView('Report')} className={`group flex flex-col md:flex-row items-center justify-center md:justify-start w-16 md:w-full h-full md:h-auto md:p-3 md:rounded-2xl transition-all ${activeUserView === 'Report' ? 'text-emerald-600 md:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <div className={`nav-icon p-1.5 md:p-2 rounded-2xl transition transform mb-1 md:mb-0 md:mr-4 shrink-0 ${activeUserView === 'Report' ? 'bg-emerald-100 text-emerald-700 scale-110 md:scale-100' : 'md:scale-100 md:group-hover:scale-110'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">របាយការណ៍ស្តុក</span>
                </button>
              </>
            )}
        </div>
        
        <div className="hidden md:block absolute bottom-0 w-full p-4 border-t border-slate-50">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1 text-center">អ្នកកំពុងប្រើប្រាស់ជា៖</p>
                <div className="font-black text-center text-emerald-700 text-sm mb-4">{currentUser.username} ({currentUser.role})</div>
                <button onClick={handleLogout} className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 p-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>ចាកចេញពីគណនី</span>
                </button>
            </div>
        </div>
      </nav>

      {/* MAIN RIGHT AREA (Header + Content) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f1f5f9] order-1 md:order-2 relative">
          {/* Sleek Mobile Header */}
          <header className={`md:hidden bg-emerald-600 border-b border-emerald-700 px-5 flex justify-between items-center shrink-0 relative z-20 shadow-md transition-all duration-300 ease-in-out ${
            isHeaderVisible 
              ? 'h-[72px] py-4 opacity-100 translate-y-0' 
              : 'h-0 py-0 opacity-0 -translate-y-full overflow-hidden border-b-0'
          }`}>
              <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center font-black text-sm shadow-sm backdrop-blur-sm">
                      {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <h4 className="text-[10px] text-emerald-100/80 font-bold uppercase tracking-wider leading-none">គណនី</h4>
                      <h2 className="text-sm font-bold text-white mt-1">{currentUser.username}</h2>
                  </div>
              </div>
              <button onClick={handleLogout} className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 border border-white/20 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span>ចាកចេញ</span>
              </button>
          </header>

          <main 
            className="flex-1 flex flex-col overflow-hidden relative z-10 w-full px-2 md:px-4 pt-5 pb-0 md:pb-8"
            onScroll={(e) => {
              const currentScrollY = e.currentTarget.scrollTop;
              // If we are close to the top, show header
              if (currentScrollY <= 15) {
                setIsHeaderVisible(true);
              } else if (currentScrollY > lastScrollY.current + 10) {
                // Scrolling down - show header
                setIsHeaderVisible(true);
              } else if (currentScrollY < lastScrollY.current - 10) {
                // Scrolling up - hide header
                setIsHeaderVisible(false);
              }
              lastScrollY.current = currentScrollY;
            }}
          >
            <div className="w-full h-full flex flex-col min-h-0 overflow-hidden animate-in fade-in duration-300">
                {currentUser.role === 'Admin' ? (
                  <AdminDashboard 
                    users={users} 
                    setUsers={setUsers} 
                    transactions={transactions} 
                    products={products}
                    stockOrders={stockOrders}
                    activeTab={activeAdminView}
                  />
                ) : (
                  <UserDashboard 
                    currentUser={currentUser} 
                    transactions={transactions} 
                    setTransactions={setTransactions} 
                    products={products}
                    stockOrders={stockOrders}
                    activeTab={activeUserView}
                  />
                )}
            </div>
          </main>
      </div>
    </div>
  );
}
