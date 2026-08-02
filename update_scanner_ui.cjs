const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `                    <table className="w-full text-left text-sm min-w-[500px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                        <tr>
                          <th className="p-3">ឈ្មោះទំនិញ / ផលិតផល</th>
                          <th className="p-3 w-24">បរិមាណ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {aiScannerResults.map((item, idx) => (
                          <tr key={item.id} className={item.actualProduct ? 'bg-emerald-50/30' : 'bg-rose-50/30'}>
                            <td className="p-2">
                              <select
                                value={item.actualProduct ? item.actualProduct.name : item.productName}
                                onChange={(e) => {
                                  const newResults = [...aiScannerResults];
                                  const selectedName = e.target.value;
                                  const prod = products.find(p => p.name === selectedName);
                                  if (prod) {
                                    newResults[idx].productName = prod.name;
                                    newResults[idx].matchedProductId = prod.id;
                                    newResults[idx].actualProduct = prod;
                                  } else {
                                    newResults[idx].productName = selectedName;
                                    newResults[idx].matchedProductId = undefined;
                                    newResults[idx].actualProduct = undefined;
                                  }
                                  setAiScannerResults(newResults);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-sky-400 outline-none font-bold text-slate-700 cursor-pointer"
                              >
                                {item.actualProduct ? null : <option value={item.productName}>{item.productName} (មិនមានក្នុងស្តុក)</option>}
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newResults = [...aiScannerResults];
                                  newResults[idx].quantity = Number(e.target.value) || 0;
                                  setAiScannerResults(newResults);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-sky-400 outline-none font-bold text-slate-700 text-center"
                              />
                            </td>
                            <td className="p-2 w-10 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setAiScannerResults(aiScannerResults.filter((_, i) => i !== idx));
                                }}
                                className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                                title="លុប"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>`;

const replacementStr = `                    <table className="w-full text-left text-sm min-w-[500px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                        <tr>
                          <th className="p-3">ឈ្មោះទំនិញ / ផលិតផល</th>
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
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {aiScannerResults.map((item, idx) => (
                          <tr key={item.id} className={item.actualProduct ? 'bg-emerald-50/30' : 'bg-rose-50/30'}>
                            <td className="p-2">
                              <select
                                value={item.actualProduct ? item.actualProduct.name : item.productName}
                                onChange={(e) => {
                                  const newResults = [...aiScannerResults];
                                  const selectedName = e.target.value;
                                  const prod = products.find(p => p.name === selectedName);
                                  if (prod) {
                                    newResults[idx].productName = prod.name;
                                    newResults[idx].matchedProductId = prod.id;
                                    newResults[idx].actualProduct = prod;
                                  } else {
                                    newResults[idx].productName = selectedName;
                                    newResults[idx].matchedProductId = undefined;
                                    newResults[idx].actualProduct = undefined;
                                  }
                                  setAiScannerResults(newResults);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:border-sky-400 outline-none font-bold text-slate-700 cursor-pointer"
                              >
                                {item.actualProduct ? null : <option value={item.productName}>{item.productName} (មិនមានក្នុងស្តុក)</option>}
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
                                      const newResults = [...aiScannerResults];
                                      newResults[idx].soldQty = val;
                                      newResults[idx].quantity = val + (newResults[idx].exchangedQty || 0) + (newResults[idx].promoQty || 0);
                                      setAiScannerResults(newResults);
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
                                      const newResults = [...aiScannerResults];
                                      newResults[idx].exchangedQty = val;
                                      newResults[idx].quantity = (newResults[idx].soldQty || 0) + val + (newResults[idx].promoQty || 0);
                                      setAiScannerResults(newResults);
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
                                      const newResults = [...aiScannerResults];
                                      newResults[idx].promoQty = val;
                                      newResults[idx].quantity = (newResults[idx].soldQty || 0) + (newResults[idx].exchangedQty || 0) + val;
                                      setAiScannerResults(newResults);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                                  />
                                </td>
                                <td className="p-2">
                                  <div className="w-full bg-sky-50 border border-sky-100 rounded-xl px-2 py-1.5 text-xs font-black text-sky-700 text-center">
                                    {item.quantity}
                                  </div>
                                </td>
                              </>
                            ) : (
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newResults = [...aiScannerResults];
                                    newResults[idx].quantity = Number(e.target.value) || 0;
                                    setAiScannerResults(newResults);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:border-sky-400 outline-none font-bold text-slate-700 text-center"
                                />
                              </td>
                            )}
                            <td className="p-2 w-10 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setAiScannerResults(aiScannerResults.filter((_, i) => i !== idx));
                                }}
                                className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                                title="លុប"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success update ai scanner ui");
} else {
  console.log("Target not found");
}
