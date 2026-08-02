const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `                    <button
                      type="button"
                      onClick={() => {
                        const existingNames = new Set(stockInItems.map(i => i.productName));
                        const newItems = products
                          .filter(p => !existingNames.has(p.name))
                          .map(p => ({ productName: p.name, quantity: '' }));
                        setStockInItems([...stockInItems, ...newItems]);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-emerald-500/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                    >
                      + បញ្ចូលរហ័សទាំងអស់
                    </button>`;

const replacement = `                    <button
                      type="button"
                      onClick={() => {
                        const existingNames = new Set(stockInItems.map(i => i.productName));
                        const newItems = products
                          .filter(p => !existingNames.has(p.name))
                          .map(p => ({ productName: p.name, quantity: '' }));
                        setQuickAddItems(newItems);
                        setIsQuickAddModalOpen(true);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-emerald-500/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                    >
                      + បញ្ចូលរហ័សទាំងអស់
                    </button>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success Quick Add");
} else {
  console.log("Target not found for Quick Add");
}
