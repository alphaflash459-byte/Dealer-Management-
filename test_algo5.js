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

let stacks = [];
for (let p of palletsNeeded) {
  // Use actualRightHeight as default maxH for this test, but in real code it depends on the side.
  // Actually, maxH is per side. If we pre-generate stacks, which maxH to use?
  // If left and right maxH differ, this global pool approach has a slight issue.
  // But wait, the user's config usually has symmetric maxH.
  // If they differ, we can just use the global maxHeight for splitting, or split dynamically.
  // Let's assume maxH = 2 for now.
  let maxH = 2; 
  let fullCount = Math.floor(p.count / maxH);
  let partial = p.count % maxH;
  
  for (let i = 0; i < fullCount; i++) {
    stacks.push({ product: p.product, type: 'full', pallets: maxH, totalPallets: p.count, color: p.color });
  }
  if (partial > 0) {
    stacks.push({ product: p.product, type: 'partial', pallets: partial, totalPallets: p.count, color: p.color });
  }
}

stacks.sort((a, b) => {
  if (a.type === 'full' && b.type === 'partial') return -1;
  if (a.type === 'partial' && b.type === 'full') return 1;
  return b.totalPallets - a.totalPallets;
});

let unplacedPallets = 0;

for (let row of availableRows) {
  const isLeft = row.side === 'left';
  const actualDepth = isLeft ? actualLeftDepth : actualRightDepth;
  const targetMatrix = isLeft ? leftMatrix : rightMatrix;
  
  if (stacks.length === 0) break;
  
  let stacksForRow = stacks.splice(0, actualDepth);
  
  if (isLeft) {
    let emptySlots = actualDepth - stacksForRow.length;
    for (let i = 0; i < stacksForRow.length; i++) {
      let d = emptySlots + i;
      let s = stacksForRow[i];
      for(let p=0; p<s.pallets; p++) {
        targetMatrix[row.r][d].push({ product: s.product, color: s.color });
      }
    }
  } else {
    for (let i = 0; i < stacksForRow.length; i++) {
      let d = stacksForRow.length - 1 - i;
      let s = stacksForRow[i];
      for(let p=0; p<s.pallets; p++) {
        targetMatrix[row.r][d].push({ product: s.product, color: s.color });
      }
    }
  }
}

for (let s of stacks) {
  unplacedPallets += s.pallets;
}

console.log("Left Matrix (Aisle is at end):");
console.log(JSON.stringify(leftMatrix, null, 2));
console.log("Right Matrix (Aisle is at start):");
console.log(JSON.stringify(rightMatrix, null, 2));
