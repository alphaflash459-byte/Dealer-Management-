const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

// Replace the Stock Order filter part inside the main layout
const oldHeader = `          {activeTab !== 'Stock Order' ? (
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
          )}`;

const newHeader = `          {activeTab !== 'Stock Order' ? (
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
            <div className="flex-1 flex bg-white border border-slate-200 p-0.5 rounded-lg md:rounded-xl self-end h-[34px] md:h-[40px]">
              <button
                onClick={() => setOrderFilter('all')}
                className={\`flex-1 px-2 md:px-4 rounded-md md:rounded-lg text-[10px] md:text-xs font-black transition-all cursor-pointer whitespace-nowrap \${
                  orderFilter === 'all'
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }\`}
              >
                ទាំងអស់
              </button>
              <button
                onClick={() => setOrderFilter('pending')}
                className={\`flex-1 px-2 md:px-4 rounded-md md:rounded-lg text-[10px] md:text-xs font-black transition-all cursor-pointer whitespace-nowrap \${
                  orderFilter === 'pending'
                    ? 'bg-amber-50 text-amber-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }\`}
              >
                មិនទាន់ដឹក
              </button>
              <button
                onClick={() => setOrderFilter('delivered')}
                className={\`flex-1 px-2 md:px-4 rounded-md md:rounded-lg text-[10px] md:text-xs font-black transition-all cursor-pointer whitespace-nowrap \${
                  orderFilter === 'delivered'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }\`}
              >
                ដឹករួច
              </button>
            </div>
          )}`;
code = code.replace(oldHeader, newHeader);

const oldFilterBlock = `              <div className="flex flex-col h-full">
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 self-start shrink-0">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer \${
                      orderFilter === 'all'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }\`}
                  >
                    ទាំងអស់
                  </button>
                  <button
                    onClick={() => setOrderFilter('pending')}
                    className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer \${
                      orderFilter === 'pending'
                        ? 'bg-white text-amber-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }\`}
                  >
                    មិនទាន់ដឹក
                  </button>
                  <button
                    onClick={() => setOrderFilter('delivered')}
                    className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer \${
                      orderFilter === 'delivered'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }\`}
                  >
                    ដឹករួច
                  </button>
                </div>
                {stockOrders.filter(o => orderFilter === 'all' ? true : orderFilter === 'pending' ? !o.delivered : o.delivered).length === 0 ? (`;

const newFilterBlock = `              <div className="flex flex-col h-full">
                {stockOrders.filter(o => orderFilter === 'all' ? true : orderFilter === 'pending' ? !o.delivered : o.delivered).length === 0 ? (`;

code = code.replace(oldFilterBlock, newFilterBlock);
fs.writeFileSync('src/components/UserDashboard.tsx', code);
console.log('Done moving order filter');
