const fs = require('fs');
let codeUser = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');
let codeAdmin = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `return (
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

const newStr = `return (
                        <div key={idx} className="p-4 hover:bg-slate-50 transition flex flex-col space-y-2">
                          <div className="flex items-end gap-3 sm:gap-4 w-full">
                            {/* Product selection */}
                            <div className="flex-1 min-w-0 flex flex-col space-y-2">
                              <label className="text-xs font-bold text-slate-400">ឈ្មោះទំនិញ</label>
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
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 truncate"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Quantity */}
                            <div className="w-20 sm:w-24 shrink-0 flex flex-col space-y-2">
                              <label className="text-xs font-bold text-slate-400">បរិមាណ</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => {
                                  const updated = [...editingFullInvoice.items];
                                  updated[idx] = { ...updated[idx], quantity: e.target.value };
                                  setEditingFullInvoice({ ...editingFullInvoice, items: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-sm font-black text-center text-slate-800 outline-none focus:border-amber-400"
                                placeholder="ចំនួន"
                              />
                            </div>
                            
                            {/* Price (if Stock Sold) */}
                            {editingFullInvoice.type === 'Stock Sold' && (
                              <div className="w-20 sm:w-24 shrink-0 flex flex-col space-y-2">
                                <label className="text-xs font-bold text-slate-400">តម្លៃ ($)</label>
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
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-sm font-semibold text-right text-slate-800 outline-none focus:border-amber-400"
                                  placeholder="តម្លៃ"
                                />
                              </div>
                            )}

                            {/* Delete button (Aligned to bottom of inputs) */}
                            <div className="shrink-0 pb-1.5">
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
                                className="p-2 hover:bg-rose-100 text-rose-500 rounded-xl transition cursor-pointer"
                                title="លុបទំនិញនេះ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
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

codeUser = codeUser.replace(targetStr, newStr);
codeAdmin = codeAdmin.replace(targetStr, newStr);

// A separate pass if the comment for Price is slightly different in AdminDashboard
const adminTargetStr = targetStr.replace('                            {/* Price (if Stock Sold) - Stacked vertically as well if it was present */}', '                            {/* Price (if Stock Sold) */}');
if (codeAdmin.indexOf(adminTargetStr) !== -1) {
  codeAdmin = codeAdmin.replace(adminTargetStr, newStr);
}

fs.writeFileSync('src/components/UserDashboard.tsx', codeUser);
fs.writeFileSync('src/components/AdminDashboard.tsx', codeAdmin);
