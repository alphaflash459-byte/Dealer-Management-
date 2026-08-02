const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const modalCode = `
      {manualAddMode !== 'none' && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setManualAddMode('none')}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800">
                {manualAddMode === 'all' ? 'បញ្ចូលរហ័សទាំងអស់' : 'បន្ថែមទំនិញ'}
              </h3>
              <button onClick={() => setManualAddMode('none')} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto custom-scroll flex-1">
              <div className="space-y-4">
                {manualAddItems.map((item, idx) => (
                  <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="mb-3">
                      <label className="text-xs font-bold text-slate-500 px-1 mb-1 block">ឈ្មោះទំនិញ</label>
                      <select
                        value={item.productName}
                        onChange={e => {
                          const pName = e.target.value;
                          const actual = products.find(p => p.name === pName);
                          const newItems = [...manualAddItems];
                          newItems[idx] = { ...item, productName: pName, matchedProductId: actual?.id, actualProduct: actual };
                          setManualAddItems(newItems);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    {aiScannerType === 'Stock Sold' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-500 px-1 mb-1 block">លក់</label>
                          <input
                            type="number"
                            min="0"
                            value={item.soldQty || ''}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const newItems = [...manualAddItems];
                              newItems[idx] = { ...item, soldQty: val, quantity: val + item.exchangedQty + item.promoQty };
                              setManualAddItems(newItems);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 px-1 mb-1 block">ក្រវិល</label>
                          <input
                            type="number"
                            min="0"
                            value={item.exchangedQty || ''}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const newItems = [...manualAddItems];
                              newItems[idx] = { ...item, exchangedQty: val, quantity: item.soldQty + val + item.promoQty };
                              setManualAddItems(newItems);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 px-1 mb-1 block">ថែម</label>
                          <input
                            type="number"
                            min="0"
                            value={item.promoQty || ''}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const newItems = [...manualAddItems];
                              newItems[idx] = { ...item, promoQty: val, quantity: item.soldQty + item.exchangedQty + val };
                              setManualAddItems(newItems);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-amber-600 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-500 px-1 mb-1 block">បរិមាណសរុប</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || ''}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            const newItems = [...manualAddItems];
                            newItems[idx] = { ...item, quantity: val };
                            setManualAddItems(newItems);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50/50 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setManualAddMode('none')}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  if (manualAddMode === 'all') {
                    // Replace or append? For "all", usually replace is better, but append works too.
                    const newResults = [...aiScannerResults];
                    manualAddItems.forEach(item => {
                      if (item.quantity > 0) {
                        const existingIdx = newResults.findIndex(r => r.matchedProductId === item.matchedProductId);
                        if (existingIdx >= 0) {
                          newResults[existingIdx].quantity += item.quantity;
                          newResults[existingIdx].soldQty = (newResults[existingIdx].soldQty || 0) + item.soldQty;
                          newResults[existingIdx].exchangedQty = (newResults[existingIdx].exchangedQty || 0) + item.exchangedQty;
                          newResults[existingIdx].promoQty = (newResults[existingIdx].promoQty || 0) + item.promoQty;
                        } else {
                          newResults.push(item);
                        }
                      }
                    });
                    setAiScannerResults(newResults);
                  } else {
                    setAiScannerResults([...aiScannerResults, ...manualAddItems]);
                  }
                  setManualAddMode('none');
                }}
                className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition"
              >
                បញ្ជាក់ឲ្យចូល
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
`;

const search = `        </div>,
        document.body
      )}`;

content = content.replace(search, search + modalCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log("Added manual add modal");
