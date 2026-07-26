const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const badCode = `        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-800">
              {activeTab === 'Report' 
                ? 'របាយការណ៍ស្តុកសរុប'
                : activeTab === 'Stock Order'
                ? 'ស្តុកកម្មង់'
                : \`ប្រវត្តិប្រតិបត្តិការ\${activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}\`}
            </h3>
            <p className="text-slate-500 text-[10px] md:text-xs mt-0.5 font-medium">
              {activeTab === 'Report' 
                ? 'ព័ត៌មាននិងចំនួនស្តុកលម្អិតសម្រាប់ទំនិញនីមួយៗ'
                : activeTab === 'Stock Order'
                ? 'បញ្ជីកម្មង់ទំនិញទាំងអស់របស់សមាជិក'
                : \`របាយការណ៍\${activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់'}\`}
            </p>
          </div>
          {activeTab !== 'Report' && activeTab !== 'Stock Order' ? (
            <button
              onClick={openModal}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>បញ្ចូលទិន្នន័យ</span>
            </button>
          ) : (
            activeTab === 'Stock Order' && (
              <button
                onClick={openOrderModal}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl font-black shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>បង្កើតការកម្មង់</span>
              </button>
            )
          )}
        </div>
        
        {activeTab !== 'Stock Order' && (
          <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
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
          </div>
        )}`;

const goodCode = `        <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">
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

const startIndex = code.indexOf('<div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">');

if (startIndex === -1) {
  console.log("Could not find start block");
  process.exit(1);
}

// Find the end of the block
const endStr = '          </div>\n        )}';
const endIndex = code.indexOf(endStr, startIndex);

if (endIndex === -1) {
    console.log("Could not find end block");
    process.exit(1);
}

const finalCode = code.substring(0, startIndex) + goodCode + code.substring(endIndex + endStr.length);
fs.writeFileSync('src/components/UserDashboard.tsx', finalCode);
console.log('Done!');
