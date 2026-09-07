const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// PDF warehouse
const t1 = `if (exportDocType === 'warehouse') {
        title = 'របាយការណ៍ស្តុកឃ្លាំង';
        headers = ['ល.រ', 'មុខទំនិញ', 'ស្តុកដើមគ្រា', 'ស្តុកចូល', 'ស្តុកឡើងឡាន', 'ស្តុកត្រឡប់', 'ចំនួនលក់', 'ដូរក្រវិល', 'ចំនួនថែម', 'ស្តុកសល់'];
        rows = products.map((p, idx) => {`;
const r1 = t1.replace('products.map', 'orderedProducts.map');

// PDF stock_count
const t2 = `if (filterTxStartDate) {
          const d = new Date(filterTxStartDate + 'T00:00:00');
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          previousDayStr = \`\${year}-\${month}-\${day}\`;
        }
        
        rows = products.map((p, idx) => {`;
const r2 = t2.replace('products.map', 'orderedProducts.map');

// Excel warehouse
const t3 = `if (exportDocType === 'warehouse') {
        title = 'របាយការណ៍ស្តុកឃ្លាំង';
        headers = ['ល.រ', 'មុខទំនិញ', 'ស្តុកដើមគ្រា', 'ស្តុកចូល', 'ស្តុកឡើងឡាន', 'ស្តុកត្រឡប់', 'ចំនួនលក់', 'ដូរក្រវិល', 'ចំនួនថែម', 'ស្តុកសល់'];
        rows = products.map((p, idx) => {`;
const r3 = t3.replace('products.map', 'orderedProducts.map');

// Excel stock_count
const t4 = `if (filterTxStartDate) {
          const d = new Date(filterTxStartDate + 'T00:00:00');
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          previousDayStr = \`\${year}-\${month}-\${day}\`;
        }
        
        rows = products.map((p, idx) => {`;
const r4 = t4.replace('products.map', 'orderedProducts.map');

// Dashboard view table
const t5 = `<tbody className="divide-y divide-slate-50 text-[10px] sm:text-[11px] md:text-xs">
                {products.map(product => {
                  let rangeStockIn = 0;`;
const r5 = t5.replace('products.map', 'orderedProducts.map');

// Dashboard filter dropdown
const t6 = `<select
                value={dashboardFilterProduct}
                onChange={(e) => setDashboardFilterProduct(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="all">ទាំងអស់</option>
                {products.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>`;
const r6 = t6.replace('products.map', 'orderedProducts.map');


if (content.includes(t1)) {
  let count = 0;
  content = content.replaceAll(t1, r1);
  console.log('Replaced t1');
} else { console.log('t1 missing'); }

if (content.includes(t2)) {
  content = content.replaceAll(t2, r2);
  console.log('Replaced t2');
} else { console.log('t2 missing'); }

// Note: t1 and t3 are identical, so replaceAll handles both.
// Same for t2 and t4.

if (content.includes(t5)) {
  content = content.replace(t5, r5);
  console.log('Replaced t5');
} else { console.log('t5 missing'); }

if (content.includes(t6)) {
  content = content.replace(t6, r6);
  console.log('Replaced t6');
} else { console.log('t6 missing'); }


fs.writeFileSync('src/components/AdminDashboard.tsx', content);
