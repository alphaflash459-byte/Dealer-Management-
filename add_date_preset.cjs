const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">ប្រភេទឯកសារយោង</label>
                <select 
                  value={exportDocType} 
                  onChange={(e) => setExportDocType(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                >
                  <option value="reports">របាយការណ៍</option>
                  <option value="warehouse">ស្តុកឃ្លាំង</option>
                  <option value="stock_in">ស្តុកចូល</option>
                  <option value="stock_count">ស្តុករាប់</option>
                  <option value="stock_out">ស្តុកឡើងឡាន</option>
                  <option value="stock_sold">ស្តុកលក់</option>
                  <option value="stock_return">ស្តុកត្រឡប់</option>
                  <option value="stock_lost_excess">ស្តុកបាត់/លើស</option>
                  
                  
                </select>
              </div>`;

const replacement = `              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">ប្រភេទឯកសារយោង</label>
                <select 
                  value={exportDocType} 
                  onChange={(e) => setExportDocType(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                >
                  <option value="reports">របាយការណ៍</option>
                  <option value="warehouse">ស្តុកឃ្លាំង</option>
                  <option value="stock_in">ស្តុកចូល</option>
                  <option value="stock_count">ស្តុករាប់</option>
                  <option value="stock_out">ស្តុកឡើងឡាន</option>
                  <option value="stock_sold">ស្តុកលក់</option>
                  <option value="stock_return">ស្តុកត្រឡប់</option>
                  <option value="stock_lost_excess">ស្តុកបាត់/លើស</option>
                </select>
              </div>

              <div>
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
              </div>

              {(() => {
                if (!filterTxStartDate && !filterTxEndDate) return false;
                const today = new Date();
                const tzOffset = today.getTimezoneOffset() * 60000;
                const localToday = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
                const yesterday = new Date(today.getTime() - 86400000);
                const localYesterday = new Date(yesterday.getTime() - tzOffset).toISOString().split('T')[0];
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const localFirstDay = new Date(firstDay.getTime() - tzOffset).toISOString().split('T')[0];
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                const localLastDay = new Date(lastDay.getTime() - tzOffset).toISOString().split('T')[0];

                const isPreset = (filterTxStartDate === localToday && filterTxEndDate === localToday) ||
                                 (filterTxStartDate === localYesterday && filterTxEndDate === localYesterday) ||
                                 (filterTxStartDate === localFirstDay && filterTxEndDate === localLastDay);
                return !isPreset;
              })() && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">ចាប់ផ្តើម</label>
                    <input
                      type="date"
                      value={filterTxStartDate}
                      onChange={(e) => setFilterTxStartDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">បញ្ចប់</label>
                    <input
                      type="date"
                      value={filterTxEndDate}
                      onChange={(e) => setFilterTxEndDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                    />
                  </div>
                </div>
              )}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Added preset');
