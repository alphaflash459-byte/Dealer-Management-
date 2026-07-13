import React, { useState } from 'react';
import { Search, Plus, Filter, Package, AlertTriangle, RefreshCw, Layers, DollarSign, TrendingUp, Check } from 'lucide-react';
import { Product } from '../types';

interface InventoryListProps {
  products: Product[];
  onRestock: (productId: string, amount: number) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  lang: 'kh' | 'en';
}

export default function InventoryList({
  products,
  onRestock,
  onAddProduct,
  lang
}: InventoryListProps) {
  // Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(50);

  // Form states (new product)
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Beverage');
  const [formPrice, setFormPrice] = useState(10);
  const [formStock, setFormStock] = useState(100);
  const [formMinStock, setFormMinStock] = useState(25);
  const [formUnit, setFormUnit] = useState('Case (កេស)');

  // Categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.stock <= p.minStock && p.stock > p.minStock * 0.3;
    } else if (stockFilter === 'critical') {
      matchesStock = p.stock <= p.minStock * 0.3;
    } else if (stockFilter === 'good') {
      matchesStock = p.stock > p.minStock;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (p: Product) => {
    if (p.stock <= p.minStock * 0.3) {
      return { labelKh: 'គ្រោះថ្នាក់ (ខ្លាំង)', labelEn: 'Critical', color: 'text-rose-600 bg-rose-50 border-rose-200', barColor: 'bg-rose-500' };
    }
    if (p.stock <= p.minStock) {
      return { labelKh: 'ខ្វះខាត', labelEn: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-200', barColor: 'bg-amber-500' };
    }
    return { labelKh: 'សុវត្ថិភាព', labelEn: 'Good Stock', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', barColor: 'bg-emerald-500' };
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({
      name: formName,
      sku: formSku.toUpperCase(),
      category: formCategory,
      price: Number(formPrice),
      stock: Number(formStock),
      minStock: Number(formMinStock),
      unit: formUnit
    });
    // Reset form
    setFormName('');
    setFormSku('');
    setFormPrice(10);
    setFormStock(100);
    setFormMinStock(25);
    setFormUnit('Case (កេស)');
    setIsAddOpen(false);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    onRestock(restockProduct.id, Number(restockQty));
    setRestockProduct(null);
    setRestockQty(50);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {lang === 'kh' ? 'គ្រប់គ្រងបញ្ជី និងស្តុកទំនិញ' : 'Product Inventory Catalog'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {lang === 'kh' 
              ? 'គ្រប់គ្រងព័ត៌មានទំនិញ តម្លៃបោះដុំ កម្រិតស្តុកអប្បបរមា និងបញ្ចូលស្តុកបន្ថែមយ៉ាងរហ័ស។' 
              : 'Monitor active SKUs, wholesale pricing models, safety stock reserves, and manage restock intakes.'}
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'kh' ? 'បន្ថែមទំនិញថ្មី' : 'Add New Product'}</span>
        </button>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'kh' ? 'ស្វែងរកឈ្មោះទំនិញ ឬលេខកូដ SKU...' : 'Search product name or SKU...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50/50"
          />
        </div>

        {/* Filter select */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-600"
          >
            <option value="all">{lang === 'kh' ? 'គ្រប់ប្រភេទ (Categories)' : 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-600"
          >
            <option value="all">{lang === 'kh' ? 'គ្រប់ស្ថានភាពស្តុក' : 'All Stock Status'}</option>
            <option value="good">{lang === 'kh' ? 'ស្តុកគ្រប់គ្រាន់ (Good)' : 'Safe / Good'}</option>
            <option value="low">{lang === 'kh' ? 'ស្តុកតិច (Low)' : 'Low Stock Warning'}</option>
            <option value="critical">{lang === 'kh' ? 'ស្តុកជិតអស់ខ្លាំង (Critical)' : 'Critical / Empty'}</option>
          </select>
        </div>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => {
          const status = getStockStatus(p);
          const percent = Math.min(Math.round((p.stock / (p.minStock * 2)) * 100), 100);
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                {/* Card Top: SKU, Category & Status */}
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {p.sku}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.color}`}>
                    {lang === 'kh' ? status.labelKh : status.labelEn}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-sans font-bold text-slate-800 text-sm leading-snug line-clamp-1 mb-1">
                  {p.name}
                </h3>
                <span className="text-xs text-slate-400 font-semibold">{p.category}</span>

                {/* Pricing & Units */}
                <div className="mt-4 flex items-baseline justify-between border-b border-slate-50 pb-3">
                  <span className="text-xs text-slate-400 font-medium">{lang === 'kh' ? 'តម្លៃបោះដុំ' : 'Wholesale Price'}</span>
                  <span className="text-lg font-bold text-slate-800">${p.price.toFixed(2)} <span className="text-xs font-medium text-slate-400">/{p.unit}</span></span>
                </div>

                {/* Stock visualization progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500">{lang === 'kh' ? 'ស្តុកបច្ចុប្បន្ន' : 'Current Stock'}</span>
                    <span className="text-slate-800">{p.stock} <span className="text-slate-400 font-medium">/{p.unit.split(' ')[0]}</span></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${status.barColor}`} style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{lang === 'kh' ? `អប្បបរមា៖ ${p.minStock}` : `Safety limit: ${p.minStock}`}</span>
                    <span>{lang === 'kh' ? 'កម្រិតល្អបំផុត' : 'Optimal'}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons on card footer */}
              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center space-x-2">
                <button
                  onClick={() => setRestockProduct(p)}
                  className="flex-1 flex items-center justify-center space-x-1 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'បញ្ចូលស្តុកថ្មី' : 'Quick Restock'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 font-semibold">
            {lang === 'kh' ? 'រកមិនឃើញទំនិញទេ' : 'No products found match search criteria.'}
          </div>
        )}
      </div>

      {/* Restock dialog Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">{lang === 'kh' ? 'បញ្ចូលស្តុកទំនិញបន្ថែម' : 'Restock Product Intake'}</h3>
            <p className="text-xs text-slate-400 mb-4">{restockProduct.name} ({restockProduct.sku})</p>
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'kh' ? `បរិមាណត្រូវបន្ថែម (${restockProduct.unit})` : `Quantity to add (${restockProduct.unit})`}
                </label>
                <input
                  type="number" required min={1} value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-50">
                <button
                  type="button" onClick={() => setRestockProduct(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-500 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg"
                >
                  {lang === 'kh' ? 'បញ្ចូលទិន្នន័យ' : 'Confirm Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{lang === 'kh' ? 'ចុះឈ្មោះទំនិញថ្មី' : 'Register New Product SKU'}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ឈ្មោះទំនិញ' : 'Product Name'}</label>
                  <input
                    type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Fanta Fruit Punch"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'កូដទំនិញ SKU' : 'SKU Code'}</label>
                  <input
                    type="text" required value={formSku} onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. FANTA-CAN-08"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ប្រភេទ' : 'Category'}</label>
                  <select
                    value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Beverage">Beverage</option>
                    <option value="Alcoholic">Alcoholic</option>
                    <option value="Water">Water</option>
                    <option value="Energy">Energy Drink</option>
                    <option value="Grain">Grain / Rice</option>
                    <option value="Grocery">Grocery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ខ្នាត/ឯកតា' : 'Unit Packaging'}</label>
                  <input
                    type="text" required value={formUnit} onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. Case (កេស)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'តម្លៃបោះដុំ ($)' : 'Price ($)'}</label>
                  <input
                    type="number" required step={0.01} value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ស្តុកចាប់ផ្តើម' : 'Initial Stock'}</label>
                  <input
                    type="number" required value={formStock} onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === 'kh' ? 'ស្តុកអប្បបរមា' : 'Min Stock'}</label>
                  <input
                    type="number" required value={formMinStock} onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  {lang === 'kh' ? 'រក្សាទុក' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
