const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
let target = fs.readFileSync('temp_target.txt', 'utf8');

// The replacement script
const targetEnd = `              <button
                type="button"
                onClick={() => {
                  const validItems = quickAddItems.filter(item => item.quantity && Number(item.quantity) > 0);
                  setStockInItems([...stockInItems, ...validItems]);
                  setIsQuickAddModalOpen(false);
                }}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm py-3 rounded-2xl transition shadow-lg shadow-sky-600/20 cursor-pointer"
              >
                បញ្ជាក់
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}`;

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('      {/* Quick Add Modal */}'));
const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes('      {/* កែប្រែស្តុកឃ្លាំង Modal */}'));

if (startIdx !== -1 && endIdx !== -1) {
  const before = lines.slice(0, startIdx);
  const after = lines.slice(endIdx);
  
  const replacement = `      {/* Quick Add Modal */}
      {isQuickAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsQuickAddModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800">បញ្ចូលរហ័សទាំងអស់</h3>
              <button onClick={() => setIsQuickAddModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden flex-1">
              <div className="flex-1 overflow-auto custom-scroll border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-48">ឈ្មោះទំនិញ</th>
                      <th className="p-3 w-24 text-center">បរិមាណ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quickAddItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition">
                        <td className="p-2">
                          <select
                            value={item.productName}
                            onChange={e => {
                              const copy = [...quickAddItems];
                              copy[index].productName = e.target.value;
                              setQuickAddItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition truncate"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity || ''}
                            onChange={e => {
                              const copy = [...quickAddItems];
                              copy[index].quantity = e.target.value;
                              setQuickAddItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition text-center"
                            placeholder="ចំនួន"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50/50 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  const validItems = quickAddItems.filter(item => item.quantity && Number(item.quantity) > 0);
                  setStockInItems([...stockInItems, ...validItems]);
                  setIsQuickAddModalOpen(false);
                }}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm py-3 rounded-2xl transition shadow-md shadow-sky-500/20"
              >
                រក្សាទុក
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
`;
  
  const newContent = [...before, replacement, ...after].join('\n');
  fs.writeFileSync('src/components/AdminDashboard.tsx', newContent);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find bounds", startIdx, endIdx);
}
