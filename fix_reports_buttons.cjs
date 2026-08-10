const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldHeader = `<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 border-b border-slate-100 pb-2 shrink-0 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!isEditingReport ? (
                <button
                  onClick={() => {
                    const initialData: Record<string, any> = {};
                    txGroupedByProduct.forEach(p => {
                      initialData[p.productName] = {
                        stockOut: String(p.stockOut),
                        stockSold: String(p.stockSold),
                        stockExchanged: String(p.stockExchanged),
                        stockPromo: String(p.stockPromo),
                        stockReturn: String(p.stockReturn)
                      };
                    });
                    setEditedReportData(initialData);
                    setIsEditingReport(true);
                  }}
                  className="flex items-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>កែប្រែ</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditingReport(false)}
                    className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold active:scale-95 transition cursor-pointer"
                  >
                    <span>បោះបង់</span>
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleSaveReport}
                    className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                       <span>កំពុងរក្សាទុក...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>រក្សាទុក</span>
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={handleExportSelectedUserStockExcel}
                className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>នាំចេញ Excel</span>
              </button>
              <button
                onClick={handleExportSelectedUserStockPDF}
                className="flex items-center space-x-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>នាំចេញ PDF</span>
              </button>\\n              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] sm:text-xs px-3 py-2 rounded-xl font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>នាំចេញ</span>
              </button>
            </div>
          </div>`;

const newHeader = `<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 border-b border-slate-100 pb-2 shrink-0 gap-2">
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              {!isEditingReport ? (
                <button
                  onClick={() => {
                    const initialData: Record<string, any> = {};
                    txGroupedByProduct.forEach(p => {
                      initialData[p.productName] = {
                        stockOut: String(p.stockOut),
                        stockSold: String(p.stockSold),
                        stockExchanged: String(p.stockExchanged),
                        stockPromo: String(p.stockPromo),
                        stockReturn: String(p.stockReturn)
                      };
                    });
                    setEditedReportData(initialData);
                    setIsEditingReport(true);
                  }}
                  className="flex-1 flex justify-center items-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>កែប្រែ</span>
                </button>
              ) : (
                <div className="col-span-1 grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setIsEditingReport(false)}
                    className="flex justify-center items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold active:scale-95 transition cursor-pointer whitespace-nowrap"
                  >
                    <span>បោះបង់</span>
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleSaveReport}
                    className="flex justify-center items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? (
                       <span>កំពុងរក្សាទុក...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>រក្សាទុក</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              <button
                onClick={handleExportSelectedUserStockExcel}
                className="flex-1 flex justify-center items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>នាំចេញ Excel</span>
              </button>
              <button
                onClick={handleExportSelectedUserStockPDF}
                className="flex-1 flex justify-center items-center space-x-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>នាំចេញ PDF</span>
              </button>
            </div>
          </div>`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed reports buttons');
