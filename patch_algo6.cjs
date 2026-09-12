const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetAlgoCode = `                let availableRows: {side: string, r: number}[] = [];
                for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});
                for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});

                let allSlots: { side: string, r: number, d: number, stack: any[], maxH: number }[] = [];
                for (let row of availableRows) {
                  const targetMatrix = row.side === 'left' ? leftMatrix : rightMatrix;
                  // Order slots from Aisle to Wall so that the first assigned slot is always next to the Aisle
                  if (row.side === 'left') {
                    // Left Aisle is at the end (depth - 1)
                    for (let d = actualLeftDepth - 1; d >= 0; d--) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualLeftHeight });
                    }
                  } else {
                    // Right Aisle is at the start (0)
                    for (let d = 0; d < actualRightDepth; d++) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualRightHeight });
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
                    
                    // Determine how many to place in this slot.
                    // If pCount doesn't perfectly divide by maxH, the remainder goes to the FIRST slot (Aisle).
                    let amountToPlace = pCount % slot.maxH;
                    if (amountToPlace === 0) amountToPlace = slot.maxH;
                    
                    // Cap the amount to what can actually fit
                    amountToPlace = Math.min(amountToPlace, pCount, slot.maxH - slot.stack.length);
                    
                    while (amountToPlace > 0) {
                      slot.stack.push({ product: p.product, color: p.color });
                      pCount--;
                      amountToPlace--;
                    }
                    
                    // Always move to the next slot after placing our designated amount
                    // This leaves the partial stack at the Aisle without other products piling on top.
                    currentSlotIdx++;
                  }
                }`;

const replaceAlgoCode = `                let availableRows: {side: string, r: number}[] = [];
                for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});
                for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});

                let unplacedPallets = 0;
                
                // Map to track remaining pallets for each product
                let productsList = palletsNeeded.map(p => ({ ...p, remaining: p.count }));
                
                // Pre-sort productsList by total count descending (more pallets placed first -> closer to Wall)
                // Products with same count remain in Stock Out order (which was sorted before this)
                // Actually, palletsNeeded is already sorted by Stock Out, then by Count.
                // Let's re-sort strictly by Count descending to satisfy "more pallets at Wall".
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
                }`;

content = content.replace(targetAlgoCode, replaceAlgoCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
