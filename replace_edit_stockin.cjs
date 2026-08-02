const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `{editStockInItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-700 mb-1">{item.productName}</div>
                          </div>
                          <div className="w-28 relative">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const newItems = [...editStockInItems];
                                newItems[idx].quantity = e.target.value;
                                setកែប្រែStockInItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-sky-400 outline-none font-bold text-slate-800 pr-8"
                              placeholder="ចំនួន"
                              required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                              ឯកតា
                            </div>
                          </div>
                        </div>
                      ))}`;

const replacement = `{editStockInItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="flex-1">
                            <select
                              value={item.productName}
                              onChange={(e) => {
                                const newItems = [...editStockInItems];
                                newItems[idx].productName = e.target.value;
                                setកែប្រែStockInItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-sky-400 outline-none transition cursor-pointer truncate"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-28 relative">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const newItems = [...editStockInItems];
                                newItems[idx].quantity = e.target.value;
                                setកែប្រែStockInItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-sky-400 outline-none font-bold text-slate-800 pr-8"
                              placeholder="ចំនួន"
                              required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                              ឯកតា
                            </div>
                          </div>
                        </div>
                      ))}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target not found");
}
