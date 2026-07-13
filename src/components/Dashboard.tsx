import React from 'react';
import { DollarSign, Users, Package, ShoppingCart, Clock, ArrowUpRight, ArrowDownRight, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { Dealer, Product, Order, ActivityLog } from '../types';

interface DashboardProps {
  dealers: Dealer[];
  products: Product[];
  orders: Order[];
  logs: ActivityLog[];
  lang: 'kh' | 'en';
  setView: (view: string) => void;
  setSelectedDealerId?: (id: string) => void;
}

export default function Dashboard({
  dealers,
  products,
  orders,
  logs,
  lang,
  setView,
  setSelectedDealerId
}: DashboardProps) {
  // Conversions
  const RIEL_RATE = 4100;
  const formatCurrency = (usd: number) => {
    const usdFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
    const rielFormatted = new Intl.NumberFormat('kh-KH', { maximumFractionDigits: 0 }).format(usd * RIEL_RATE) + ' ៛';
    return { usd: usdFormatted, riel: rielFormatted };
  };

  // Metrics calculations
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const activeDealersCount = dealers.filter(d => d.status === 'Active').length;
  const activeDealersPercent = dealers.length ? Math.round((activeDealersCount / dealers.length) * 100) : 0;

  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const pendingOrders = orders.filter(o => o.status === 'Pending');

  // Chart calculation (using mock dates or actual order date values)
  // Let's create a visual graph showing revenue trends over the past few days.
  const chartDays = ['07/08', '07/09', '07/10', '07/11', '07/12', '07/13'];
  const chartRevenue = [350, 850, 1170, 400, 2700, 930]; // dynamic feel

  // Generate beautiful SVG paths
  const maxVal = Math.max(...chartRevenue) * 1.1;
  const svgWidth = 500;
  const svgHeight = 160;
  
  const points = chartRevenue.map((val, idx) => {
    const x = (idx / (chartRevenue.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - ((val / maxVal) * (svgHeight - 40) + 20);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - 10} L ${points[0].x} ${svgHeight - 10} Z`;

  // Sort logs by time (newest first)
  const recentLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  // Top dealers by order total
  const topDealers = [...dealers]
    .sort((a, b) => b.totalPurchased - a.totalPurchased)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-indigo-800/40 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-indigo-400 animate-pulse" />
              {lang === 'kh' ? 'សួស្តី! ផ្ទាំងគ្រប់គ្រងចែកចាយ' : 'Dealer Operations Dashboard'}
            </h1>
            <p className="text-indigo-200 text-sm mt-1 max-w-xl">
              {lang === 'kh' 
                ? 'តាមដានស្ថានភាពចែកចាយ ទំនិញ និងលទ្ធផលលក់ដុំប្រចាំថ្ងៃរបស់ដេប៉ូទូទាំងប្រទេសកម្ពុជា។' 
                : 'Monitor wholesale distribution status, products catalog, and sales results across Cambodia provinces.'}
            </p>
          </div>
          <button 
            onClick={() => setView('ai-insights')}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
          >
            <span>{lang === 'kh' ? 'វិភាគជាមួយ AI' : 'Analyze with AI'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'kh' ? 'ចំណូលលក់ដុំសរុប' : 'Total Revenue'}
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalRevenue).usd}</h3>
            <p className="text-xs font-mono font-medium text-emerald-600 mt-1 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {formatCurrency(totalRevenue).riel}
            </p>
          </div>
        </div>

        {/* Active Dealers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'kh' ? 'តំណាងចែកចាយសកម្ម' : 'Active Dealers'}
            </span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{activeDealersCount} / {dealers.length}</h3>
            <div className="flex items-center mt-1">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-2">
                {activeDealersPercent}%
              </span>
              <span className="text-xs text-slate-400">
                {lang === 'kh' ? 'កំពុងសហការ' : 'Active partners'}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Warning */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'kh' ? 'ស្តុកទំនិញជិតអស់' : 'Low Stock Alert'}
            </span>
            <div className={`p-2 rounded-xl ${lowStockItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{lowStockItems.length}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              {lowStockItems.length > 0 ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  <span className="text-amber-600 font-semibold">{lang === 'kh' ? 'ត្រូវការបញ្ជាទិញចូលស្តុក' : 'Needs restocking'}</span>
                </>
              ) : (
                <span className="text-emerald-600 font-semibold">{lang === 'kh' ? 'ស្តុកទាំងអស់មានសុវត្ថិភាព' : 'All items in stock'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'kh' ? 'ការបញ្ជាទិញរង់ចាំពិនិត្យ' : 'Pending Orders'}
            </span>
            <div className={`p-2 rounded-xl ${pendingOrders.length > 0 ? 'bg-violet-50 text-violet-600 animate-pulse' : 'bg-slate-50 text-slate-600'}`}>
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{pendingOrders.length}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {pendingOrders.length > 0 ? (
                <span className="text-violet-600 font-semibold">{lang === 'kh' ? 'ត្រូវការពិនិត្យ និងអនុម័ត' : 'Awaiting confirmation'}</span>
              ) : (
                <span>{lang === 'kh' ? 'គ្មានការងាររង់ចាំទេ' : 'Clean queue'}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-base">
                {lang === 'kh' ? 'និន្នាការលក់ដុំប្រចាំសប្តាហ៍' : 'Weekly Distribution Sales'}
              </h3>
              <p className="text-xs text-slate-400">{lang === 'kh' ? 'របាយការណ៍បូកសរុបចំណូលតាមថ្ងៃ' : 'Revenue generated over past week'}</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-mono font-bold">USD</span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="20" x2={svgWidth - 20} y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="60" x2={svgWidth - 20} y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="100" x2={svgWidth - 20} y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="140" x2={svgWidth - 20} y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area */}
              <path d={areaPath} fill="url(#chartGrad)" />

              {/* Line */}
              <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

              {/* Points */}
              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx={p.x} cy={p.y} r="8" fill="#4f46e5" fillOpacity="0.0" className="hover:fill-opacity-10 transition-all" />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-700 hidden group-hover:block bg-white">
                    ${chartRevenue[i]}
                  </text>
                </g>
              ))}
            </svg>

            {/* Labels */}
            <div className="flex justify-between px-4 mt-2 border-t border-slate-50 pt-2 text-[10px] font-mono text-slate-400 font-semibold">
              {chartDays.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Dealers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-sans font-bold text-slate-900 text-base mb-4">
            {lang === 'kh' ? 'តំណាងចែកចាយឆ្នើម' : 'Top Dealers (Wholesale)'}
          </h3>
          <div className="space-y-4">
            {topDealers.map((dlr, idx) => {
              const med = ['bg-amber-100 text-amber-700 border-amber-200', 'bg-slate-100 text-slate-700 border-slate-200', 'bg-orange-100 text-orange-700 border-orange-200'];
              return (
                <div 
                  key={dlr.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer"
                  onClick={() => {
                    if (setSelectedDealerId) setSelectedDealerId(dlr.id);
                    setView('dealers');
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border ${med[idx] || 'bg-slate-50 text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{dlr.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center mt-0.5">
                        <span className="font-mono bg-indigo-50 text-indigo-600 px-1 py-0.2 rounded text-[10px] mr-1 font-bold">{dlr.tier}</span>
                        {dlr.province}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">${dlr.totalPurchased.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{lang === 'kh' ? 'សរុបប្រមូលបាន' : 'Volume'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Logs & Province Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans font-bold text-slate-900 text-base flex items-center">
              <Clock className="w-5 h-5 mr-1.5 text-slate-500" />
              {lang === 'kh' ? 'សកម្មភាពថ្មីៗ' : 'Recent Activities'}
            </h3>
            <button onClick={() => setView('orders')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              {lang === 'kh' ? 'មើលទាំងអស់' : 'View Orders'}
            </button>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {recentLogs.map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== recentLogs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                          log.type === 'order' ? 'bg-indigo-50 text-indigo-600' :
                          log.type === 'dealer' ? 'bg-emerald-50 text-emerald-600' :
                          log.type === 'inventory' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {log.type === 'order' ? 'ORD' :
                           log.type === 'dealer' ? 'DLR' :
                           log.type === 'inventory' ? 'STK' : 'BIL'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-sm text-slate-800">
                          {lang === 'kh' ? log.descriptionKh : log.descriptionEn}{' '}
                          {log.amount && (
                            <span className="font-mono font-semibold text-slate-900">(${log.amount.toFixed(2)})</span>
                          )}
                        </p>
                        <div className="text-xs text-slate-400 mt-1 flex items-center">
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="mx-1.5">•</span>
                          <span>{new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mini Province Stats Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-base mb-1">
              {lang === 'kh' ? 'ចំណែកទីផ្សារតាមខេត្ត' : 'Sales by Provinces'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{lang === 'kh' ? 'ចំនួនតំណាងចែកចាយសរុបតាមតំបន់' : 'Market reach across Cambodia'}</p>
            
            <div className="space-y-3">
              {[
                { name: 'Phnom Penh (ភ្នំពេញ)', count: 1, percent: 50, color: 'bg-indigo-500' },
                { name: 'Siem Reap (សៀមរាប)', count: 1, percent: 25, color: 'bg-indigo-400' },
                { name: 'Preah Sihanouk (ព្រះសីហនុ)', count: 1, percent: 15, color: 'bg-indigo-300' },
                { name: 'Other provinces (ខេត្តផ្សេងៗ)', count: 3, percent: 10, color: 'bg-indigo-200' }
              ].map((prov, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{prov.name}</span>
                    <span>{prov.count} {lang === 'kh' ? 'ដេប៉ូ' : 'Dealer(s)'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`${prov.color} h-1.5 rounded-full`} style={{ width: `${prov.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-50 pt-4">
            <button 
              onClick={() => setView('analytics')}
              className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-all"
            >
              {lang === 'kh' ? 'មើលរបាយការណ៍លម្អិត' : 'View Full Analytics'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
