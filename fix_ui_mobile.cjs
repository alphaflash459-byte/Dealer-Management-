const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const oldCode = `        <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">
          {activeTab !== 'Stock Order' ? (
            <div className="flex-1 grid grid-cols-2 max-w-sm gap-3">
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
          ) : (
            <div className="flex-1"></div>
          )}
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeTab === 'Report' && (
              <>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">របាយការណ៍ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportSoldInvoicesPDF}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">ស្តុកលក់ PDF</span>
                </button>
              </>
            )}

            {activeTab !== 'Report' && activeTab !== 'Stock Order' && (
              <button
                onClick={openModal}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បញ្ចូលទិន្នន័យ</span>
              </button>
            )}

            {activeTab === 'Stock Order' && (
              <button
                onClick={openOrderModal}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បង្កើតការកម្មង់</span>
              </button>
            )}
          </div>
        </div>`;

const newCode = `        <div className="bg-slate-50 p-2 md:p-3.5 rounded-xl md:rounded-2xl mb-3 md:mb-4 border border-slate-100 flex flex-row items-end justify-between gap-2 md:gap-3 shrink-0 w-full overflow-x-auto custom-scroll">
          {activeTab !== 'Stock Order' ? (
            <div className="flex flex-row flex-1 max-w-sm gap-2">
              <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                <label className="text-[9px] md:text-xs font-bold text-slate-500 px-1 whitespace-nowrap">ចាប់ពីថ្ងៃ</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg md:rounded-xl px-1.5 md:px-3 py-2 text-[10px] md:text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-50 transition min-w-[90px]"
                />
              </div>
              <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                <label className="text-[9px] md:text-xs font-bold text-slate-500 px-1 whitespace-nowrap">ដល់ថ្ងៃ</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg md:rounded-xl px-1.5 md:px-3 py-2 text-[10px] md:text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-50 transition min-w-[90px]"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1"></div>
          )}
          
          <div className="flex flex-row items-center gap-2 shrink-0">
            {activeTab === 'Report' && (
              <>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 md:px-3.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition whitespace-nowrap active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer h-[32px] md:h-[40px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">របាយការណ៍ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportSoldInvoicesPDF}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 md:px-3.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition whitespace-nowrap active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer h-[32px] md:h-[40px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">ស្តុកលក់ PDF</span>
                </button>
              </>
            )}

            {activeTab !== 'Report' && activeTab !== 'Stock Order' && (
              <button
                onClick={openModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-sm px-2.5 md:px-4 py-2 rounded-lg md:rounded-2xl font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer flex items-center h-[34px] md:h-[40px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="ml-1 whitespace-nowrap">បញ្ចូលទិន្នន័យ</span>
              </button>
            )}

            {activeTab === 'Stock Order' && (
              <button
                onClick={openOrderModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] md:text-sm px-2.5 md:px-4 py-2 rounded-lg md:rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer flex items-center h-[34px] md:h-[40px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="ml-1 whitespace-nowrap">បង្កើតការកម្មង់</span>
              </button>
            )}
          </div>
        </div>`;

const startIndex = code.indexOf('<div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">');

if (startIndex === -1) {
  console.log("Could not find start block");
  process.exit(1);
}

// Find the end of the block
const endStr = '          </div>\n        </div>';
const endIndex = code.indexOf(endStr, startIndex);

if (endIndex === -1) {
    console.log("Could not find end block");
    process.exit(1);
}

const finalCode = code.substring(0, startIndex) + newCode + code.substring(endIndex + endStr.length);
fs.writeFileSync('src/components/UserDashboard.tsx', finalCode);
console.log('Done replacing block!');
