const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add states and refs
const stateSearch = `  const [stockInItems, setStockInItems] = useState<StockItemInput[]>([]);`;
const stateReplace = `  const [stockInItems, setStockInItems] = useState<StockItemInput[]>([]);
  const [stockInScannerLoading, setStockInScannerLoading] = useState(false);
  const stockInFileInputRef = useRef<HTMLInputElement>(null);`;
content = content.replace(stateSearch, stateReplace);

// 2. Add handler function before handleរក្សាទុកStockIn
const handlerSearch = `  const handleរក្សាទុកStockIn = async (e: React.FormEvent) => {`;
const handlerCode = `
  const handleStockInAIScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      setStockInScannerLoading(true);
      try {
        const response = await fetch('/api/extract-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64Image, 
            targetType: 'Stock In',
            productNames: products.map(p => p.name)
          })
        });
        
        let result;
        try {
          result = await response.json();
        } catch (e) {
          throw new Error('ម៉ាស៊ីនបម្រើបានបញ្ជូនការឆ្លើយតបមិនត្រឹមត្រូវ។');
        }
        
        if (!result.success) {
          throw new Error(result.error || "ការទាញយកទិន្នន័យបានបរាជ័យ");
        }
        
        const parsedItems = result.data.map((item: any) => {
          const searchName = (item.productName || '').trim().toLowerCase();
          let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
          if (!matchedProduct) {
            const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
            matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
          }
          return {
            productName: matchedProduct ? matchedProduct.name : item.productName || '',
            quantity: item.quantity ? item.quantity.toString() : ''
          };
        }).filter((item: any) => item.productName);
        
        setStockInItems(prev => [...prev, ...parsedItems]);
      } catch (error: any) {
        alert("មានបញ្ហាក្នុងការស្កេន: " + error.message);
      } finally {
        setStockInScannerLoading(false);
        if (stockInFileInputRef.current) stockInFileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleរក្សាទុកStockIn = async (e: React.FormEvent) => {`;
content = content.replace(handlerSearch, handlerCode);

// 3. Add button in the UI
const uiSearch = `                      <button
                        type="button"
                        onClick={() => {
                          const existingNames = new Set(stockInItems.map(i => i.productName));
                          const newItems = products
                            .filter(p => !existingNames.has(p.name))
                            .map(p => ({ productName: p.name, quantity: '' }));
                          setQuickAddItems(newItems);
                          setIsQuickAddModalOpen(true);
                        }}
                        className="text-[10px] sm:text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition active:scale-95"
                      >
                        + បញ្ចូលទំនិញទាំងអស់រហ័ស
                      </button>`;
const uiReplace = `                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => stockInFileInputRef.current?.click()}
                          disabled={stockInScannerLoading}
                          className="flex items-center space-x-1 text-[10px] sm:text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition active:scale-95 disabled:opacity-50"
                        >
                          {stockInScannerLoading ? (
                            <span>កំពុងស្កេន...</span>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 4a2 2 0 012-2h4a1 1 0 010 2H5v12h10V4h-1a1 1 0 110-2h1a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm3 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                              <span>អេអាយស្កេន ឆ្លាតវៃ</span>
                            </>
                          )}
                        </button>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          ref={stockInFileInputRef} 
                          onChange={handleStockInAIScan} 
                          className="hidden" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const existingNames = new Set(stockInItems.map(i => i.productName));
                            const newItems = products
                              .filter(p => !existingNames.has(p.name))
                              .map(p => ({ productName: p.name, quantity: '' }));
                            setQuickAddItems(newItems);
                            setIsQuickAddModalOpen(true);
                          }}
                          className="text-[10px] sm:text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition active:scale-95"
                        >
                          + បញ្ចូលទំនិញទាំងអស់រហ័ស
                        </button>
                      </div>`;
content = content.replace(uiSearch, uiReplace);

fs.writeFileSync(path, content);
console.log("Patched AdminDashboard.tsx successfully!");
