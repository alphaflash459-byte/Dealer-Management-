const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// I need to find the specific area that is causing the JSX unmatched tags.
// Let's replace the whole modal part to ensure it's 100% correct.

const startMarker = "{/* Pallet Map Modal */}";
const endMarker = "{/* Pallet Configuration Modal */}";

const oldModal = content.substring(content.indexOf(startMarker), content.indexOf(endMarker));

const correctModal = `{/* Pallet Map Modal */}
      {isPalletMapModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[110] p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-100 w-full max-w-5xl h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 pb-4 bg-white border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-lg">🗺️</span>
                  <span>ទីតាំង និងការរៀបចំបាឡែត (Smart Pallet Map)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">ប្រព័ន្ធរៀបចំដោយស្វ័យប្រវត្តិទៅតាមចំនួនទំនិញ និងទំហំឃ្លាំង</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPalletMapPDF}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl font-bold text-sm flex items-center gap-2 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>PDF Export</span>
                </button>
                <button
                  onClick={() => {
                    setIsPalletMapModalOpen(false);
                    setIsPalletConfigModalOpen(true);
                  }}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsPalletMapModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 flex flex-col items-center">
              <div ref={palletMapPdfRef} className="w-full flex flex-col items-center pb-8 pt-4 bg-slate-100">
              {(() => {
                const config = palletConfig || { layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 }, capacities: {} };
                
                // Fallbacks if distinct values are not set
                const actualLeftDepth = config.layout.leftDepth > 0 ? config.layout.leftDepth : config.layout.depth;
                const actualRightDepth = config.layout.rightDepth > 0 ? config.layout.rightDepth : config.layout.depth;
                const actualLeftHeight = config.layout.leftMaxHeight > 0 ? config.layout.leftMaxHeight : config.layout.maxHeight;
                const actualRightHeight = config.layout.rightMaxHeight > 0 ? config.layout.rightMaxHeight : config.layout.maxHeight;
                
                const leftRows = config.layout.leftRows;
                const rightRows = config.layout.rightRows;
                
                if (leftRows === 0 && rightRows === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                      <span className="text-6xl">📏</span>
                      <p className="font-bold">សូមកំណត់ទំហំឃ្លាំង (បាឡែត) ជាមុនសិន</p>
                    </div>
                  );
                }

                // Calculate required pallets for each product
                let palletsNeeded: { product: string, count: number, color: string }[] = [];
                const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-indigo-500', 'bg-teal-500'];
                
                let unassignedList: { product: string, reason: string }[] = [];

                products.forEach((p, idx) => {
                  // Use warehouseStock (live system stock) to accurately reflect current warehouse state
                  const stock = p.warehouseStock !== undefined ? p.warehouseStock : (p.actualStock || 0);
                  if (stock > 0) {
                    const capacity = config.capacities?.[p.name] || 0;
                    if (capacity > 0) {
                      palletsNeeded.push({
                        product: p.name,
                        count: Math.ceil(stock / capacity),
                        color: colors[idx % colors.length]
                      });
                    } else {
                      unassignedList.push({ product: p.name, reason: "មិនទាន់កំណត់ចំណុះ/បាឡែត" });
                    }
                  }
                });

                // Algorithm Logic to sort by "Stock Out" (most frequency = higher)
                palletsNeeded.sort((a, b) => {
                  const prodA = products.find(p => p.name === a.product);
                  const prodB = products.find(p => p.name === b.product);
                  const soA = prodA?.stats?.stockOut || 0;
                  const soB = prodB?.stats?.stockOut || 0;
                  return soB - soA;
                });

                const leftMatrix = Array(leftRows).fill(null).map(() => Array(actualLeftDepth).fill(null).map(() => [] as any[]));
                const rightMatrix = Array(rightRows).fill(null).map(() => Array(actualRightDepth).fill(null).map(() => [] as any[]));

                let availableRows: {side: string, r: number}[] = [];
                for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});
                for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});

                let unplacedPallets = 0;
                
                // Map to track remaining pallets for each product
                let productsList = palletsNeeded.map(p => ({ ...p, remaining: p.count }));
                
                // Pre-sort productsList by total count descending (more pallets placed first -> closer to Wall)
                productsList.sort((a, b) => b.count - a.count);

                for (let row of availableRows) {
                  const isLeft = row.side === 'left';
                  const actualDepth = isLeft ? actualLeftDepth : actualRightDepth;
                  const actualHeight = isLeft ? actualLeftHeight : actualRightHeight;
                  const targetMatrix = isLeft ? leftMatrix : rightMatrix;
                  
                  let stacksForRow: {product: string, color: string, pallets: number, isFull: boolean}[] = [];
                  
                  // Pass 1: Try to get FULL stacks from products (largest total count first)
                  for (let p of productsList) {
                    while (p.remaining >= actualHeight && stacksForRow.length < actualDepth) {
                      stacksForRow.push({ product: p.product, color: p.color, pallets: actualHeight, isFull: true });
                      p.remaining -= actualHeight;
                    }
                  }
                  
                  // Pass 2: If row is not full, try to get PARTIAL stacks from products
                  if (stacksForRow.length < actualDepth) {
                    for (let p of productsList) {
                      if (p.remaining > 0 && p.remaining < actualHeight && stacksForRow.length < actualDepth) {
                        stacksForRow.push({ product: p.product, color: p.color, pallets: p.remaining, isFull: false });
                        p.remaining = 0;
                      }
                    }
                  }
                  
                  if (stacksForRow.length === 0) continue;
                  
                  // Now place them in the matrix so they are pushed to the Aisle, and Empty slots are at the Wall.
                  if (isLeft) {
                    // Left side: Wall is 0, Aisle is actualDepth - 1
                    let emptySlots = actualDepth - stacksForRow.length;
                    for (let i = 0; i < stacksForRow.length; i++) {
                      let d = emptySlots + i;
                      let s = stacksForRow[i];
                      for(let k=0; k < s.pallets; k++) {
                        targetMatrix[row.r][d].push({ product: s.product, color: s.color });
                      }
                    }
                  } else {
                    // Right side: Wall is actualDepth - 1, Aisle is 0
                    for (let i = 0; i < stacksForRow.length; i++) {
                      let d = stacksForRow.length - 1 - i;
                      let s = stacksForRow[i];
                      for(let k=0; k < s.pallets; k++) {
                        targetMatrix[row.r][d].push({ product: s.product, color: s.color });
                      }
                    }
                  }
                }
                
                for (let p of productsList) {
                  unplacedPallets += p.remaining;
                }

                return (
                  <div className="w-full max-w-4xl space-y-8 pb-10">
                    
                    {/* Metrics Header */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold mb-1">សមត្ថភាពស្តុកសរុប</div>
                        <div className="text-2xl font-black text-slate-800">
                          {(leftRows * actualLeftDepth * actualLeftHeight) + (rightRows * actualRightDepth * actualRightHeight)} <span className="text-sm font-medium text-slate-500">បាឡែត</span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold mb-1">ទំនិញត្រូវការស្តុកសរុប</div>
                        <div className="text-2xl font-black text-indigo-600">
                          {palletsNeeded.reduce((sum, p) => sum + p.count, 0)} <span className="text-sm font-medium text-indigo-400">បាឡែត</span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold mb-1">កំពុងប្រើប្រាស់</div>
                        <div className="text-2xl font-black text-emerald-600">
                          {palletsNeeded.reduce((sum, p) => sum + p.count, 0) - unplacedPallets} <span className="text-sm font-medium text-emerald-400">បាឡែត</span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold mb-1">មិនអាចដាក់ចូល (ពេញ)</div>
                        <div className="text-2xl font-black text-rose-600">
                          {unplacedPallets} <span className="text-sm font-medium text-rose-400">បាឡែត</span>
                        </div>
                      </div>
                    </div>

                    {unassignedList.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                          <span>⚠️</span> ទំនិញមិនអាចគណនាបាន (សូមចូលទៅកំណត់ក្នុង ⚙️)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {unassignedList.map((u, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-amber-700 border border-amber-200">
                              {u.product}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visual Map */}
                    <div className="flex flex-col gap-12 pt-4">
                      
                      {/* Left Side */}
                      <div className="w-full">
                        <h4 className="text-center font-black text-slate-400 tracking-wider mb-6 text-sm">ជួរខាងឆ្វេង (LEFT)</h4>
                        <div className="flex flex-col gap-3">
                          {leftMatrix.map((row, rIdx) => (
                            <div key={'L'+rIdx} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-400 font-black flex items-center justify-center rounded-xl border border-slate-200">
                                ជួរ {rIdx + 1}
                              </div>
                              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: \`repeat(\${actualLeftDepth}, minmax(0, 1fr))\` }}>
                                {row.map((stack, dIdx) => (
                                  <div key={dIdx} className="flex flex-col gap-1 h-[80px] bg-slate-50 rounded-xl p-1 border border-slate-100 justify-end relative">
                                    {stack.length > 0 ? (
                                      <>
                                        <div className="absolute top-1 right-1 bg-white/90 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 border border-slate-200">
                                          {stack.length}/{actualLeftHeight}
                                        </div>
                                        {stack.map((item: any, i: number) => (
                                          <div key={i} className={\`w-full flex-1 rounded-lg \${item.color} shadow-sm flex items-center justify-center overflow-hidden\`}>
                                            <span className="text-[10px] font-bold text-white truncate px-1 drop-shadow-md">
                                              {item.product}
                                            </span>
                                          </div>
                                        ))}
                                      </>
                                    ) : (
                                      <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
                                        <span className="text-slate-300 text-xs">ទំនេរ</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Center Aisle */}
                      <div className="w-full h-24 bg-slate-200 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-black tracking-[0.2em]">
                        ផ្លូវដើរកណ្តាល (CENTER AISLE)
                      </div>

                      {/* Right Side */}
                      <div className="w-full">
                        <h4 className="text-center font-black text-slate-400 tracking-wider mb-6 text-sm">ជួរខាងស្តាំ (RIGHT)</h4>
                        <div className="flex flex-col gap-3">
                          {rightMatrix.map((row, rIdx) => (
                            <div key={'R'+rIdx} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="w-12 h-12 shrink-0 bg-slate-100 text-slate-400 font-black flex items-center justify-center rounded-xl border border-slate-200">
                                ជួរ {leftRows + rIdx + 1}
                              </div>
                              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: \`repeat(\${actualRightDepth}, minmax(0, 1fr))\` }}>
                                {row.map((stack, dIdx) => (
                                  <div key={dIdx} className="flex flex-col gap-1 h-[80px] bg-slate-50 rounded-xl p-1 border border-slate-100 justify-end relative">
                                    {stack.length > 0 ? (
                                      <>
                                        <div className="absolute top-1 right-1 bg-white/90 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 border border-slate-200">
                                          {stack.length}/{actualRightHeight}
                                        </div>
                                        {stack.map((item: any, i: number) => (
                                          <div key={i} className={\`w-full flex-1 rounded-lg \${item.color} shadow-sm flex items-center justify-center overflow-hidden\`}>
                                            <span className="text-[10px] font-bold text-white truncate px-1 drop-shadow-md">
                                              {item.product}
                                            </span>
                                          </div>
                                        ))}
                                      </>
                                    ) : (
                                      <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
                                        <span className="text-slate-300 text-xs">ទំនេរ</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Pallet Configuration Modal */}`;

content = content.replace(oldModal, correctModal);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
