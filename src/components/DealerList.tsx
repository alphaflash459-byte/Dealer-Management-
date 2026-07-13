import React, { useState } from 'react';
import { Search, Plus, Filter, Mail, Phone, MapPin, Award, CheckCircle, XCircle, ChevronRight, User, Trash2, Edit3, DollarSign, Calendar } from 'lucide-react';
import { Dealer, DealerTier, DealerStatus, Order } from '../types';
import { CAMBODIAN_PROVINCES } from '../data/mockData';

interface DealerListProps {
  dealers: Dealer[];
  orders: Order[];
  onAddDealer: (dealer: Omit<Dealer, 'id' | 'joinDate' | 'totalPurchased' | 'balance'>) => void;
  onEditDealer: (dealer: Dealer) => void;
  onDeleteDealer: (id: string) => void;
  lang: 'kh' | 'en';
  selectedDealerId: string | null;
  setSelectedDealerId: (id: string | null) => void;
}

export default function DealerList({
  dealers,
  orders,
  onAddDealer,
  onEditDealer,
  onDeleteDealer,
  lang,
  selectedDealerId,
  setSelectedDealerId
}: DealerListProps) {
  // State management
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formProvince, setFormProvince] = useState(CAMBODIAN_PROVINCES[0].en);
  const [formAddress, setFormAddress] = useState('');
  const [formTier, setFormTier] = useState<DealerTier>('Bronze');
  const [formCreditLimit, setFormCreditLimit] = useState(1000);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);

  // Filter & Search dealers
  const filteredDealers = dealers.filter((d) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.businessName.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      d.email.toLowerCase().includes(search.toLowerCase());
      
    const matchesTier = tierFilter === 'all' || d.tier === tierFilter;
    const matchesProvince = provinceFilter === 'all' || d.province === provinceFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    
    return matchesSearch && matchesTier && matchesProvince && matchesStatus;
  });

  const selectedDealer = dealers.find(d => d.id === selectedDealerId);
  const selectedDealerOrders = orders.filter(o => o.dealerId === selectedDealerId);

  // Form submit handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDealer({
      name: formName,
      businessName: formBusiness,
      phone: formPhone,
      email: formEmail,
      province: formProvince,
      address: formAddress,
      tier: formTier,
      status: 'Active',
      creditLimit: formCreditLimit
    });
    // Reset form
    setFormName('');
    setFormBusiness('');
    setFormPhone('');
    setFormEmail('');
    setFormProvince(CAMBODIAN_PROVINCES[0].en);
    setFormAddress('');
    setFormTier('Bronze');
    setFormCreditLimit(1000);
    setIsAddOpen(false);
  };

  const handleEditClick = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setFormName(dealer.name);
    setFormBusiness(dealer.businessName);
    setFormPhone(dealer.phone);
    setFormEmail(dealer.email);
    setFormProvince(dealer.province);
    setFormAddress(dealer.address);
    setFormTier(dealer.tier);
    setFormCreditLimit(dealer.creditLimit);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealer) return;
    
    onEditDealer({
      ...editingDealer,
      name: formName,
      businessName: formBusiness,
      phone: formPhone,
      email: formEmail,
      province: formProvince,
      address: formAddress,
      tier: formTier,
      creditLimit: formCreditLimit
    });
    setIsEditOpen(false);
    setEditingDealer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {lang === 'kh' ? 'គ្រប់គ្រងតំណាងចែកចាយ' : 'Dealer Network Directory'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {lang === 'kh' 
              ? 'ចុះឈ្មោះ រៀបចំពិន្ទុ កម្រិតឥណទាន និងគ្រប់គ្រងព័ត៌មានលម្អិតរបស់ដេប៉ូចែកចាយ។' 
              : 'Register, configure tier groups, credit limits, and monitor dealer account histories.'}
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'kh' ? 'បន្ថែមតំណាងចែកចាយ' : 'Add New Dealer'}</span>
        </button>
      </div>

      {/* Filters and Search toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'kh' ? 'ស្វែងរកឈ្មោះ ក្រុមហ៊ុន ឬទូរស័ព្ទ...' : 'Search name, business or phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder:text-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Province selector */}
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-600"
          >
            <option value="all">{lang === 'kh' ? 'គ្រប់ខេត្ត/ក្រុង' : 'All Provinces'}</option>
            {CAMBODIAN_PROVINCES.map(p => (
              <option key={p.en} value={p.en}>{lang === 'kh' ? p.kh : p.en}</option>
            ))}
          </select>

          {/* Tier selector */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-600"
          >
            <option value="all">{lang === 'kh' ? 'គ្រប់កម្រិត (Tiers)' : 'All Tiers'}</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
          </select>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-600"
          >
            <option value="all">{lang === 'kh' ? 'គ្រប់ស្ថានភាព' : 'All Status'}</option>
            <option value="Active">{lang === 'kh' ? 'សកម្ម' : 'Active'}</option>
            <option value="Inactive">{lang === 'kh' ? 'មិនសកម្ម' : 'Inactive'}</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout (Split Screen when a dealer is selected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Dealers list column */}
        <div className={`lg:col-span-2 space-y-4 ${selectedDealerId ? 'hidden md:block' : 'block'}`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Table layout for desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-4">{lang === 'kh' ? 'តំណាងចែកចាយ' : 'Dealer / Business'}</th>
                    <th className="py-3.5 px-4">{lang === 'kh' ? 'តំបន់' : 'Province'}</th>
                    <th className="py-3.5 px-4">{lang === 'kh' ? 'កម្រិត' : 'Tier'}</th>
                    <th className="py-3.5 px-4">{lang === 'kh' ? 'សមតុល្យជំពាក់' : 'Outstanding Balance'}</th>
                    <th className="py-3.5 px-4">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDealers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-400 font-medium">
                        {lang === 'kh' ? 'រកមិនឃើញតំណាងចែកចាយទេ' : 'No dealers match search filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDealers.map((dlr) => {
                      const isDlrSelected = selectedDealerId === dlr.id;
                      return (
                        <tr 
                          key={dlr.id}
                          className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                            isDlrSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/40 border-l-4 border-indigo-500' : ''
                          }`}
                          onClick={() => setSelectedDealerId(dlr.id)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {dlr.name.charAt(0)}
                              </div>
                              <div>
                                <span className="block font-bold text-slate-800 text-sm leading-tight">{dlr.name}</span>
                                <span className="block text-xs text-slate-400 line-clamp-1 mt-0.5">{dlr.businessName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                            {lang === 'kh' 
                              ? (CAMBODIAN_PROVINCES.find(p => p.en === dlr.province)?.kh || dlr.province)
                              : dlr.province}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              dlr.tier === 'Gold' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              dlr.tier === 'Silver' ? 'bg-slate-100 text-slate-600 border border-slate-300' :
                              'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}>
                              {dlr.tier}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-semibold text-slate-700">
                            {dlr.balance > 0 ? (
                              <span className="text-rose-600 font-bold">${dlr.balance.toFixed(2)}</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">$0.00</span>
                            )}
                            <span className="block text-[10px] text-slate-400 font-medium">/{dlr.creditLimit} {lang === 'kh' ? 'ឥណទាន' : 'limit'}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dlr.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${dlr.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span>{dlr.status === 'Active' ? (lang === 'kh' ? 'សកម្ម' : 'Active') : (lang === 'kh' ? 'មិនសកម្ម' : 'Inactive')}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1">
                              <button 
                                onClick={() => handleEditClick(dlr)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => onDeleteDealer(dlr.id)}
                                className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View card layout */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredDealers.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  {lang === 'kh' ? 'រកមិនឃើញតំណាងចែកចាយទេ' : 'No dealers match search filters.'}
                </div>
              ) : (
                filteredDealers.map((dlr) => (
                  <div 
                    key={dlr.id} 
                    className="p-4 active:bg-slate-50"
                    onClick={() => setSelectedDealerId(dlr.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {dlr.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800 text-sm">{dlr.name}</span>
                          <span className="block text-[11px] text-slate-400">{dlr.businessName}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs">
                      <span className="text-slate-500">{dlr.province}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        dlr.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>{dlr.tier}</span>
                      <span className="font-semibold text-rose-600">${dlr.balance.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detailed Side Panel (Selected Dealer View) */}
        {selectedDealer && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md space-y-5 animate-in slide-in-from-right-5 duration-200">
            {/* Slide Header */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-indigo-500" />
                <h3 className="font-sans font-bold text-slate-900 text-base">{lang === 'kh' ? 'ប្រវត្តិសង្ខេបដេប៉ូ' : 'Dealer Profile Detail'}</h3>
              </div>
              <button 
                onClick={() => setSelectedDealerId(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-xs border border-slate-200 rounded-md px-2 py-1"
              >
                {lang === 'kh' ? 'បិទ' : 'Close'}
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">{lang === 'kh' ? 'ឈ្មោះតំណាងចែកចាយ / ហាង' : 'Dealer / Business'}</span>
                <span className="font-bold text-slate-800 text-md block leading-tight mt-1">{selectedDealer.name}</span>
                <span className="text-xs text-slate-500">{selectedDealer.businessName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50/50 p-2 rounded-xl">
                  <span className="text-slate-400 block font-medium">{lang === 'kh' ? 'ទូរស័ព្ទ' : 'Phone'}</span>
                  <span className="font-bold text-slate-700 flex items-center mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    {selectedDealer.phone}
                  </span>
                </div>
                <div className="bg-slate-50/50 p-2 rounded-xl">
                  <span className="text-slate-400 block font-medium">{lang === 'kh' ? 'កម្រិតចែកចាយ' : 'Dealer Tier'}</span>
                  <span className="font-bold text-indigo-600 flex items-center mt-0.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 mr-1" />
                    {selectedDealer.tier}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-1 pt-1">
                <div className="flex items-start text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mr-1.5 flex-none mt-0.5" />
                  <span>{selectedDealer.address}</span>
                </div>
                <div className="flex items-center text-slate-500 pt-1">
                  <Calendar className="w-4 h-4 text-slate-400 mr-1.5" />
                  <span>{lang === 'kh' ? `ចូលរួម៖ ${selectedDealer.joinDate}` : `Joined: ${selectedDealer.joinDate}`}</span>
                </div>
              </div>
            </div>

            {/* Credit Utilization Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">{lang === 'kh' ? 'ការប្រើប្រាស់ឥណទានជំពាក់' : 'Credit Line Utilization'}</span>
                <span className="font-mono font-bold text-slate-800">
                  {Math.round((selectedDealer.balance / selectedDealer.creditLimit) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (selectedDealer.balance / selectedDealer.creditLimit) > 0.75 ? 'bg-rose-500' :
                    (selectedDealer.balance / selectedDealer.creditLimit) > 0.40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${Math.min((selectedDealer.balance / selectedDealer.creditLimit) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                <span>ជំពាក់៖ ${selectedDealer.balance.toFixed(2)}</span>
                <span>កម្រិតសរុប៖ ${selectedDealer.creditLimit}</span>
              </div>
            </div>

            {/* Lifetime metrics */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border border-slate-100 p-3 rounded-xl shadow-sm">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{lang === 'kh' ? 'ការទិញសរុប' : 'Lifetime Sales'}</span>
                <span className="text-base font-bold text-indigo-600 block mt-1">${selectedDealer.totalPurchased.toLocaleString()}</span>
              </div>
              <div className="border border-slate-100 p-3 rounded-xl shadow-sm">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{lang === 'kh' ? 'ការបញ្ជាទិញសរុប' : 'Total Orders'}</span>
                <span className="text-base font-bold text-slate-800 block mt-1">{selectedDealerOrders.length} {lang === 'kh' ? 'ដង' : 'times'}</span>
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-700">{lang === 'kh' ? 'ប្រវត្តិនៃការបញ្ជាទិញ' : 'Recent Order History'}</span>
              {selectedDealerOrders.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">{lang === 'kh' ? 'មិនទាន់មានប្រវត្តិទិញទេ' : 'No order history records.'}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDealerOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-2 rounded-xl border border-slate-50 text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-600 block">{order.id}</span>
                        <span className="text-slate-400 text-[10px]">{order.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-700 block">${order.total.toFixed(2)}</span>
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                          order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'Cancelled' ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'
                        }`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Dealer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{lang === 'kh' ? 'ចុះឈ្មោះតំណាងចែកចាយថ្មី' : 'Register New Dealer'}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ឈ្មោះតំណាង' : 'Dealer Name'}</label>
                  <input
                    type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sok Sopheap"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ឈ្មោះហាង/អាជីវកម្ម' : 'Business Name'}</label>
                  <input
                    type="text" required value={formBusiness} onChange={(e) => setFormBusiness(e.target.value)}
                    placeholder="e.g. Sopheap Minimart"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</label>
                  <input
                    type="text" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 012 999 999"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'អ៊ីមែល (បើមាន)' : 'Email'}</label>
                  <input
                    type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. contact@business.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ខេត្ត/ក្រុង' : 'Province'}</label>
                  <select
                    value={formProvince} onChange={(e) => setFormProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {CAMBODIAN_PROVINCES.map(p => (
                      <option key={p.en} value={p.en}>{lang === 'kh' ? p.kh : p.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'កម្រិត (Tier)' : 'Dealer Tier'}</label>
                  <select
                    value={formTier} onChange={(e) => setFormTier(e.target.value as DealerTier)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Gold">Gold (Discount 10%)</option>
                    <option value="Silver">Silver (Discount 5%)</option>
                    <option value="Bronze">Bronze (No Discount)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'កម្រិតឥណទាន ($)' : 'Credit Limit ($)'}</label>
                <input
                  type="number" required value={formCreditLimit} onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                  min={100} step={100}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'អាសយដ្ឋានលម្អិត' : 'Detailed Address'}</label>
                <textarea
                  required value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. ផ្លូវជាតិលេខ៥ ឃុំព្រែកសំរោង ស្រុកតាខ្មៅ"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-50">
                <button
                  type="button" onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-medium text-xs rounded-lg hover:bg-slate-50"
                >
                  {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg"
                >
                  {lang === 'kh' ? 'ចុះឈ្មោះដេប៉ូ' : 'Register Dealer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dealer Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{lang === 'kh' ? 'កែប្រែព័ត៌មានតំណាងចែកចាយ' : 'Edit Dealer Information'}</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ឈ្មោះតំណាង' : 'Dealer Name'}</label>
                  <input
                    type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ឈ្មោះហាង/អាជីវកម្ម' : 'Business Name'}</label>
                  <input
                    type="text" required value={formBusiness} onChange={(e) => setFormBusiness(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</label>
                  <input
                    type="text" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'អ៊ីមែល (បើមាន)' : 'Email'}</label>
                  <input
                    type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ខេត្ត/ក្រុង' : 'Province'}</label>
                  <select
                    value={formProvince} onChange={(e) => setFormProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {CAMBODIAN_PROVINCES.map(p => (
                      <option key={p.en} value={p.en}>{lang === 'kh' ? p.kh : p.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'កម្រិត (Tier)' : 'Dealer Tier'}</label>
                  <select
                    value={formTier} onChange={(e) => setFormTier(e.target.value as DealerTier)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Gold">Gold (Discount 10%)</option>
                    <option value="Silver">Silver (Discount 5%)</option>
                    <option value="Bronze">Bronze (No Discount)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'កម្រិតឥណទាន ($)' : 'Credit Limit ($)'}</label>
                  <input
                    type="number" required value={formCreditLimit} onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</label>
                  <select
                    value={editingDealer.status}
                    onChange={(e) => setEditingDealer({ ...editingDealer, status: e.target.value as DealerStatus })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Active">{lang === 'kh' ? 'សកម្ម' : 'Active'}</option>
                    <option value="Inactive">{lang === 'kh' ? 'មិនសកម្ម' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'អាសយដ្ឋានលម្អិត' : 'Detailed Address'}</label>
                <textarea
                  required value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-50">
                <button
                  type="button" onClick={() => { setIsEditOpen(false); setEditingDealer(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-medium text-xs rounded-lg hover:bg-slate-50"
                >
                  {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg"
                >
                  {lang === 'kh' ? 'រក្សាទុក' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
