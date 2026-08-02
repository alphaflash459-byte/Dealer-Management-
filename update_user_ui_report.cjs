const fs = require('fs');
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const targetStr = `                      {(() => {
                        const activeProducts = products.map(product => {
                          const loaded = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Out').reduce((sum, t) => sum + t.quantity, 0);
                          const soldOnly = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold').reduce((sum, t) => sum + t.quantity, 0);
                          const promosGiven = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold').reduce((sum, t) => sum + (t.promoQty || 0), 0);
                          const soldTotal = soldOnly + promosGiven;
                          const returned = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Return').reduce((sum, t) => sum + t.quantity, 0);
                          return { product, loaded, soldOnly, promosGiven, soldTotal, returned };
                        }).filter(item => item.loaded > 0 || item.soldTotal > 0 || item.returned > 0);

                        if (activeProducts.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="text-center py-16 text-slate-400 text-xs md:text-sm font-bold">
                                គ្មានទិន្នន័យទំនិញសម្រាប់បង្ហាញឡើយ
                              </td>
                            </tr>
                          );
                        }

                        return (() => {
                          const hasAnySalesActivity = activeProducts.some(p => p.soldTotal > 0 || p.returned > 0);
                          
                          return activeProducts.map(({ product, loaded, soldOnly, promosGiven, soldTotal, returned }) => {
                            const balance = loaded - soldTotal - returned;

                            let badgeColorClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                            let statusText = "ត្រឹមត្រូវ";

                            if (!hasAnySalesActivity && balance > 0) {
                              badgeColorClass = "bg-transparent text-slate-400 font-black";
                              statusText = "-";
                            } else if (balance < 0) {
                              badgeColorClass = "bg-amber-50 text-amber-700 border border-amber-100";
                              statusText = \`លើស (\${Math.abs(balance)})\`;
                            } else if (balance > 0) {
                              badgeColorClass = "bg-rose-50 text-rose-700 border border-rose-100";
                              statusText = \`បាត់ (\${balance})\`;
                            }

                            return (
                              <tr 
                                key={product.id} 
                                className="hover:bg-slate-50/70 transition-colors group cursor-default border-b border-slate-50/50"
                              >
                                <td className="px-1.5 md:px-3 py-2.5 text-left font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                                  {product.name}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-rose-600">
                                  {loaded || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-emerald-600">
                                  {soldOnly || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-amber-600">
                                  {promosGiven || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-sky-600">
                                  {returned || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center">
                                  <span className={\`inline-block px-2.5 py-0.5 rounded-lg text-[10px] md:text-xs font-black shadow-sm \${badgeColorClass}\`}>
                                    {statusText}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })();
                      })()}`;

const replacementStr = `                      {(() => {
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
                            let statusText = "ត្រឹមត្រូវ";

                            if (!hasAnySalesActivity && balance > 0) {
                              badgeColorClass = "bg-transparent text-slate-400 font-black";
                              statusText = "-";
                            } else if (balance < 0) {
                              badgeColorClass = "bg-amber-50 text-amber-700 border border-amber-100";
                              statusText = \`លើស (\${Math.abs(balance)})\`;
                            } else if (balance > 0) {
                              badgeColorClass = "bg-rose-50 text-rose-700 border border-rose-100";
                              statusText = \`បាត់ (\${balance})\`;
                            }

                            return (
                              <tr 
                                key={product.id} 
                                className="hover:bg-slate-50/70 transition-colors group cursor-default border-b border-slate-50/50"
                              >
                                <td className="px-1.5 md:px-3 py-2.5 text-left font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                                  {product.name}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-rose-600">
                                  {loaded || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-emerald-600">
                                  {soldOnly || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-violet-500">
                                  {exchangedGiven || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-amber-600">
                                  {promosGiven || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center font-bold text-sky-600">
                                  {returned || '-'}
                                </td>
                                <td className="px-1.5 md:px-3 py-2.5 text-center">
                                  <span className={\`inline-block px-2.5 py-0.5 rounded-lg text-[10px] md:text-xs font-black shadow-sm \${badgeColorClass}\`}>
                                    {statusText}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })();
                      })()}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/UserDashboard.tsx', content);
  console.log("Success update user ui report table");
} else {
  console.log("Target not found user ui report table");
}
