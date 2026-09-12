const leftRows = 8;
const rightRows = 8;
const depth = 3;
const maxHeight = 2;

let palletsNeeded = [
  { product: 'A', count: 13, color: 'bg-red-500' },
  { product: 'B', count: 5, color: 'bg-blue-500' },
  { product: 'C', count: 2, color: 'bg-green-500' }
];

const leftMatrix = Array(leftRows).fill(null).map(() => Array(depth).fill(null).map(() => []));
const rightMatrix = Array(rightRows).fill(null).map(() => Array(depth).fill(null).map(() => []));

let availableRows = [];
for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});
for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});

let allSlots = [];
for (let row of availableRows) {
  const targetMatrix = row.side === 'left' ? leftMatrix : rightMatrix;
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
}

console.log("Left Matrix:");
console.log(JSON.stringify(leftMatrix.slice(0, 4), null, 2));
