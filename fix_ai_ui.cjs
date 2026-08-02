const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Update aiScannerResults state type
const stateSearch = `const [aiScannerResults, setAiScannerResults] = useState<{ id: string, productName: string, quantity: number, unit?: string, description?: string, matchedProductId?: string, actualProduct?: Product }[]>([]);`;
const stateReplace = `const [aiScannerResults, setAiScannerResults] = useState<{ id: string, productName: string, quantity: number, soldQty?: number, exchangedQty?: number, promoQty?: number, unit?: string, description?: string, matchedProductId?: string, actualProduct?: Product }[]>([]);`;
content = content.replace(stateSearch, stateReplace);

// 2. Update handleAIScan parsedItems
const parseSearch = `        return {
          id: Date.now().toString() + Math.random().toString(),
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: item.quantity || 0,
          unit: item.unit || '',
          description: item.description || '',
          matchedProductId: matchedProduct?.id,
          actualProduct: matchedProduct
        };`;
const parseReplace = `        return {
          id: Date.now().toString() + Math.random().toString(),
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: item.quantity || 0,
          soldQty: item.soldQuantity,
          exchangedQty: item.exchangedQuantity,
          promoQty: item.promoQuantity,
          unit: item.unit || '',
          description: item.description || '',
          matchedProductId: matchedProduct?.id,
          actualProduct: matchedProduct
        };`;
content = content.replace(parseSearch, parseReplace);

// 3. Update handleAIScan reduce
const reduceSearch = `      const aggregatedItems = parsedItems.reduce((acc: any[], current: any) => {
        const existing = acc.find(item => item.productName === current.productName);
        if (existing) {
          existing.quantity = (Number(existing.quantity) || 0) + (Number(current.quantity) || 0);
          if (current.description) {
            existing.description = existing.description ? existing.description + ", " + current.description : current.description;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, []);`;
const reduceReplace = `      const aggregatedItems = parsedItems.reduce((acc: any[], current: any) => {
        const existing = acc.find(item => item.productName === current.productName);
        if (existing) {
          existing.quantity = (Number(existing.quantity) || 0) + (Number(current.quantity) || 0);
          if (current.soldQty !== undefined || existing.soldQty !== undefined) {
             existing.soldQty = (Number(existing.soldQty) || 0) + (Number(current.soldQty) || 0);
          }
          if (current.exchangedQty !== undefined || existing.exchangedQty !== undefined) {
             existing.exchangedQty = (Number(existing.exchangedQty) || 0) + (Number(current.exchangedQty) || 0);
          }
          if (current.promoQty !== undefined || existing.promoQty !== undefined) {
             existing.promoQty = (Number(existing.promoQty) || 0) + (Number(current.promoQty) || 0);
          }
          if (current.description) {
            existing.description = existing.description ? existing.description + ", " + current.description : current.description;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, []);`;
content = content.replace(reduceSearch, reduceReplace);


// 4. Update table headers
const tableHeaderSearch = `                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs text-left">
                          <th className="p-3">ឈ្មោះទំនិញ / ផលិតផល</th>
                          <th className="p-3 w-24">បរិមាណ</th>
                        </tr>
                      </thead>`;
const tableHeaderReplace = `                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs text-left">
                          <th className="p-3">ឈ្មោះទំនិញ / ផលិតផល</th>
                          {aiScannerType === 'Stock Sold' ? (
                            <>
                              <th className="p-3 w-16 text-center">លក់</th>
                              <th className="p-3 w-16 text-center">ក្រវិល</th>
                              <th className="p-3 w-16 text-center">ថែម</th>
                              <th className="p-3 w-16 text-center font-bold text-sky-600">សរុប</th>
                            </>
                          ) : (
                            <th className="p-3 w-24">បរិមាណ</th>
                          )}
                        </tr>
                      </thead>`;
content = content.replace(tableHeaderSearch, tableHeaderReplace);

// 5. Update table rows
const tdSearch = `                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => {
                                  const newResults = [...aiScannerResults];
                                  newResults[idx].quantity = Number(e.target.value);
                                  setAiScannerResults(newResults);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-sky-400 outline-none text-center"
                                placeholder="0"
                              />
                            </td>`;

const tdReplace = `                            {aiScannerType === 'Stock Sold' ? (
                              <>
                                <td className="p-2">
                                  <input type="number" min="0" value={item.soldQty || ''} onChange={(e) => {
                                    const newResults = [...aiScannerResults];
                                    newResults[idx].soldQty = Number(e.target.value);
                                    newResults[idx].quantity = (newResults[idx].soldQty || 0) + (newResults[idx].exchangedQty || 0) + (newResults[idx].promoQty || 0);
                                    setAiScannerResults(newResults);
                                  }} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs focus:border-sky-400 outline-none text-center" placeholder="0" />
                                </td>
                                <td className="p-2">
                                  <input type="number" min="0" value={item.exchangedQty || ''} onChange={(e) => {
                                    const newResults = [...aiScannerResults];
                                    newResults[idx].exchangedQty = Number(e.target.value);
                                    newResults[idx].quantity = (newResults[idx].soldQty || 0) + (newResults[idx].exchangedQty || 0) + (newResults[idx].promoQty || 0);
                                    setAiScannerResults(newResults);
                                  }} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs focus:border-sky-400 outline-none text-center" placeholder="0" />
                                </td>
                                <td className="p-2">
                                  <input type="number" min="0" value={item.promoQty || ''} onChange={(e) => {
                                    const newResults = [...aiScannerResults];
                                    newResults[idx].promoQty = Number(e.target.value);
                                    newResults[idx].quantity = (newResults[idx].soldQty || 0) + (newResults[idx].exchangedQty || 0) + (newResults[idx].promoQty || 0);
                                    setAiScannerResults(newResults);
                                  }} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs focus:border-sky-400 outline-none text-center" placeholder="0" />
                                </td>
                                <td className="p-2 text-center font-bold text-sky-600 bg-sky-50 rounded-lg">
                                  {item.quantity}
                                </td>
                              </>
                            ) : (
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  onChange={(e) => {
                                    const newResults = [...aiScannerResults];
                                    newResults[idx].quantity = Number(e.target.value);
                                    setAiScannerResults(newResults);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-sky-400 outline-none text-center"
                                  placeholder="0"
                                />
                              </td>
                            )}`;
content = content.replace(tdSearch, tdReplace);

// 6. Update handleAISave promoQty
const saveSearch = `        const newTransaction: Transaction = {
          id: Date.now().toString() + Math.random().toString(),
          userId: aiScannerUserId,
          type: aiScannerType,
          productName: item.productName,
          quantity: item.quantity,
          date: isoDate,
          note: item.description ? "AI Scan: " + item.description : "AI Scan"
        };`;
const saveReplace = `        const newTransaction: Transaction = {
          id: Date.now().toString() + Math.random().toString(),
          userId: aiScannerUserId,
          type: aiScannerType,
          productName: item.productName,
          quantity: item.quantity,
          promoQty: item.promoQty || 0,
          date: isoDate,
          note: item.description ? "AI Scan: " + item.description : "AI Scan"
        };`;
content = content.replace(saveSearch, saveReplace);


fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed UI successfully');
