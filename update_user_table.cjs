const fs = require('fs');
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const startStr = `<tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100 text-center">
                        <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>`;
const endStr = `                      })()}
                    </tbody>`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr) + endStr.length;

if (startIdx !== -1 && endIdx !== -1) {
  const replacementStr = `<tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs uppercase font-bold tracking-wider border-b border-slate-100 text-center">
                        <th className="px-1.5 md:px-3 py-2.5 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-rose-600 whitespace-nowrap">ឡើងឡាន</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-emerald-600 whitespace-nowrap">លក់ចេញ</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-violet-500 whitespace-nowrap">ប្ដូរប្រវិល</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-teal-600 whitespace-nowrap">ថែម</th>
                        <th className="px-1.5 md:px-3 py-2.5 font-bold text-amber-600 whitespace-nowrap">ត្រឡប់</th>
                        <th className="px-1.5 md:px-3 py-2.5 text-right font-bold text-indigo-600 whitespace-nowrap">បញ្ជាក់</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[10px] sm:text-xs md:text-sm">
                      {(() => {
                        const activeProducts = products.map(product => {
                          const loaded = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Out').reduce((sum, t) => sum + t.quantity, 0);
                          const stockSoldTxs = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold');
                          const soldTotal = stockSoldTxs.reduce((sum, t) => sum + t.quantity, 0);
                          const promosGiven = stockSoldTxs.reduce((sum, t) => sum + (t.promoQty || 0), 0);
                          const exchangedGiven = stockSoldTxs.reduce((sum, t) => sum + ((t as any).exchangedQty || 0), 0);
                          const soldOnly = stockSoldTxs.reduce((sum, t) => {
                            if ((t as any).soldQty !== undefined) return sum + (t as any).soldQty;
                            return sum + Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
                          }, 0);
                          const returned = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Return').reduce((sum, t) => sum + t.quantity, 0);
                          return { product, loaded, soldOnly, exchangedGiven, promosGiven, soldTotal, returned };
                        }).filter(item => item.loaded > 0 || item.soldTotal > 0 || item.returned > 0);
                        if (activeProducts.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="text-center py-16 text-slate-400 text-xs md:text-sm font-bold">
                                គ្មានទិន្នន័យទំនិញសម្រាប់បង្ហាញឡើយ
                              </td>
                            </tr>
                          );
                        }
                        return (() => {
                          const hasAnySalesActivity = activeProducts.some(p => p.soldTotal > 0 || p.returned > 0);
                          
                          return activeProducts.map(({ product, loaded, soldOnly, exchangedGiven, promosGiven, soldTotal, returned }) => {
                            const balance = loaded - soldTotal - returned;
                            let badgeColorClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                            let statusText = \`ត្រូវ \${balance}\`;
                            
                            if (!hasAnySalesActivity && balance > 0) {
                            badgeColorClass = "text-slate-400";
                            statusText = \`-\`;
                          } else if (balance < 0) {
                            badgeColorClass = "bg-amber-50 text-amber-700 border border-amber-100";
                            statusText = \`លើស \${Math.abs(balance)}\`;
                          } else if (balance > 0) {
                            badgeColorClass = "bg-rose-50 text-rose-700 border border-rose-100";
                            statusText = \`បាត់ \${balance}\`;
                          }
                          return (
                            <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-1.5 md:px-3 py-2 font-black text-slate-800 text-left">{product.name}</td>
                              <td className="px-1.5 md:px-3 py-2 text-center font-bold text-rose-600 text-xs sm:text-sm">{loaded}</td>
                              <td className="px-1.5 md:px-3 py-2 text-center font-bold text-emerald-600 text-xs sm:text-sm">
                                {soldOnly}
                              </td>
                              <td className="px-1.5 md:px-3 py-2 text-center font-bold text-violet-500 text-xs sm:text-sm">
                                {exchangedGiven}
                              </td>
                              <td className="px-1.5 md:px-3 py-2 text-center font-bold text-teal-600 text-xs sm:text-sm">
                                {promosGiven}
                              </td>
                              <td className="px-1.5 md:px-3 py-2 text-center font-bold text-amber-600 text-xs sm:text-sm">{returned}</td>
                              <td className="px-1.5 md:px-3 py-2 text-right">
                                <span className={\`\${badgeColorClass} px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl font-black text-[9px] sm:text-xs md:text-sm whitespace-nowrap\`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                        })();
                      })()}
                    </tbody>`;

  content = content.substring(0, startIdx) + replacementStr + content.substring(endIdx);
  fs.writeFileSync('src/components/UserDashboard.tsx', content);
  console.log("Success update user dashboard table via indexing");
} else {
  console.log("Could not find start or end index");
}
