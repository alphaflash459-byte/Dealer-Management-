const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetToRemove = `              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">ចន្លោះកាលបរិច្ឆេទ</label>
                <select 
                  value={(() => {
                    if (!filterTxStartDate && !filterTxEndDate) return 'all';
                    const today = new Date();
                    const tzOffset = today.getTimezoneOffset() * 60000;
                    const localToday = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
                    const yesterday = new Date(today.getTime() - 86400000);
                    const localYesterday = new Date(yesterday.getTime() - tzOffset).toISOString().split('T')[0];
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const localFirstDay = new Date(firstDay.getTime() - tzOffset).toISOString().split('T')[0];
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    const localLastDay = new Date(lastDay.getTime() - tzOffset).toISOString().split('T')[0];

                    if (filterTxStartDate === localToday && filterTxEndDate === localToday) return 'today';
                    if (filterTxStartDate === localYesterday && filterTxEndDate === localYesterday) return 'yesterday';
                    if (filterTxStartDate === localFirstDay && filterTxEndDate === localLastDay) return 'this_month';
                    return 'custom';
                  })()} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const today = new Date();
                    const tzOffset = today.getTimezoneOffset() * 60000;
                    const localToday = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
                    
                    if (val === 'all') {
                      setFilterTxStartDate('');
                      setFilterTxEndDate('');
                    } else if (val === 'today') {
                      setFilterTxStartDate(localToday);
                      setFilterTxEndDate(localToday);
                    } else if (val === 'yesterday') {
                      const yesterday = new Date(today.getTime() - 86400000);
                      const localYesterday = new Date(yesterday.getTime() - tzOffset).toISOString().split('T')[0];
                      setFilterTxStartDate(localYesterday);
                      setFilterTxEndDate(localYesterday);
                    } else if (val === 'this_month') {
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                      const localFirstDay = new Date(firstDay.getTime() - tzOffset).toISOString().split('T')[0];
                      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                      const localLastDay = new Date(lastDay.getTime() - tzOffset).toISOString().split('T')[0];
                      setFilterTxStartDate(localFirstDay);
                      setFilterTxEndDate(localLastDay);
                    }
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                >
                  <option value="all">ទាំងអស់ (All time)</option>
                  <option value="today">ថ្ងៃនេះ (Today)</option>
                  <option value="yesterday">ម្សិលមិញ (Yesterday)</option>
                  <option value="this_month">ខែនេះ (This month)</option>
                  <option value="custom">ជ្រើសរើសដោយខ្លួនឯង (Custom)</option>
                </select>
              </div>`;

code = code.replace(targetToRemove, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Removed preset dropdown');
