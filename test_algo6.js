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

let productsList = palletsNeeded.map(p => ({ ...p, remaining: p.count }));
// Pre-sort productsList by total count descending (more pallets placed first -> closer to Wall)
productsList.sort((a, b) => b.count - a.count);

let unplacedPallets = 0;

for (let row of availableRows) {
  const isLeft = row.side === 'left';
  const actualDepth = isLeft ? actualLeftDepth : actualRightDepth;
  const actualHeight = isLeft ? actualLeftHeight : actualRightHeight;
  const targetMatrix = isLeft ? leftMatrix : rightMatrix;
  
  let stacksForRow = [];
  
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

console.log("Right Matrix (Aisle is at start):");
console.log(JSON.stringify(rightMatrix, null, 2));
