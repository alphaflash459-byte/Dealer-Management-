const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const mapModalCode = `
      {/* Pallet Map Modal */}
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
              <button
                onClick={() => setIsPalletMapModalOpen(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 flex flex-col items-center">
              {(() => {
                const config = palletConfig || { layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0 }, capacities: {} };
                const { leftRows = 0, rightRows = 0, depth = 0, maxHeight = 0 } = config.layout || {};
                
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
                  const stock = p.actualStock || 0;
                  if (stock > 0) {
                    const capacity = config.capacities?.[p.name] || 0;
                    if (capacity > 0) {
                      palletsNeeded.push({
                        product: p.name,
                        count: Math.ceil(stock / capacity),
                        color: colors[idx % colors.length]
                      });
                    } else {
                      unassignedList.push({ product: p.name, reason: 'មិនទាន់កំណត់ចំនួន/បាឡែត' });
                    }
                  }
                });

                // Sort pallets needed (largest amount first for better packing, or by name)
                palletsNeeded.sort((a, b) => b.count - a.count);

                // Initialize warehouse slots: Left and Right matrices [row][depth][height]
                const leftMatrix: any[][][] = Array(leftRows).fill(null).map(() => Array(depth).fill(null).map(() => []));
                const rightMatrix: any[][][] = Array(rightRows).fill(null).map(() => Array(depth).fill(null).map(() => []));
                
                let currentSide = leftRows > 0 ? 'left' : 'right';
                let currentRow = 0;
                let currentDepth = 0;

                // Flatten slots for easier linear filling
                // Priority: Depth 0 (front) for all rows, then Depth 1, etc.
                // Or Row by Row: Row 0 depth 0->max, Row 1 depth 0->max. Row by Row is usually how a warehouse is organized.
                let slotsOrder: {side: string, r: number, d: number}[] = [];
                
                // Let's organize by row, from back to front (depth - 1 down to 0) so the front is accessible.
                // Or front to back (0 to depth - 1). Let's do front to back: depth 0 is nearest the aisle for each row? 
                // Actually, if depth is how deep a row goes, you fill the back first (depth-1), so you don't block yourself!
                for (let r = 0; r < Math.max(leftRows, rightRows); r++) {
                  if (r < leftRows) {
                    for (let d = depth - 1; d >= 0; d--) slotsOrder.push({side: 'left', r, d});
                  }
                  if (r < rightRows) {
                    for (let d = depth - 1; d >= 0; d--) slotsOrder.push({side: 'right', r, d});
                  }
                }

                let slotIdx = 0;
                let unplacedPallets = 0;

                for (let p of palletsNeeded) {
                  let pCount = p.count;
                  while (pCount > 0 && slotIdx < slotsOrder.length) {
                    const slot = slotsOrder[slotIdx];
                    const targetMatrix = slot.side === 'left' ? leftMatrix : rightMatrix;
                    const stack = targetMatrix[slot.r][slot.d];
                    
                    if (stack.length < maxHeight) {
                      stack.push({ product: p.product, color: p.color });
                      pCount--;
                    } else {
                      // Move to next slot if this one is full
                      slotIdx++;
                    }
                  }
                  if (pCount > 0) {
                    unplacedPallets += pCount;
                  }
                }

                const renderMatrix = (matrix: any[][][], side: string) => {
                  if (matrix.length === 0) return null;
                  return (
                    <div className="flex flex-col gap-2">
                      <div className="text-center font-bold text-slate-400 text-xs mb-2">{side === 'left' ? '← ផ្នែកខាងឆ្វេង' : 'ផ្នែកខាងស្តាំ →'}</div>
                      {matrix.map((row, rIdx) => (
                        <div key={\`\${side}-r\${rIdx}\`} className="flex gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm items-center">
                          <div className="w-8 text-center text-xs font-black text-slate-300">ជួរ {rIdx + 1}</div>
                          <div className="flex gap-1">
                            {row.map((stack, dIdx) => (
                              <div 
                                key={\`\${side}-r\${rIdx}-d\${dIdx}\`} 
                                className={\`w-14 h-14 sm:w-20 sm:h-20 rounded-lg border-2 \${stack.length > 0 ? 'border-slate-300 bg-slate-50' : 'border-dashed border-slate-200 bg-transparent'} flex flex-col justify-end overflow-hidden relative group cursor-pointer\`}
                                title={stack.length > 0 ? stack.map(s => s.product).join(', ') : 'ទំនេរ'}
                              >
                                {stack.length === 0 && <span className="absolute inset-0 flex items-center justify-center text-slate-200 text-xs font-bold">ទំនេរ</span>}
                                {stack.map((item, hIdx) => (
                                  <div 
                                    key={hIdx} 
                                    className={\`\${item.color} w-full opacity-90 border-t border-white/20\`}
                                    style={{ height: \`\${100 / maxHeight}%\` }}
                                  >
                                    <div className="text-[8px] sm:text-[10px] text-white font-black truncate px-1 text-center leading-tight h-full flex items-center justify-center">
                                      {item.product.substring(0, 4)}
                                    </div>
                                  </div>
                                ))}
                                {/* Stack Count Badge */}
                                {stack.length > 0 && (
                                  <div className="absolute top-0 right-0 bg-slate-800 text-white text-[8px] font-bold px-1 rounded-bl-md">
                                    {stack.length}/{maxHeight}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div className="w-full flex flex-col items-center">
                    {/* Warehouse Map */}
                    <div className="bg-slate-200 p-4 sm:p-8 rounded-3xl shadow-inner border border-slate-300 flex flex-col sm:flex-row gap-8 sm:gap-16 items-center sm:items-start justify-center min-w-max mx-auto">
                      {/* Left Side */}
                      {renderMatrix(leftMatrix, 'left')}
                      
                      {/* Aisle */}
                      {(leftRows > 0 || rightRows > 0) && (
                        <div className="w-16 sm:w-24 h-full min-h-[300px] border-x-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-100/50 rounded-lg">
                          <span className="transform -rotate-90 text-slate-400 font-black tracking-widest text-sm whitespace-nowrap uppercase">ផ្លូវដើរ (Aisle)</span>
                        </div>
                      )}

                      {/* Right Side */}
                      {renderMatrix(rightMatrix, 'right')}
                    </div>

                    {/* Summary & Legend */}
                    <div className="mt-8 w-full max-w-4xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                        <span className="text-xl">📊</span> សេចក្តីសង្ខេប (Summary)
                      </h4>
                      
                      {unplacedPallets > 0 && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 font-bold text-sm mb-4">
                          ⚠️ ឃ្លាំងពេញ! មានទំនិញស្មើនឹង {unplacedPallets} បាឡែត ដែលមិនមានកន្លែងទុកដាក់។ សូមបន្ថែមទំហំឃ្លាំង!
                        </div>
                      )}
                      
                      {unassignedList.length > 0 && (
                        <div className="bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100 font-bold text-sm mb-4">
                          ⚠️ ទំនិញមិនបានរៀបចំ (អត់បានកំណត់ចំនួន/បាឡែត): {unassignedList.map(u => u.product).join(', ')}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {palletsNeeded.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 pr-4 rounded-full border border-slate-100">
                            <span className={\`w-4 h-4 rounded-full \${p.color} shadow-sm\`}></span>
                            <span className="text-xs font-bold text-slate-700">{p.product}:</span>
                            <span className="text-xs font-black text-slate-900">{p.count} បាឡែត</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
`;

content = content.replace('      {/* Pallet Config Modal */}', mapModalCode + '\n      {/* Pallet Config Modal */}');
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
