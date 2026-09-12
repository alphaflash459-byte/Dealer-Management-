const leftRows = 2;
const rightRows = 2;
const actualLeftDepth = 3;
const actualRightDepth = 3;
const actualLeftHeight = 2;
const actualRightHeight = 2;

let palletsNeeded = [
  { product: 'A', count: 5, color: 'bg-red-500' },
  { product: 'B', count: 2, color: 'bg-blue-500' },
  { product: 'C', count: 1, color: 'bg-green-500' }
];

const leftMatrix = Array(leftRows).fill(null).map(() => Array(actualLeftDepth).fill(null).map(() => []));
const rightMatrix = Array(rightRows).fill(null).map(() => Array(actualRightDepth).fill(null).map(() => []));

let availableRows = [];
for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});
for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});

let allSlots = [];
for (let row of availableRows) {
  const targetMatrix = row.side === 'left' ? leftMatrix : rightMatrix;
  // Aisle to Wall
  if (row.side === 'left') {
    // Left Aisle is at depth - 1
    for (let d = actualLeftDepth - 1; d >= 0; d--) {
      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualLeftHeight });
    }
  } else {
    // Right Aisle is at 0
    for (let d = 0; d < actualRightDepth; d++) {
      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualRightHeight });
    }
  }
}

let unplacedPallets = 0;
let currentSlotIdx = 0;

for (let p of palletsNeeded) {
  let pCount = p.count;
  
  if (currentSlotIdx < allSlots.length && allSlots[currentSlotIdx].stack.length > 0) {
    currentSlotIdx++;
  }

  // Pre-calculate stacks for this product so remainder is first
  let maxHForProduct = currentSlotIdx < allSlots.length ? allSlots[currentSlotIdx].maxH : 2; 
  // (Assuming maxH is consistent, or we adapt dynamically)
  
  // Actually, we can just do:
  let stacksToPlace = [];
  while (pCount > 0) {
    // Look at current maxH
    let maxH = currentSlotIdx + stacksToPlace.length < allSlots.length 
      ? allSlots[currentSlotIdx + stacksToPlace.length].maxH 
      : 2;
      
    // Wait, dynamic maxH is tricky if it varies per side.
    // Let's assume we just want to place the remainder first based on the *first* slot's maxH
    break;
  }
}
