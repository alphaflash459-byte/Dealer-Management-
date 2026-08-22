const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /<p className="text-xs text-slate-500 font-bold px-2">ធីកទំនិញដែលអ្នកចង់បង្ហាញក្នុង Excel។ ចុចព្រួញឡើង\/ចុះដើម្បីរៀបលំដាប់។<\/p>\s*<div className="flex flex-col space-y-2">[\s\S]*?(?=<\/div>\s*<\/div>\s*<div className="p-6 bg-white border-t border-slate-100 flex items-center space-x-3 shrink-0">)/;

const newUI = `<p className="text-xs text-slate-500 font-bold px-2 mb-2">ចុច បន្ថែម ទំនិញដែលអ្នកចង់បង្ហាញក្នុង Excel។ ចុចព្រួញឡើង/ចុះដើម្បីរៀបលំដាប់។</p>
              
              <div className="flex flex-col space-y-4">
                {/* Selected Items Section */}
                {excelChoiceItems.some(i => i.selected) && (
                  <div className="flex flex-col space-y-2">
                    {excelChoiceItems.map((item, idx) => {
                      if (!item.selected) return null;
                      const lastSelectedIdx = excelChoiceItems.filter(i => i.selected).length - 1;
                      
                      return (
                        <div key={item.code} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex-1 flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-800">{item.khmerName}</span>
                            <button 
                              onClick={() => {
                                const copy = [...excelChoiceItems];
                                const removedItem = copy.splice(idx, 1)[0];
                                removedItem.selected = false;
                                copy.push(removedItem);
                                setExcelChoiceItems(copy);
                              }}
                              className="text-xs bg-rose-50 text-rose-500 font-bold px-2.5 py-1.5 rounded-lg hover:bg-rose-100 transition"
                            >
                              ដកចេញ
                            </button>
                          </div>
                          <div className="flex flex-col gap-1 border-l pl-3 border-slate-100">
                            <button 
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const copy = [...excelChoiceItems];
                                  [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                                  setExcelChoiceItems(copy);
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                if (idx < lastSelectedIdx) {
                                  const copy = [...excelChoiceItems];
                                  [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                                  setExcelChoiceItems(copy);
                                }
                              }}
                              disabled={idx === lastSelectedIdx}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Unselected Items Section */}
                {excelChoiceItems.some(i => !i.selected) && (
                  <div className="flex flex-col space-y-2 mt-4">
                    <h3 className="text-sm font-bold text-slate-700 pt-2 border-t border-slate-200">ទំនិញផ្សេងទៀត (Available)</h3>
                    {excelChoiceItems.map((item, idx) => {
                      if (item.selected) return null;
                      return (
                        <div key={item.code} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm opacity-70 hover:opacity-100 transition">
                          <span className="font-bold text-sm text-slate-600">{item.khmerName}</span>
                          <button 
                            onClick={() => {
                              const copy = [...excelChoiceItems];
                              const addedItem = copy.splice(idx, 1)[0];
                              addedItem.selected = true;
                              
                              let insertIdx = 0;
                              for (let i = 0; i < copy.length; i++) {
                                  if (copy[i].selected) {
                                     insertIdx = i + 1;
                                  }
                              }
                              copy.splice(insertIdx, 0, addedItem);
                              
                              setExcelChoiceItems(copy);
                            }}
                            className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                            បន្ថែម
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>`;

code = code.replace(regex, newUI);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
