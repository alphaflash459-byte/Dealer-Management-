const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const exportModalUI = `
      {/* Export Modal */}
      {isExportModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExportModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800">ការនាំចេញទិន្នន័យ</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">ប្រភេទឯកសារ (Type file)</label>
                <div className="flex gap-3">
                  <label className={\`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition \${exportFileType === 'pdf' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}\`}>
                    <input type="radio" name="fileType" value="pdf" checked={exportFileType === 'pdf'} onChange={() => setExportFileType('pdf')} className="hidden" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    <span className="font-bold">PDF</span>
                  </label>
                  <label className={\`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition \${exportFileType === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}\`}>
                    <input type="radio" name="fileType" value="excel" checked={exportFileType === 'excel'} onChange={() => setExportFileType('excel')} className="hidden" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="font-bold">Excel</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">ប្រភេទឯកសារយោង (Type Document)</label>
                <select 
                  value={exportDocType} 
                  onChange={(e) => setExportDocType(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                >
                  <option value="reports">របាយការណ៍ (Reports)</option>
                  <option value="warehouse">ស្តុកឃ្លាំង (Warehouse Stock)</option>
                  <option value="stock_in">ស្តុកចូល (Stock In)</option>
                  <option value="stock_count">ស្តុករាប់ (Stock Count)</option>
                  <option value="stock_out">ស្តុកឡើងឡាន (Stock Out)</option>
                  <option value="stock_sold">ស្តុកលក់ (Stock Sold)</option>
                  <option value="stock_return">ស្តុកត្រឡប់ (Stock Return)</option>
                  <option value="stock_lost_excess">ស្តុកបាត់/លើស (Lost/Excess)</option>
                </select>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={handleGeneralExport}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition"
              >
                នាំចេញឥឡូវនេះ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
`;

const insertBefore = `{/* Quick Add Modal */}`;

if (!code.includes('{/* Export Modal */}')) {
  code = code.replace(insertBefore, exportModalUI + '\n      ' + insertBefore);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Added export modal UI');
