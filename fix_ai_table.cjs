const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const searchTableSection = `              {aiScannerResults.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 px-1">លទ្ធផលដែលទាញយកបាន</label>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">`;

const replaceTableSection = `              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 px-1">ទិន្នន័យ (ស្កេន ឬបញ្ចូលដោយដៃ)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newResults = [...aiScannerResults];
                        products.forEach(p => {
                          if (!newResults.some(r => r.matchedProductId === p.id)) {
                            newResults.push({
                              id: Date.now().toString() + Math.random().toString(),
                              productName: p.name,
                              quantity: 0,
                              soldQty: 0,
                              exchangedQty: 0,
                              promoQty: 0,
                              matchedProductId: p.id,
                              actualProduct: p
                            });
                          }
                        });
                        setAiScannerResults(newResults);
                      }}
                      className="text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold px-2 sm:px-3 py-1.5 rounded-lg transition"
                    >
                      + បញ្ចូលរហ័សទាំងអស់
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiScannerResults([...aiScannerResults, {
                          id: Date.now().toString() + Math.random().toString(),
                          productName: products[0]?.name || '',
                          quantity: 0,
                          soldQty: 0,
                          exchangedQty: 0,
                          promoQty: 0,
                          matchedProductId: products[0]?.id,
                          actualProduct: products[0]
                        }]);
                      }}
                      className="text-[10px] sm:text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold px-2 sm:px-3 py-1.5 rounded-lg transition"
                    >
                      + បន្ថែមទំនិញ
                    </button>
                  </div>
                </div>
                {aiScannerResults.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[500px]">`;

content = content.replace(searchTableSection, replaceTableSection);

const searchTableEnd = `                    </table>
                  </div>
                </div>
              )}`;

const replaceTableEnd = `                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-400 text-sm">មិនទាន់មានទិន្នន័យ។ សូមស្កេន ឬបន្ថែមដោយដៃ។</p>
                  </div>
                )}
              </div>`;
content = content.replace(searchTableEnd, replaceTableEnd);

// Make sure to add a delete button in the row
const searchRowEnd = `                            </td>
                          </tr>
                        ))}
                      </tbody>`;

const replaceRowEnd = `                            </td>
                            <td className="p-2 w-10 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setAiScannerResults(aiScannerResults.filter((_, i) => i !== idx));
                                }}
                                className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                                title="លុប"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>`;

content = content.replace(searchRowEnd, replaceRowEnd);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed AI UI Table successfully');
