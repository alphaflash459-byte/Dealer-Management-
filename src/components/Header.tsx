import React from 'react';
import { Users, Package, ShoppingCart, BarChart3, BrainCircuit, Globe, Store } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  setView: (view: string) => void;
  lang: 'kh' | 'en';
  setLang: (lang: 'kh' | 'en') => void;
  dealerCount: number;
  lowStockCount: number;
  pendingOrdersCount: number;
}

export default function Header({
  currentView,
  setView,
  lang,
  setLang,
  dealerCount,
  lowStockCount,
  pendingOrdersCount
}: HeaderProps) {
  const menuItems = [
    { id: 'dashboard', labelKh: 'ផ្ទាំងគ្រប់គ្រង', labelEn: 'Dashboard', icon: BarChart3 },
    { id: 'dealers', labelKh: 'តំណាងចែកចាយ', labelEn: 'Dealers', icon: Users, badge: dealerCount },
    { id: 'inventory', labelKh: 'ស្តុកទំនិញ', labelEn: 'Inventory', icon: Package, badge: lowStockCount, badgeColor: 'bg-amber-500' },
    { id: 'orders', labelKh: 'ការបញ្ជាទិញ', labelEn: 'Orders', icon: ShoppingCart, badge: pendingOrdersCount, badgeColor: 'bg-blue-500 animate-pulse' },
    { id: 'analytics', labelKh: 'ស្ថិតិលក់', labelEn: 'Analytics', icon: BarChart3 },
    { id: 'ai-insights', labelKh: 'ជំនួយការ AI', labelEn: 'AI Insights', icon: BrainCircuit, spark: true }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                DMS Cambodia
              </span>
              <p className="text-[10px] text-indigo-400 font-mono tracking-widest leading-none">
                {lang === 'kh' ? 'ប្រព័ន្ធគ្រប់គ្រងដេប៉ូ' : 'DEALER CORE SYSTEM'}
              </p>
            </div>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-inner shadow-slate-950/50 border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{lang === 'kh' ? item.labelKh : item.labelEn}</span>
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white ${item.badgeColor || 'bg-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}

                  {item.spark && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Controls & Language */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setLang('kh')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === 'kh'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>ខ្មែរ</span>
              </button>
              <button
                onClick={() => setLang('en')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === 'en'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>EN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Bar (Bottom fixed or horizontal scroll) */}
      <div className="lg:hidden bg-slate-950/85 backdrop-blur border-t border-slate-800 overflow-x-auto flex space-x-1 px-2 py-1.5 scrollbar-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex-none flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'kh' ? item.labelKh : item.labelEn}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1 py-0.1 text-[9px] font-bold rounded bg-slate-800 text-indigo-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
