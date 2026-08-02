const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `              {/* Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center space-x-3 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockInModalOpen(false);
                    setStockInItems([]);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer animate-in duration-100"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading || stockInItems.length === 0}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-sky-600/30 transition disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>`;

const replacement = `              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-50 bg-slate-50/50 flex space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockInModalOpen(false);
                    setStockInItems([]);
                  }}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading || stockInItems.length === 0}
                  className="flex-[2] bg-sky-500 hover:bg-sky-600 disabled:opacity-70 text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-sky-500/20 active:scale-[0.98] transition"
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success footer");
} else {
  console.log("Target not found footer");
}
