const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldSelect = `<select
                value={dashboardMetric}
                onChange={(e) => setDashboardMetric(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="sales">ស្តុកលក់</option>
                <option value="out">ស្តុកឡើងឡាន</option>
                <option value="return">ស្តុកត្រឡប់</option>
              </select>`;

const newSelect = `<select
                value={dashboardMetric}
                onChange={(e) => setDashboardMetric(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="out">ស្តុកឡើងឡាន</option>
                <option value="sales">ស្តុកលក់ចេញ</option>
                <option value="return">ស្តុកត្រឡប់</option>
                <option value="warehouse">ស្តុកក្នុងឃ្លាំង</option>
                <option value="in">ស្តុកចូល</option>
              </select>`;

code = code.replace(oldSelect, newSelect);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Successfully updated select options');
