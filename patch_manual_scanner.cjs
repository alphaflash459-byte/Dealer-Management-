const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Add states
const statesTarget = `  const [manualAddSearchText, setManualAddSearchText] = useState('');`;
const statesReplacement = `  const [manualAddSearchText, setManualAddSearchText] = useState('');
  const [manualAddScannerLoading, setManualAddScannerLoading] = useState(false);
  const manualAddFileInputRef = useRef<HTMLInputElement>(null);
  const [manualAddImage, setManualAddImage] = useState<string>('');
  const [manualAddFileName, setManualAddFileName] = useState<string>('');`;
code = code.replace(statesTarget, statesReplacement);

// 2. Add functions
const funcsTarget = `  const handleAIImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`;
const funcsReplacement = `  const handleManualAddImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setManualAddFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 800;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
          setManualAddImage(compressedBase64.split(',')[1]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualAddScan = async () => {
    if (!manualAddImage) {
      alert("សូមបញ្ចូលរូបភាពជាមុនសិន");
      return;
    }
    setManualAddScannerLoading(true);
    try {
      const response = await fetch('/api/extract-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           image: manualAddImage,
           targetType: aiScannerType,
          productNames: products.map(p => p.name)
        })
      });
      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error(\`ម៉ាស៊ីនបម្រើបានបញ្ជូនការឆ្លើយតបមិនត្រឹមត្រូវ (ស្ថានភាព៖ \${response.status})។\`);
      }
      if (!result.success) {
        throw new Error(result.error || "ការទាញយកទិន្នន័យបានបរាជ័យ");
      }
      
      let newItems = [...manualAddItems];
      result.data.forEach((item: any) => {
        const searchName = (item.productName || '').trim().toLowerCase();
        let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
        if (!matchedProduct) {
          const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
          matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
        }
        
        if (matchedProduct) {
           const existingIdx = newItems.findIndex(i => i.productName === matchedProduct.name);
           const soldQ = Number(item.soldQuantity) || 0;
           const exQ = Number(item.exchangedQuantity) || 0;
           const proQ = Number(item.promoQuantity) || 0;
           let qty = Number(item.quantity) || 0;
           if (aiScannerType === 'Stock Sold') {
             if (soldQ > 0 || exQ > 0) qty = soldQ + exQ;
             else if (Number(item.quantity) > 0) { qty = Number(item.quantity) - proQ; if (qty < 0) qty = 0; }
           }
           if (existingIdx !== -1) {
             newItems[existingIdx].soldQty = soldQ;
             newItems[existingIdx].exchangedQty = exQ;
             newItems[existingIdx].promoQty = proQ;
             newItems[existingIdx].quantity = qty;
           } else {
               newItems.push({
                 id: Date.now().toString() + Math.random().toString(),
                 productName: matchedProduct.name,
                 soldQty: soldQ,
                 exchangedQty: exQ,
                 promoQty: proQ,
                 quantity: qty,
                 matchedProductId: matchedProduct.id,
                 actualProduct: matchedProduct
               });
           }
        }
      });
      setManualAddItems([...newItems]);
    } catch (error: any) {
      alert("មានបញ្ហាក្នុងការស្កេន: " + error.message);
    } finally {
      setManualAddScannerLoading(false);
    }
  };

  const handleAIImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`;
code = code.replace(funcsTarget, funcsReplacement);

// 3. Add UI inside manualAddMode
const uiTarget = `            <div className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden flex-1">
              <div className="mb-4">
                <input`;

const uiReplacement = `            <div className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden flex-1">
              <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-bold text-slate-500 px-1">ស្កេនរូបភាព ឬវិក្កយបត្រ (AI)</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                    <div className="flex-1 flex items-center justify-between border border-slate-200 rounded-2xl p-1 bg-slate-50 min-w-0">
                      <button
                        type="button"
                        onClick={() => manualAddFileInputRef.current?.click()}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer border border-transparent whitespace-nowrap shrink-0"
                      >
                        ជ្រើសរើសរូបភាព
                      </button>
                      <span className="text-[11px] sm:text-xs text-slate-500 font-bold px-3 sm:px-4 truncate flex-1 text-right min-w-0">
                        {manualAddFileName || "មិនទាន់ជ្រើសរើសឯកសារឡើយ"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={manualAddFileInputRef}
                        onChange={handleManualAddImageUpload}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleManualAddScan}
                      disabled={manualAddScannerLoading || !manualAddImage}
                      className="bg-sky-400 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 sm:py-3 px-6 rounded-2xl transition shadow-md shadow-sky-400/20 whitespace-normal text-center animate-in fade-in flex items-center justify-center shrink-0 w-full sm:w-auto"
                    >
                      {manualAddScannerLoading ? 'កំពុងស្កេន...' : 'ស្កេនទាញយកទិន្នន័យ'}
                    </button>
                  </div>
              </div>

              <div className="mb-4">
                <input`;
code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('manual scanner patched');
