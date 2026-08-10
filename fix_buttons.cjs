const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldButtons = `<div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsStockInHistoryOpen(true)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-sm active:scale-95 transition cursor-pointer"
              >
                <span>ប្រវត្តិស្តុកចូល</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockInDeliverer('Admin');
                  setStockInItems([]);
                  setIsStockInModalOpen(true);
                }}
                className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-sky-600/10 active:scale-95 transition cursor-pointer"
              >
                <span>ស្តុកចូល</span>
              </button>
            </div>`;

const newButtons = `<div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsStockInHistoryOpen(true)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-sm active:scale-95 transition cursor-pointer"
              >
                <span>ប្រវត្តិបញ្ចូល/រាប់</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockInputType('count');
                  setStockInDeliverer('Admin');
                  setStockInItems([]);
                  setIsStockInModalOpen(true);
                }}
                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-emerald-600/10 active:scale-95 transition cursor-pointer"
              >
                <span>ស្តុករាប់</span>
              </button>
              <button
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

code = code.replace(oldButtons, newButtons);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Successfully updated warehouse tab buttons');
