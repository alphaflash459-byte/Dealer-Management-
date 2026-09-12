const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCode = `                let availableRows: {side: string, r: number}[] = [];
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
                    
                    // Push items to the back so empty slots face the center aisle
                    // Left side: aisle is at depth - 1, deepest part is 0. Fill from 0 up to depth - 1.
                    // Right side: aisle is at 0, deepest part is depth - 1. Fill from depth - 1 down to 0.
                    if (row.side === 'left') {
                      for (let d = 0; d < depth; d++) {
                        if (pCount === 0) break;
                        const stack = targetMatrix[row.r][d];
                        while (stack.length < maxHeight && pCount > 0) {
                          stack.push({ product: p.product, color: p.color });
                          pCount--;
                        }
                      }
                    } else {
                      for (let d = depth - 1; d >= 0; d--) {
                        if (pCount === 0) break;
                        const stack = targetMatrix[row.r][d];
                        while (stack.length < maxHeight && pCount > 0) {
                          stack.push({ product: p.product, color: p.color });
                          pCount--;
                        }
                      }
                    }
                  }
                }`;

const replaceCode = `                let availableRows: {side: string, r: number}[] = [];
                for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});
                for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});

                let allSlots: { side: string, r: number, d: number, stack: any[] }[] = [];
                for (let row of availableRows) {
                  const targetMatrix = row.side === 'left' ? leftMatrix : rightMatrix;
                  // Push items to the back so empty slots face the center aisle
                  if (row.side === 'left') {
                    for (let d = 0; d < depth; d++) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d] });
                    }
                  } else {
                    for (let d = depth - 1; d >= 0; d--) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d] });
                    }
                  }
                }

                let unplacedPallets = 0;
                let currentSlotIdx = 0;

                for (let p of palletsNeeded) {
                  let pCount = p.count;
                  
                  // If the current slot is partially filled (from the previous product), move to the next slot
                  // because we don't want to mix different products in the same vertical stack.
                  if (currentSlotIdx < allSlots.length && allSlots[currentSlotIdx].stack.length > 0) {
                    currentSlotIdx++;
                  }

                  while (pCount > 0) {
                    if (currentSlotIdx >= allSlots.length) {
                      unplacedPallets += pCount;
                      break;
                    }
                    
                    let slot = allSlots[currentSlotIdx];
                    while (slot.stack.length < maxHeight && pCount > 0) {
                      slot.stack.push({ product: p.product, color: p.color });
                      pCount--;
                    }
                    
                    if (slot.stack.length === maxHeight) {
                      currentSlotIdx++;
                    }
                  }
                }`;

content = content.replace(targetCode, replaceCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
