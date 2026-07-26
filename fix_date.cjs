const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const badCodeStart = `        <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div className="flex-1 grid grid-cols-2 gap-3">`;

const goodCode = `        <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 px-1">ចាប់ពីថ្ងៃ</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 px-1">ដល់ថ្ងៃ</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition"
              />
            </div>
          </div>
          {activeTab === 'Report' && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>របាយការណ៍ PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportSoldInvoicesPDF}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>ស្តុកលក់ PDF</span>
              </button>
            </div>
          )}
        </div>`;

const lines = code.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('        <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">')) {
    if (lines[i+1].includes('          <div className="flex-1 grid grid-cols-2 gap-3">')) {
      startIdx = i;
    }
  }
}

if (startIdx !== -1) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('          </div>')) {
      if (lines[i+1] && lines[i+1].includes('        )}')) {
        endIdx = i + 1;
        break;
      }
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, goodCode);
  fs.writeFileSync('src/components/UserDashboard.tsx', lines.join('\n'));
  console.log('Fixed date block!');
} else {
  console.log('Could not find boundaries', startIdx, endIdx);
}
