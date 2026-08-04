const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `  const [editTxតម្លៃ, setកែប្រែTxតម្លៃ] = useState('');`;
const replace1 = `  const [editTxតម្លៃ, setកែប្រែTxតម្លៃ] = useState('');
  
  // Editable Report State
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editedReportData, setEditedReportData] = useState<Record<string, { stockOut: string, stockSold: string, stockExchanged: string, stockPromo: string, stockReturn: string }>>({});`;

code = code.replace(target1, replace1);

const target2 = `  // Filter and sort stock orders`;
const replace2 = `  const handleSaveReport = async () => {
    setLoading(true);
    try {
      for (const p of txGroupedByProduct) {
        const edited = editedReportData[p.productName];
        if (!edited) continue;
        
        const diffOut = (parseInt(edited.stockOut) || 0) - p.stockOut;
        const diffReturn = (parseInt(edited.stockReturn) || 0) - p.stockReturn;
        const diffSold = (parseInt(edited.stockSold) || 0) - p.stockSold;
        const diffExchanged = (parseInt(edited.stockExchanged) || 0) - p.stockExchanged;
        const diffPromo = (parseInt(edited.stockPromo) || 0) - p.stockPromo;
        
        const product = products.find(prod => prod.name === p.productName);
        if (!product) continue;

        if (diffOut !== 0) {
          const existingOut = filteredTransactions.find(t => t.type === 'Stock Out' && t.productName === p.productName);
          if (existingOut) {
            const newQty = existingOut.quantity + diffOut;
            if (newQty <= 0) {
               await deleteDoc(doc(db, 'transactions', existingOut.id));
            } else {
               await updateDoc(doc(db, 'transactions', existingOut.id), { quantity: newQty });
            }
          } else if (diffOut > 0) {
            const newTx = {
               id: \`tx-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`,
               userId: filterTxUserId === 'all' ? currentUser.id : filterTxUserId,
               type: 'Stock Out',
               productName: p.productName,
               quantity: diffOut,
               date: filterTxStartDate ? \`\${filterTxStartDate}T12:00:00.000Z\` : new Date().toISOString(),
               createdBy: currentUser.username
            };
            await setDoc(doc(db, 'transactions', newTx.id), newTx);
          }
          await updateDoc(doc(db, 'products', product.id), { warehouseStock: increment(-diffOut) });
        }

        if (diffReturn !== 0) {
          const existingReturn = filteredTransactions.find(t => t.type === 'Stock Return' && t.productName === p.productName);
          if (existingReturn) {
            const newQty = existingReturn.quantity + diffReturn;
            if (newQty <= 0) {
               await deleteDoc(doc(db, 'transactions', existingReturn.id));
            } else {
               await updateDoc(doc(db, 'transactions', existingReturn.id), { quantity: newQty });
            }
          } else if (diffReturn > 0) {
            const newTx = {
               id: \`tx-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`,
               userId: filterTxUserId === 'all' ? currentUser.id : filterTxUserId,
               type: 'Stock Return',
               productName: p.productName,
               quantity: diffReturn,
               date: filterTxStartDate ? \`\${filterTxStartDate}T12:00:00.000Z\` : new Date().toISOString(),
               createdBy: currentUser.username
            };
            await setDoc(doc(db, 'transactions', newTx.id), newTx);
          }
          await updateDoc(doc(db, 'products', product.id), { warehouseStock: increment(diffReturn) });
        }

        if (diffSold !== 0 || diffExchanged !== 0 || diffPromo !== 0) {
           const existingSold = filteredTransactions.find(t => t.type === 'Stock Sold' && t.productName === p.productName);
           if (existingSold) {
              const newSold = (existingSold.soldQty !== undefined ? existingSold.soldQty : Math.max(0, existingSold.quantity - (existingSold.promoQty || 0) - (existingSold.exchangedQty || 0))) + diffSold;
              const newEx = (existingSold.exchangedQty || 0) + diffExchanged;
              const newPro = (existingSold.promoQty || 0) + diffPromo;
              const newTot = newSold + newEx + newPro;

              if (newTot <= 0) {
                 await deleteDoc(doc(db, 'transactions', existingSold.id));
              } else {
                 await updateDoc(doc(db, 'transactions', existingSold.id), {
                   quantity: newTot,
                   soldQty: newSold > 0 ? newSold : deleteField(),
                   exchangedQty: newEx > 0 ? newEx : deleteField(),
                   promoQty: newPro > 0 ? newPro : deleteField()
                 });
              }
           } else if (diffSold > 0 || diffExchanged > 0 || diffPromo > 0) {
              const newTx = {
                 id: \`tx-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`,
                 userId: filterTxUserId === 'all' ? currentUser.id : filterTxUserId,
                 type: 'Stock Sold',
                 productName: p.productName,
                 quantity: diffSold + diffExchanged + diffPromo,
                 soldQty: diffSold > 0 ? diffSold : undefined,
                 exchangedQty: diffExchanged > 0 ? diffExchanged : undefined,
                 promoQty: diffPromo > 0 ? diffPromo : undefined,
                 date: filterTxStartDate ? \`\${filterTxStartDate}T12:00:00.000Z\` : new Date().toISOString(),
                 createdBy: currentUser.username,
                 price: product.price || 0
              };
              // remove undefined keys for firestore
              Object.keys(newTx).forEach(key => (newTx as any)[key] === undefined && delete (newTx as any)[key]);
              await setDoc(doc(db, 'transactions', newTx.id), newTx);
           }
        }
      }
      setIsEditingReport(false);
    } catch (e) {
      console.error(e);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort stock orders`;

