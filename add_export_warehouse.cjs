const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `<button
                type="button"
                onClick={() => {
                  setStockInputType('in');
                  setStockInDeliverer('Admin');
                  setStockInItems([]);
                  setIsStockInModalOpen(true);
                }}
                className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-sky-600/10 active:scale-95 transition cursor-pointer"
              >
                <span>ស្តុកចូល</span>
              </button>
            </div>`;

const replacement = `<button
                type="button"
                onClick={() => {
                  setStockInputType('in');
                  setStockInDeliverer('Admin');
                  setStockInItems([]);
                  setIsStockInModalOpen(true);
                }}
                className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-sky-600/10 active:scale-95 transition cursor-pointer"
              >
                <span>ស្តុកចូល</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] sm:text-xs px-3 py-2 rounded-xl font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>នាំចេញ</span>
              </button>
            </div>`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log('Added export button to warehouse');
} else {
  console.log('Target not found');
}
