const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

// Target the editingFullInvoice modal block in UserDashboard
const oldHeaderInputs = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">
                    {editingFullInvoice.type === 'Stock Sold' ? 'ឈ្មោះអតិថិជន' : editingFullInvoice.type === 'Stock Out' ? 'អ្នកប្រគល់' : 'អ្នកទទួល'}
                  </label>
                  <input
                    type="text"
                    value={editingFullInvoice.customerName}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, customerName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                    placeholder="ឈ្មោះអតិថិជន..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">ទីតាំង</label>
                  <input
                    type="text"
                    value={editingFullInvoice.location}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, location: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                    placeholder="ទីតាំង..."
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">កាលបរិច្ឆេទ</label>
                  <input
                    type="date"
                    value={editingFullInvoice.date ? editingFullInvoice.date.split('T')[0] : ''}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                  />
                </div>
              </div>`;

const newHeaderInputs = `<div className="flex flex-col space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">
                    {editingFullInvoice.type === 'Stock Sold' ? 'ឈ្មោះអតិថិជន' : editingFullInvoice.type === 'Stock Out' ? 'អ្នកប្រគល់' : 'អ្នកទទួល'}
                  </label>
                  <input
                    type="text"
                    value={editingFullInvoice.customerName}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, customerName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 transition"
                    placeholder={editingFullInvoice.type === 'Stock Sold' ? 'ឈ្មោះអតិថិជន...' : 'AI Scan'}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">ទីតាំង</label>
                  <input
                    type="text"
                    value={editingFullInvoice.location}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, location: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 transition"
                    placeholder="ទីតាំង..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">កាលបរិច្ឆេទ</label>
                  <input
                    type="date"
                    value={editingFullInvoice.date ? editingFullInvoice.date.split('T')[0] : ''}
                    onChange={e => setEditingFullInvoice({ ...editingFullInvoice, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>`;

code = code.replace(oldHeaderInputs, newHeaderInputs);

// Now for the item list
const oldItemListHeader = `<div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    បញ្ជីទំនិញក្នុងវិក្កយបត្រ ({editingFullInvoice.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultProd = products[0];
                      const newPrice = defaultProd?.price || 0;
                      setEditingFullInvoice({
                        ...editingFullInvoice,
                        items: [
                          ...editingFullInvoice.items,
                          {
                            productName: defaultProd?.name || '',
                            quantity: 1,
                            price: editingFullInvoice.type === 'Stock Sold' ? newPrice : '',
                            promoQty: 0
                          }
                        ]
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl transition flex items-center space-x-1 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>+ ថែមទំនិញ</span>
                  </button>
                </div>`;
                
const newItemListHeader = `<div className="flex justify-between items-center px-1">
                  <h4 className="text-sm font-black text-slate-700 tracking-wider">
                    បញ្ជីទំនិញក្នុងវិក្កយបត្រ ({editingFullInvoice.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultProd = products[0];
                      const newPrice = defaultProd?.price || 0;
                      setEditingFullInvoice({
                        ...editingFullInvoice,
                        items: [
                          ...editingFullInvoice.items,
                          {
                            productName: defaultProd?.name || '',
                            quantity: 1,
                            price: editingFullInvoice.type === 'Stock Sold' ? newPrice : '',
                            promoQty: 0
                          }
                        ]
                      });
                    }}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-bold rounded-full transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>ថែមទំនិញ</span>
                  </button>
                </div>`;
                
code = code.replace(oldItemListHeader, newItemListHeader);

// Row items
const oldRowItems = `return (
                        <div key={idx} className="p-2 sm:p-3 bg-slate-50/50 hover:bg-slate-50 transition space-y-1.5">
                          <div className="flex items-end gap-1.5 sm:gap-2 w-full">
                            {/* Product selection */}
                            <div className="flex-1 min-w-0">
                              <label className="text-[10px] font-bold text-slate-400 block sm:hidden mb-1">ឈ្មោះទំនិញ</label>
                              <select
                                value={item.productName}
                                onChange={e => {
                                  const newProdName = e.target.value;
                                  const newProd = products.find(p => p.name === newProdName);
                                  const newPrice = newProd?.price !== undefined ? newProd.price : item.price;
                                  const updated = [...editingFullInvoice.items];
                                  updated[idx] = {
                                    ...updated[idx],
                                    productName: newProdName,
                                    price: editingFullInvoice.type === 'Stock Sold' ? newPrice : item.price
                                  };
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-400 truncate"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Quantity */}
                            <div className="w-16 sm:w-24 shrink-0">
                              <label className="text-[10px] font-bold text-slate-400 block sm:hidden mb-1">បរិមាណ</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => {
                                  const updated = [...editingFullInvoice.items];
                                  updated[idx] = { ...updated[idx], quantity: e.target.value };
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-black text-center text-slate-800 outline-none focus:border-amber-400"
                                placeholder="ចំនួន"
                              />
                            </div>
                            {/* Price (if Stock Sold) */}
                            {editingFullInvoice.type === 'Stock Sold' && (
                              <div className="w-16 sm:w-24 shrink-0">
                                <label className="text-[10px] font-bold text-slate-400 block sm:hidden mb-1">តម្លៃ ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.price}
                                  onChange={e => {
                                    const updated = [...editingFullInvoice.items];
                                    updated[idx] = { ...updated[idx], price: e.target.value };
                                    setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-right text-slate-800 outline-none focus:border-amber-400"
                                  placeholder="តម្លៃ"
                                />
                              </div>
                            )}
                            {/* Subtotal & Delete button */}
                            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                              {editingFullInvoice.type === 'Stock Sold' && (
                                <div className="hidden sm:block text-right w-16">
                                  <span className="text-xs font-black text-indigo-600">
                                    \${(qtyNum * prNum).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingFullInvoice.items.length <= 1) {
                                    alert("វិក្កយបត្រត្រូវតែមានយ៉ាងហោចណាស់ទំនិញមួយ");
                                    return;
                                  }
                                  const updated = editingFullInvoice.items.filter((_, i) => i !== idx);
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="p-1.5 hover:bg-rose-100 text-rose-500 rounded-lg transition cursor-pointer"
                                title="លុបទំនិញនេះ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {/* Promo display if computedPromo > 0 */}
                          {computedPromo > 0 && (
                            <div className="text-[10px] font-black text-emerald-600 pl-1">
                              🎁 ថែមឥតគិតថ្លៃ: +{computedPromo}
                            </div>
                          )}
                        </div>
                      );`;

const newRowItems = `return (
                        <div key={idx} className="p-3 sm:p-4 hover:bg-slate-50 transition flex flex-col space-y-2">
                          <div className="flex items-center gap-3 w-full">
                            {/* Product selection */}
                            <div className="flex-1 min-w-0 flex flex-col space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-400">ឈ្មោះទំនិញ</label>
                              <select
                                value={item.productName}
                                onChange={e => {
                                  const newProdName = e.target.value;
                                  const newProd = products.find(p => p.name === newProdName);
                                  const newPrice = newProd?.price !== undefined ? newProd.price : item.price;
                                  const updated = [...editingFullInvoice.items];
                                  updated[idx] = {
                                    ...updated[idx],
                                    productName: newProdName,
                                    price: editingFullInvoice.type === 'Stock Sold' ? newPrice : item.price
                                  };
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 truncate"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Quantity */}
                            <div className="w-24 shrink-0 flex flex-col space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-400">បរិមាណ</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e => {
                                    const updated = [...editingFullInvoice.items];
                                    updated[idx] = { ...updated[idx], quantity: e.target.value };
                                    setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm font-black text-center text-slate-800 outline-none focus:border-amber-400"
                                  placeholder="ចំនួន"
                                />
                                {/* Delete button next to quantity */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingFullInvoice.items.length <= 1) {
                                      alert("វិក្កយបត្រត្រូវតែមានយ៉ាងហោចណាស់ទំនិញមួយ");
                                      return;
                                    }
                                    const updated = editingFullInvoice.items.filter((_, i) => i !== idx);
                                    setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                  }}
                                  className="p-1.5 hover:bg-rose-100 text-rose-500 rounded-lg transition cursor-pointer shrink-0"
                                  title="លុបទំនិញនេះ"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            {/* Price (if Stock Sold) - Stacked vertically as well if it was present */}
                            {editingFullInvoice.type === 'Stock Sold' && (
                              <div className="w-24 shrink-0 flex flex-col space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400">តម្លៃ ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.price}
                                  onChange={e => {
                                    const updated = [...editingFullInvoice.items];
                                    updated[idx] = { ...updated[idx], price: e.target.value };
                                    setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm font-semibold text-right text-slate-800 outline-none focus:border-amber-400"
                                  placeholder="តម្លៃ"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Subtotal & Promo */}
                          <div className="flex justify-between items-center w-full">
                            {computedPromo > 0 ? (
                              <div className="text-[11px] font-black text-emerald-600 pl-1">
                                🎁 ថែមឥតគិតថ្លៃ: +{computedPromo}
                              </div>
                            ) : <div></div>}
                            
                            {editingFullInvoice.type === 'Stock Sold' && (
                               <div className="text-right">
                                 <span className="text-xs font-black text-indigo-600">
                                   \${(qtyNum * prNum).toFixed(2)}
                                 </span>
                               </div>
                            )}
                          </div>
                        </div>
                      );`;

code = code.replace(oldRowItems, newRowItems);

fs.writeFileSync('src/components/UserDashboard.tsx', code);
