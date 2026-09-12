const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const modalCode = `
      {/* Pallet Config Modal */}
      {isPalletConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800">ការកំណត់ទីតាំង និងបាឡែត (Pallet Configuration)</h3>
                <p className="text-xs text-slate-500 font-medium">រៀបចំឃ្លាំង និងកំណត់ចំនួនទំនិញក្នុងមួយបាឡែត</p>
              </div>
              <button
                onClick={() => setIsPalletConfigModalOpen(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scroll space-y-6 bg-slate-50/50">
              {/* Layout Config */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-700 mb-4 flex items-center space-x-2">
                  <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-xs">📐</span>
                  <span>ទំហំឃ្លាំង និងបាឡែត (Warehouse Layout)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">បាឡែតខាងឆ្វេង (ប៉ុន្មានជួរ)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.leftRows || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, leftRows: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">បាឡែតខាងស្តាំ (ប៉ុន្មានជួរ)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.rightRows || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, rightRows: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">បណ្តោយ (ប៉ុន្មានបាឡែត)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.depth || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, depth: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">កម្ពស់ស្តុក (ប៉ុន្មានបាឡែត)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.maxHeight || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, maxHeight: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Product Capacities */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-700 mb-4 flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">📦</span>
                  <span>ចំនួនក្នុងមួយបាឡែតតាមទំនិញ (Qty per Pallet)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {products.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 px-3 rounded-xl border border-slate-100 hover:border-blue-200 transition">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate mr-2" title={p.name}>{p.name}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={palletConfig?.capacities?.[p.name] || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setPalletConfig({
                            ...palletConfig,
                            capacities: {
                              ...(palletConfig.capacities || {}),
                              [p.name]: val
                            }
                          });
                        }}
                        className="w-16 sm:w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center text-[11px] sm:text-xs font-black text-slate-700 focus:border-blue-400 outline-none transition"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button
                onClick={async () => {
                  try {
                    await setDoc(doc(db, 'settings', 'palletConfig'), palletConfig);
                    setIsPalletConfigModalOpen(false);
                    // Optional: show a small toast or success indicator
                  } catch (err) {
                    console.error('Error saving pallet config:', err);
                    alert('មានបញ្ហាក្នុងការរក្សាទុក!');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                រក្សាទុក (Save)
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('</div>\n  );\n}', modalCode + '\n</div>\n  );\n}');
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
