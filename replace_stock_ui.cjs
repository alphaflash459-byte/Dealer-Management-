const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetRegex = /\{\/\* Multi-Stock List Selection \*\/\}[\s\S]*?(?=\{\/\* Footer Actions \*\/)/;

const replaceString = `{/* Upload Section */}
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">រូបភាពវិក្កយបត្រ ឬកំណត់ត្រា</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center bg-sky-50/50 rounded-2xl border border-sky-100 p-2 overflow-hidden cursor-pointer" onClick={() => stockInFileInputRef.current?.click()}>
                      <div className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-sky-600 shadow-sm border border-sky-100">
                        ជ្រើសរើសរូបភាព
                      </div>
                      <span className="text-[11px] sm:text-xs text-slate-500 font-bold px-3 sm:px-4 truncate flex-1 text-right min-w-0">
                        {stockInFileName || "មិនទាន់ជ្រើសរើសឯកសារឡើយ"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={stockInFileInputRef}
                        onChange={handleStockInImageUpload}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleStockInScan}
                      disabled={stockInScannerLoading || !stockInImage}
                      className="bg-sky-400 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-sky-400/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                    >
                      {stockInScannerLoading ? 'កំពុងស្កេន...' : 'ស្កេនទាញយកទិន្នន័យ'}
                    </button>
                  </div>
                </div>

                {stockInImage && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative h-48 md:h-64 flex items-center justify-center">
                     <img src={stockInImage} alt="Scanned Note" className="max-h-full object-contain" />
                  </div>
                )}

                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 px-1">ទិន្នន័យ (ស្កេន ឬបញ្ចូលដោយដៃ)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const existingNames = new Set(stockInItems.map(i => i.productName));
                          const newItems = products
                            .filter(p => !existingNames.has(p.name))
                            .map(p => ({ productName: p.name, quantity: '' }));
                          setStockInItems([...stockInItems, ...newItems]);
                        }}
                        className="text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold px-2 sm:px-3 py-1.5 rounded-lg transition"
                      >
                        + បញ្ចូលរហ័សទាំងអស់
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockInItems([...stockInItems, { productName: products[0]?.name || '', quantity: '' }])}
                        className="text-[10px] sm:text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold px-2 sm:px-3 py-1.5 rounded-lg transition"
                      >
                        + បន្ថែមទំនិញ
                      </button>
                    </div>
                  </div>
                  
                  {stockInItems.length > 0 ? (
                    <div className="border border-slate-200 rounded-2xl overflow-y-auto custom-scroll flex-1 max-h-[40vh]">
                      <table className="w-full text-left text-sm min-w-[500px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs sticky top-0 z-10">
                          <tr>
                            <th className="p-3">ឈ្មោះទំនិញ / ផលិតផល</th>
                            <th className="p-3 w-24 text-center">បរិមាណ</th>
                            <th className="p-3 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stockInItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="p-2">
                                <select
                                  value={item.productName}
                                  onChange={(e) => updateStockInRow(idx, 'productName', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-sky-400 outline-none transition cursor-pointer truncate"
                                >
                                  {products.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e => updateStockInRow(idx, 'quantity', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-xs focus:border-sky-400 outline-none font-bold text-slate-800 transition"
                                  required
                                  placeholder="ចំនួន"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeStockInRow(idx)}
                                  className="p-2 hover:bg-rose-50 text-rose-400 hover:text-rose-500 rounded-lg transition"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-2xl py-12 px-4 text-center text-slate-400 bg-slate-50/50 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-bold text-sm">មិនទាន់មានទិន្នន័យ។ សូមស្កេន ឬបន្ថែមដោយដៃ។</p>
                    </div>
                  )}
                </div>
              </div>
`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replaceString);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success UI replace");
} else {
  console.log("Regex not found");
}
