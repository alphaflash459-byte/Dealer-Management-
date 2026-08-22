const fs = require('fs');
let codeUser = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');
let codeAdmin = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldFooter = `            {/* Modal Footer */}
            <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingFullInvoice(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-2.5 rounded-2xl transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveFullInvoice}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 transition disabled:opacity-70 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {loading ? (
                  <span>កំពុងរក្សាទុក...</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>រក្សាទុកវិក្កយបត្រ</span>
                  </>
                )}
              </button>
            </div>`;

const newFooter = `            {/* Modal Footer */}
            <div className="p-4 sm:p-6 pt-4 border-t border-slate-100 flex space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingFullInvoice(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 rounded-full transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveFullInvoice}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-3 rounded-full shadow-lg shadow-amber-500/20 transition disabled:opacity-70 cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>កំពុងរក្សាទុក...</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>រក្សាទុកវិក្កយបត្រ</span>
                  </>
                )}
              </button>
            </div>`;

codeUser = codeUser.replace(oldFooter, newFooter);
codeAdmin = codeAdmin.replace(oldFooter, newFooter);

fs.writeFileSync('src/components/UserDashboard.tsx', codeUser);
fs.writeFileSync('src/components/AdminDashboard.tsx', codeAdmin);
