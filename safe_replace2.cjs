const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetToReplace = fs.readFileSync('target.txt', 'utf8').trimEnd(); // remove trailing newline

const replaceWith = `                      return (
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
                          {/* Promo display if computedPromo > 0 */}`;

if (content.includes(targetToReplace)) {
  content = content.replace(targetToReplace, replaceWith);
  fs.writeFileSync(filePath, content);
  console.log("Successfully replaced layout in AdminDashboard.tsx");
} else {
  console.log("Could not find the target string!");
}