code = code.replace(target2, replace2);

const target3 = `            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ប្រតិបត្តិការទាំងអស់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">របាយការណ៍ផ្ទៀងផ្ទាត់ និងតុល្យភាពស្តុកទំនិញ</p>
            </div>
            <div className="flex items-center space-x-2">`;
const replace3 = `            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800">ប្រតិបត្តិការទាំងអស់</h3>
              <p className="text-slate-500 text-[9px] sm:text-xs mt-0.5 font-medium">របាយការណ៍ផ្ទៀងផ្ទាត់ និងតុល្យភាពស្តុកទំនិញ</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isEditingReport ? (
                <button
                  onClick={() => {
                    const initialData: Record<string, any> = {};
                    txGroupedByProduct.forEach(p => {
                      initialData[p.productName] = {
                        stockOut: String(p.stockOut),
                        stockSold: String(p.stockSold),
                        stockExchanged: String(p.stockExchanged),
                        stockPromo: String(p.stockPromo),
                        stockReturn: String(p.stockReturn)
                      };
                    });
                    setEditedReportData(initialData);
                    setIsEditingReport(true);
                  }}
                  className="flex items-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>កែប្រែ</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditingReport(false)}
                    className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold active:scale-95 transition cursor-pointer"
                  >
                    <span>បោះបង់</span>
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleSaveReport}
                    className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                       <span>កំពុងរក្សាទុក...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>រក្សាទុក</span>
                      </>
                    )}
                  </button>
                </>
              )}`;

code = code.replace(target3, replace3);

const target4 = `                  return (
                    <tr 
                      key={p.productName} 
                      className="hover:bg-slate-50/70 transition-all border-b border-slate-100"
                    >
                      <td className="px-1.5 md:px-3 py-2 text-left font-bold text-slate-800">
                        {p.productName}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-rose-500">
                        {p.stockOut || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-emerald-600">
                        {p.stockSold || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-violet-500">
                        {p.stockExchanged || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-amber-500">
                        {p.stockPromo || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-indigo-600">
                        {p.stockReturn || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center">
                        {badge}
                      </td>
                    </tr>
                  )`;
const replace4 = `                  return (
                    <tr 
                      key={p.productName} 
                      className="hover:bg-slate-50/70 transition-all border-b border-slate-100"
                    >
                      <td className="px-1.5 md:px-3 py-2 text-left font-bold text-slate-800">
                        {p.productName}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-rose-500">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-rose-400"
                            value={editedReportData[p.productName]?.stockOut ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockOut: e.target.value } }))}
                          />
                        ) : (p.stockOut || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-emerald-600">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-emerald-400"
                            value={editedReportData[p.productName]?.stockSold ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockSold: e.target.value } }))}
                          />
                        ) : (p.stockSold || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-violet-500">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-violet-400"
                            value={editedReportData[p.productName]?.stockExchanged ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockExchanged: e.target.value } }))}
                          />
                        ) : (p.stockExchanged || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-amber-500">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-amber-400"
                            value={editedReportData[p.productName]?.stockPromo ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockPromo: e.target.value } }))}
                          />
                        ) : (p.stockPromo || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center font-black text-xs sm:text-sm md:text-base text-indigo-600">
                        {isEditingReport ? (
                          <input 
                            type="number" 
                            className="w-12 md:w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-indigo-400"
                            value={editedReportData[p.productName]?.stockReturn ?? ''}
                            onChange={(e) => setEditedReportData(prev => ({ ...prev, [p.productName]: { ...prev[p.productName], stockReturn: e.target.value } }))}
                          />
                        ) : (p.stockReturn || '-')}
                      </td>
                      <td className="px-1.5 md:px-3 py-2 text-center">
                        {badge}
                      </td>
                    </tr>
                  )`;

code = code.replace(target4, replace4);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('done');
