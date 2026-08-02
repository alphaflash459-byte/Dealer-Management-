const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `<button
                    type="button"
                    onClick={handleAIScan}
                    disabled={aiScannerLoading || !aiScannerImage}
                    className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-sky-500/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                  >
                    {aiScannerLoading ? 'កំពុងស្កេន...' : 'ស្កេនទាញយកទិន្នន័យ'}
                  </button>`;

const replacement = `<button
                    type="button"
                    onClick={handleAIScan}
                    disabled={aiScannerLoading || !aiScannerImage}
                    className="bg-sky-400 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-sky-400/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
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
                  </button>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target not found");
}
