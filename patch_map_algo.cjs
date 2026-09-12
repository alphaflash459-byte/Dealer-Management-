const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetAlgo = `                // Flatten slots for easier linear filling
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
                }`;

const replaceAlgo = `                // Dedicated rows for each product (1 Row = 1 Product Type)
                let availableRows: {side: string, r: number}[] = [];
                for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});
                for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});

                let unplacedPallets = 0;

                for (let p of palletsNeeded) {
                  let pCount = p.count;
                  
                  while (pCount > 0) {
                    if (availableRows.length === 0) {
                      unplacedPallets += pCount;
                      break;
                    }
                    
                    // Take the next available row entirely for this product
                    let row = availableRows.shift()!;
                    const targetMatrix = row.side === 'left' ? leftMatrix : rightMatrix;
                    
                    // Fill this row from back to front (depth - 1 down to 0)
                    for (let d = depth - 1; d >= 0; d--) {
                      if (pCount === 0) break;
                      
                      const stack = targetMatrix[row.r][d];
                      while (stack.length < maxHeight && pCount > 0) {
                        stack.push({ product: p.product, color: p.color });
                        pCount--;
                      }
                    }
                  }
                }`;

content = content.replace(targetAlgo, replaceAlgo);

const targetLabel1 = `<label className="text-[11px] font-bold text-slate-500">បាឡែតខាងឆ្វេង (ប៉ុន្មានជួរ)</label>`;
const replaceLabel1 = `<label className="text-[11px] font-bold text-slate-500" title="១ម៉ែត្រស្មើនឹង១ជួរបាឡែត">ប្រវែងឃ្លាំងឆ្វេង (ម៉ែត្រ)</label>`;
content = content.replace(targetLabel1, replaceLabel1);

const targetLabel2 = `<label className="text-[11px] font-bold text-slate-500">បាឡែតខាងស្តាំ (ប៉ុន្មានជួរ)</label>`;
const replaceLabel2 = `<label className="text-[11px] font-bold text-slate-500" title="១ម៉ែត្រស្មើនឹង១ជួរបាឡែត">ប្រវែងឃ្លាំងស្តាំ (ម៉ែត្រ)</label>`;
content = content.replace(targetLabel2, replaceLabel2);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
