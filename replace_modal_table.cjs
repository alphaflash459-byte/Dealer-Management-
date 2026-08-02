const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const searchRegex = /<div className="p-4 sm:p-6 overflow-y-auto custom-scroll flex-1">[\s\S]*?(?=<div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50\/50 flex space-x-3 shrink-0">)/;

const replaceContent = `<div className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden flex-1">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="ស្វែងរកទំនិញ..."
                  value={manualAddSearchText}
                  onChange={e => setManualAddSearchText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <div className="flex-1 overflow-auto custom-scroll border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-48">ឈ្មោះទំនិញ</th>
                      {aiScannerType === 'Stock Sold' ? (
                        <>
                          <th className="p-3 w-20 text-center">លក់</th>
                          <th className="p-3 w-20 text-center">ក្រវិល</th>
                          <th className="p-3 w-20 text-center">ថែម</th>
                          <th className="p-3 w-20 text-center font-bold text-sky-600">សរុប</th>
                        </>
                      ) : (
                        <th className="p-3 w-24 text-center">បរិមាណ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {manualAddItems.filter(item => item.productName.toLowerCase().includes(manualAddSearchText.toLowerCase())).map((item) => {
                      const actualIdx = manualAddItems.findIndex(mi => mi.id === item.id);
                      return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="p-2">
                          <select
                            value={item.productName}
                            onChange={e => {
                              const pName = e.target.value;
                              const actual = products.find(p => p.name === pName);
                              const newItems = [...manualAddItems];
                              newItems[actualIdx] = { ...item, productName: pName, matchedProductId: actual?.id, actualProduct: actual };
                              setManualAddItems(newItems);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition truncate"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        {aiScannerType === 'Stock Sold' ? (
                          <>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.soldQty || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const newItems = [...manualAddItems];
                                  newItems[actualIdx] = { ...item, soldQty: val, quantity: val + item.exchangedQty + item.promoQty };
                                  setManualAddItems(newItems);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.exchangedQty || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const newItems = [...manualAddItems];
                                  newItems[actualIdx] = { ...item, exchangedQty: val, quantity: item.soldQty + val + item.promoQty };
                                  setManualAddItems(newItems);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.promoQty || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const newItems = [...manualAddItems];
                                  newItems[actualIdx] = { ...item, promoQty: val, quantity: item.soldQty + item.exchangedQty + val };
                                  setManualAddItems(newItems);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-amber-600 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                              />
                            </td>
                            <td className="p-2">
                              <div className="w-full bg-slate-100 rounded-xl px-2 py-1.5 text-xs font-black text-sky-600 text-center border border-slate-100">
                                {item.quantity}
                              </div>
                            </td>
                          </>
                        ) : (
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity || ''}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                const newItems = [...manualAddItems];
                                newItems[actualIdx] = { ...item, quantity: val };
                                setManualAddItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                            />
                          </td>
                        )}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
            `;

content = content.replace(searchRegex, replaceContent);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log("Replaced modal content");
