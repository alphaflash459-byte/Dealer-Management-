const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const searchRegex = /<div className="flex flex-col sm:flex-row gap-3">[\s\S]*?<button[\s\S]*?onClick=\{handleAIScan\}[\s\S]*?<\/button>\n\s*<\/div>/;

const replaceRegex = `<div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center bg-sky-50/50 rounded-2xl border border-sky-100 p-2 overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-sky-600 shadow-sm border border-sky-100">
                      ជ្រើសរើសរូបភាព
                    </div>
                    <div className="flex-1 px-4 text-xs font-medium text-slate-400 truncate text-right sm:text-left">
                      {aiScannerFileName || 'មិនទាន់ជ្រើសរើសឯកសារឡើយ'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleAIImageUpload}
                      className="hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAIScan}
                    disabled={aiScannerLoading || !aiScannerImage}
                    className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-sky-500/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                  >
                    {aiScannerLoading ? 'កំពុងស្កេន...' : 'ស្កេនទាញយកទិន្នន័យ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const items = products.map(p => ({
                        id: Date.now().toString() + Math.random().toString(),
                        productName: p.name,
                        quantity: 0,
                        soldQty: 0,
                        exchangedQty: 0,
                        promoQty: 0,
                        matchedProductId: p.id,
                        actualProduct: p
                      }));
                      setManualAddItems(items);
                      setManualAddMode('all');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-emerald-500/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                  >
                    + បញ្ចូលរហ័សទាំងអស់
                  </button>
                </div>`;

content = content.replace(searchRegex, replaceRegex);

const searchRemove = `<div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const items = products.map(p => ({
                          id: Date.now().toString() + Math.random().toString(),
                          productName: p.name,
                          quantity: 0,
                          soldQty: 0,
                          exchangedQty: 0,
                          promoQty: 0,
                          matchedProductId: p.id,
                          actualProduct: p
                        }));
                        setManualAddItems(items);
                        setManualAddMode('all');
                      }}
                      className="text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold px-2 sm:px-3 py-1.5 rounded-lg transition"
                    >
                      + បញ្ចូលរហ័សទាំងអស់
                    </button>
                  </div>`;
content = content.replace(searchRemove, '');
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
