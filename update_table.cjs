const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `                {(() => {
                  const hasAnySalesActivity = txGroupedByProduct.some(p => (p.stockSold + p.stockPromo + p.stockReturn) > 0);
                  
                  return txGroupedByProduct.map(p => {
                    const diff = p.stockOut - (p.stockSold + p.stockPromo + p.stockReturn);
                    let badge = null;
                    
                    if (!hasAnySalesActivity && diff > 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black text-slate-400">-</span>;
                  } else if (diff === 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-600 rounded-lg">ត្រឹមត្រូវ</span>;
                  } else if (diff > 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-rose-50 text-rose-600 rounded-lg">បាត់ ({diff})</span>;
                  } else {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-amber-50 text-amber-600 rounded-lg">លើស ({Math.abs(diff)})</span>;
                  }

                  return (
                    <tr 
                      key={p.productName} 
                      className="hover:bg-slate-50/70 transition-all border-b border-slate-100"
                    >
                      <td className="px-1.5 md:px-3 py-2 text-left font-bold text-slate-800">
                        {p.productName}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-rose-500">
                        {p.stockOut || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-emerald-600">
                        {p.stockSold || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-violet-500">
                        -
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-amber-500">
                        {p.stockPromo || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-indigo-600">
                        {p.stockReturn || '-'}
                      </td>`;

const replacementStr = `                {(() => {
                  const hasAnySalesActivity = txGroupedByProduct.some(p => (p.totalSoldQty + p.stockReturn) > 0);
                  
                  return txGroupedByProduct.map(p => {
                    const diff = p.stockOut - (p.totalSoldQty + p.stockReturn);
                    let badge = null;
                    
                    if (!hasAnySalesActivity && diff > 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black text-slate-400">-</span>;
                  } else if (diff === 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-600 rounded-lg">ត្រឹមត្រូវ</span>;
                  } else if (diff > 0) {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-rose-50 text-rose-600 rounded-lg">បាត់ ({diff})</span>;
                  } else {
                    badge = <span className="inline-block px-2.5 py-1 text-xs font-black bg-amber-50 text-amber-600 rounded-lg">លើស ({Math.abs(diff)})</span>;
                  }

                  return (
                    <tr 
                      key={p.productName} 
                      className="hover:bg-slate-50/70 transition-all border-b border-slate-100"
                    >
                      <td className="px-1.5 md:px-3 py-2 text-left font-bold text-slate-800">
                        {p.productName}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-rose-500">
                        {p.stockOut || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-emerald-600">
                        {p.stockSold || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-violet-500">
                        {p.stockExchanged || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-amber-500">
                        {p.stockPromo || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-indigo-600">
                        {p.stockReturn || '-'}
                      </td>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success update table");
} else {
  console.log("Target not found");
}
