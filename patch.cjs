const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

// The correct header snippet
const correctHeader = `                <h3 className="text-lg font-black text-slate-800">
                  បញ្ចូលទិន្នន័យ {activeTab === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' ? 'ស្តុកឡើងឡាន' : activeTab === 'Stock Return' ? 'ស្តុកត្រឡប់' : ' '}
                </h3>
                <p className="text-xs text-slate-500 font-medium">បំពេញព័ត៌មានខាងក្រោមដើម្បីរក្សាទុក</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">
                      {activeTab === 'Stock Out' ? 'អ្នកដឹកជញ្ជូន/ឡាន' : activeTab === 'Stock Return' ? 'អ្នកប្រគល់/អតិថិជន' : 'ឈ្មោះអតិថិជន'}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="ឈ្មោះ..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>`;

const regex = /<h3 className="text-lg font-black text-slate-800">\s*បញ្ចូលទិន្នន័យ \{activeTab === 'Stock Sold' \? 'ស្តុកលក់ចេញ' : activeTab === 'Stock Out' \? 'ស្តុកឡើងឡាន' : activeTab === 'Stock Return' \? 'ស្តុកត្រឡប់' : ' '}\s*<\/h3>\s*<p className="text-xs text-slate-500 font-medium">បំពេញព័ត៌មាន[\s\S]*?placeholder="ឈ្មោះ\.\.\."\s*className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-emerald-400 outline-none font-bold text-slate-800"\s*\/>\s*<\/div>\s*<\/div>\s*<\/div>/;

if (regex.test(code)) {
  code = code.replace(regex, correctHeader);
  console.log('Fixed header block!');
} else {
  console.log('Could not find header block!');
}

const newEmptyState = `{/* Invoice Lines list */}
                {items.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="border border-slate-100 rounded-2xl bg-slate-50/30 p-2 sm:p-3 space-y-1">`;

if (code.includes('📦 សូមជ្រើសរើសទំនិញខាងលើ')) {
  code = code.replace(
    /\{\/\* Invoice Lines list \*\/\}\s*<div className="space-y-1\.5">\s*\{items\.length === 0 \? \(\s*<div className="border border-dashed border-slate-200 rounded-2xl py-8 px-4 text-center text-xs text-slate-400 font-bold bg-slate-50\/30">\s*📦 សូមជ្រើសរើសទំនិញខាងលើ ដើម្បីបន្ថែមចូលក្នុងបញ្ជី\s*<\/div>\s*\) : \(\s*<div className="border border-slate-100 rounded-2xl bg-slate-50\/30 p-2 sm:p-3 space-y-1">/,
    newEmptyState
  );
  console.log('Fixed empty state block!');
} else {
  console.log('Could not find empty state block!');
}

// Clean up the closing parentheses of the ternary operator in the empty state
// It was `) : (` so we need to remove the closing `)}` at the end of the list.
// The list ends at:
//                           return (
//                            ...
//                          );
//                        })}
//                      </div>
//                    </div>
//                  )}
//                </div>

// Let's replace the `)}` with nothing? Wait, the ternary operator `items.length === 0 ? (...) : (...)` ended with `)}`.
// Now we used `items.length > 0 && (...)`. That ends with `)}` as well! So we don't need to change the closing parenthesis!
// Wait! Previously it was `{items.length === 0 ? (...) : ( <div>...</div> )}`.
// The closing was `)}`.
// Now it is `{items.length > 0 && ( <div>...</div> )}`.
// The closing is STILL `)}`! So the syntax is valid!

fs.writeFileSync('src/components/UserDashboard.tsx', code);
