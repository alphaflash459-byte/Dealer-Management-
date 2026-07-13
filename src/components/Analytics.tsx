import React from 'react';
import { BarChart3, TrendingUp, Award, MapPin, PieChart, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Dealer, Order, Product } from '../types';
import { CAMBODIAN_PROVINCES } from '../data/mockData';

interface AnalyticsProps {
  dealers: Dealer[];
  orders: Order[];
  products: Product[];
  lang: 'kh' | 'en';
}

export default function Analytics({
  dealers,
  orders,
  products,
  lang
}: AnalyticsProps) {
  // Count tiers
  const goldCount = dealers.filter(d => d.tier === 'Gold').length;
  const silverCount = dealers.filter(d => d.tier === 'Silver').length;
  const bronzeCount = dealers.filter(d => d.tier === 'Bronze').length;
  const totalDlr = dealers.length;

  // Revenue by province
  const provinceSales = CAMBODIAN_PROVINCES.map(prov => {
    // Sum orders for dealers in this province
    const provDealers = dealers.filter(d => d.province === prov.en).map(d => d.id);
    const total = orders
      .filter(o => o.status !== 'Cancelled' && provDealers.includes(o.dealerId))
      .reduce((sum, o) => sum + o.total, 0);
    return {
      nameEn: prov.en,
      nameKh: prov.kh,
      sales: total,
      dealerCount: dealers.filter(d => d.province === prov.en).length
    };
  }).sort((a, b) => b.sales - a.sales);

  const maxSales = Math.max(...provinceSales.map(p => p.sales)) || 1000;

  // Category sales volume
  const categorySales = products.reduce((acc, prod) => {
    // Sum quantities of this product in delivered/approved orders
    const volume = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => {
        const item = o.items.find(i => i.productId === prod.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
    
    acc[prod.category] = (acc[prod.category] || 0) + (volume * prod.price);
    return acc;
  }, {} as Record<string, number>);

  const categoriesList = Object.keys(categorySales).map(cat => ({
    name: cat,
    value: categorySales[cat]
  })).sort((a, b) => b.value - a.value);

  // Growth Eligibility Calculator (Tier Upgrades)
  // Targets: Bronze -> Silver is $5,000 total purchased; Silver -> Gold is $15,000
  const SILVER_TARGET = 5000;
  const GOLD_TARGET = 15000;

  const upgradeCandidates = dealers
    .filter(d => d.tier !== 'Gold')
    .map(d => {
      const target = d.tier === 'Bronze' ? SILVER_TARGET : GOLD_TARGET;
      const nextTier = d.tier === 'Bronze' ? 'Silver' : 'Gold';
      const progressPercent = Math.min(Math.round((d.totalPurchased / target) * 100), 100);
      const remaining = Math.max(target - d.totalPurchased, 0);
      return {
        ...d,
        target,
        nextTier,
        progressPercent,
        remaining
      };
    })
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
          {lang === 'kh' ? 'ស្ថិតិវិភាគ និងរបាយការណ៍លក់' : 'Advanced Sales Analytics'}
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          {lang === 'kh' 
            ? 'វិភាគទិន្នន័យលក់ដុំតាមតំបន់ ចំណែកទីផ្សារតាមផលិតផល និងការលូតលាស់របស់តំណាងចែកចាយ។' 
            : 'Explore sales outputs per province, identify hot-selling categories, and trace dealer tier promotions.'}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Geographic Bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-sm">{lang === 'kh' ? 'ចំណូលលក់ដុំតាមខេត្ត/ក្រុង' : 'Geographic Revenue Distribution'}</h3>
              <p className="text-[11px] text-slate-400">{lang === 'kh' ? 'ចំណាត់ថ្នាក់ខេត្តដែលមានតម្រូវការទិញខ្ពស់បំផុត' : 'Provincial demand rankings'}</p>
            </div>
            <MapPin className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-3">
            {provinceSales.map((prov, idx) => {
              const barPercent = Math.max((prov.sales / maxSales) * 100, 2);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{lang === 'kh' ? prov.nameKh : prov.nameEn}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({prov.dealerCount} {lang === 'kh' ? 'ដេប៉ូ' : 'dealers'})</span>
                    </div>
                    <span className="text-slate-800 font-bold">${prov.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-2 border border-slate-100/50">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${barPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut chart for tiers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-sm">{lang === 'kh' ? 'សមាមាត្រកម្រិតតំណាង' : 'Dealer Tier Breakdown'}</h3>
                <p className="text-[11px] text-slate-400">{lang === 'kh' ? 'ចំនួនតំណាងចែកចាយតាមក្រុម Tier' : 'Partner distribution ratio'}</p>
              </div>
              <PieChart className="w-5 h-5 text-indigo-500" />
            </div>

            {/* Custom SVG Donut Chart */}
            <div className="flex justify-center py-4 relative">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                
                {/* Gold Circle (Gold fraction) */}
                <circle 
                  cx="72" cy="72" r="50" fill="none" stroke="#d97706" strokeWidth="12" 
                  strokeDasharray={`${(goldCount/totalDlr) * 314} 314`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                />

                {/* Silver Circle */}
                <circle 
                  cx="72" cy="72" r="50" fill="none" stroke="#64748b" strokeWidth="12" 
                  strokeDasharray={`${(silverCount/totalDlr) * 314} 314`}
                  strokeDashoffset={`-${(goldCount/totalDlr) * 314}`}
                  strokeLinecap="round"
                />

                {/* Bronze Circle */}
                <circle 
                  cx="72" cy="72" r="50" fill="none" stroke="#c2410c" strokeWidth="12" 
                  strokeDasharray={`${(bronzeCount/totalDlr) * 314} 314`}
                  strokeDashoffset={`-${((goldCount+silverCount)/totalDlr) * 314}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-slate-800 leading-none">{totalDlr}</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 uppercase">{lang === 'kh' ? 'ដៃគូសរុប' : 'Total Dealers'}</span>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="space-y-2 text-xs pt-2">
              <div className="flex justify-between items-center p-1.5 rounded-lg border border-amber-50 bg-amber-50/20">
                <span className="flex items-center text-slate-700 font-medium">
                  <span className="w-3 h-3 rounded bg-amber-600 mr-2" />
                  Gold (Discount 10%)
                </span>
                <span className="font-bold text-amber-700">{goldCount} ({totalDlr ? Math.round((goldCount/totalDlr)*100) : 0}%)</span>
              </div>
              <div className="flex justify-between items-center p-1.5 rounded-lg border border-slate-100 bg-slate-50/20">
                <span className="flex items-center text-slate-700 font-medium">
                  <span className="w-3 h-3 rounded bg-slate-500 mr-2" />
                  Silver (Discount 5%)
                </span>
                <span className="font-bold text-slate-600">{silverCount} ({totalDlr ? Math.round((silverCount/totalDlr)*100) : 0}%)</span>
              </div>
              <div className="flex justify-between items-center p-1.5 rounded-lg border border-orange-50 bg-orange-50/20">
                <span className="flex items-center text-slate-700 font-medium">
                  <span className="w-3 h-3 rounded bg-orange-700 mr-2" />
                  Bronze (No Discount)
                </span>
                <span className="font-bold text-orange-700">{bronzeCount} ({totalDlr ? Math.round((bronzeCount/totalDlr)*100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bottom Grid: Category sales + Dealer Promotions Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Product Categories Share */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-sm">{lang === 'kh' ? 'ប្រភពចំណូលតាមប្រភេទផលិតផល' : 'Revenue per Product Category'}</h3>
              <p className="text-[11px] text-slate-400">{lang === 'kh' ? 'បែងចែកចំណូលដែលលក់បានតាមផ្នែកទំនិញ' : 'Catalog department performance'}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-3.5">
            {categoriesList.map((cat, i) => (
              <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-700 font-semibold">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">${cat.value.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {categoriesList.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">{lang === 'kh' ? 'គ្មានទិន្នន័យចំណូលលក់' : 'No sales registered yet.'}</p>
            )}
          </div>
        </div>

        {/* Dealer promotions Tracker (Bronze -> Silver -> Gold upgrade criteria) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-sm">{lang === 'kh' ? 'តារាងតាមដានលក្ខខណ្ឌឡើងកម្រិត' : 'Dealer Promotion Watchlist'}</h3>
                <p className="text-[11px] text-slate-400">{lang === 'kh' ? 'តំណាងចែកចាយជិតសម្រេចលក្ខខណ្ឌឡើង Tier' : 'Partners nearing next tier thresholds'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {upgradeCandidates.map((dlr) => (
              <div key={dlr.id} className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{dlr.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{dlr.businessName}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center">
                    {dlr.tier} → {dlr.nextTier}
                    <ArrowUpRight className="w-3 h-3 ml-0.5 text-indigo-500" />
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>{lang === 'kh' ? `លក់បានសរុប៖ $${dlr.totalPurchased.toLocaleString()}` : `Purchased: $${dlr.totalPurchased.toLocaleString()}`}</span>
                    <span>{dlr.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${dlr.progressPercent}%` }}></div>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end">
                    <Award className="w-3.5 h-3.5 mr-1" />
                    <span>{lang === 'kh' ? `ខ្វះតែ $${dlr.remaining.toLocaleString()} ទៀតដើម្បីឡើងថ្នាក់` : `Only $${dlr.remaining.toLocaleString()} left to qualify`}</span>
                  </div>
                </div>
              </div>
            ))}

            {upgradeCandidates.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">{lang === 'kh' ? 'តំណាងចែកចាយទាំងអស់បានឡើងដល់ Gold អស់ហើយ' : 'All partners are already top tier Gold status.'}</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
