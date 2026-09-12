const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetLoopCode = `                let allSlots: { side: string, r: number, d: number, stack: any[], maxH: number }[] = [];
                for (let row of availableRows) {
                  const targetMatrix = row.side === 'left' ? leftMatrix : rightMatrix;
                  // Push items to the back so empty slots face the center aisle
                  if (row.side === 'left') {
                    for (let d = 0; d < actualLeftDepth; d++) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualLeftHeight });
                    }
                  } else {
                    for (let d = actualRightDepth - 1; d >= 0; d--) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualRightHeight });
                    }
                  }
                }`;

const replaceLoopCode = `                let allSlots: { side: string, r: number, d: number, stack: any[], maxH: number }[] = [];
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
                }`;

const targetStackCode = `                  while (pCount > 0) {
                    if (currentSlotIdx >= allSlots.length) {
                      unplacedPallets += pCount;
                      break;
                    }
                    
                    let slot = allSlots[currentSlotIdx];
                    while (slot.stack.length < slot.maxH && pCount > 0) {
                      slot.stack.push({ product: p.product, color: p.color });
                      pCount--;
                    }
                    
                    if (slot.stack.length === slot.maxH) {
                      currentSlotIdx++;
                    }
                  }`;

const replaceStackCode = `                  while (pCount > 0) {
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
                  }`;

content = content.replace(targetLoopCode, replaceLoopCode);
content = content.replace(targetStackCode, replaceStackCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
