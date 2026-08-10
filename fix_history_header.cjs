const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldHeader = `<div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">ប្រវត្តិស្តុកចូល </h3>
                <p className="text-xs text-slate-500 font-medium">បញ្ជីរាយនាមនៃការបញ្ចូលស្តុកថ្មីចូលក្នុងឃ្លាំង</p>
              </div>`;

const newHeader = `<div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">ប្រវត្តិស្តុកចូល និងស្តុករាប់</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">ទិន្នន័យនៃប្រវត្តិនៃការបញ្ចូលស្តុក និងការរាប់ស្តុកជាក់ស្តែង</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setStockHistoryFilter('all')} className={\`px-3 py-1 text-xs font-bold rounded-full transition \${stockHistoryFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>ទាំងអស់</button>
                  <button onClick={() => setStockHistoryFilter('in')} className={\`px-3 py-1 text-xs font-bold rounded-full transition \${stockHistoryFilter === 'in' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>ស្តុកចូល</button>
                  <button onClick={() => setStockHistoryFilter('count')} className={\`px-3 py-1 text-xs font-bold rounded-full transition \${stockHistoryFilter === 'count' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>ស្តុករាប់</button>
                </div>
              </div>`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Successfully updated history modal header');
