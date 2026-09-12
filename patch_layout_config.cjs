const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCode1 = `  const [palletConfig, setPalletConfig] = useState<any>({
    layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0 },
    capacities: {}
  });`;

const replaceCode1 = `  const [palletConfig, setPalletConfig] = useState<any>({
    layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 },
    capacities: {}
  });`;

const targetCode2 = `                const config = palletConfig || { layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0 }, capacities: {} };
                const { leftRows = 0, rightRows = 0, depth = 0, maxHeight = 0 } = config.layout || {};`;

const replaceCode2 = `                const config = palletConfig || { layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 }, capacities: {} };
                const { leftRows = 0, rightRows = 0, depth = 0, maxHeight = 0, leftDepth = 0, rightDepth = 0, leftMaxHeight = 0, rightMaxHeight = 0 } = config.layout || {};
                
                // Fallbacks if distinct values are not set
                const actualLeftDepth = leftDepth > 0 ? leftDepth : depth;
                const actualRightDepth = rightDepth > 0 ? rightDepth : depth;
                const actualLeftHeight = leftMaxHeight > 0 ? leftMaxHeight : maxHeight;
                const actualRightHeight = rightMaxHeight > 0 ? rightMaxHeight : maxHeight;`;

const targetCode3 = `                const leftMatrix: any[][][] = Array(leftRows).fill(null).map(() => Array(depth).fill(null).map(() => []));
                const rightMatrix: any[][][] = Array(rightRows).fill(null).map(() => Array(depth).fill(null).map(() => []));`;

const replaceCode3 = `                const leftMatrix: any[][][] = Array(leftRows).fill(null).map(() => Array(actualLeftDepth).fill(null).map(() => []));
                const rightMatrix: any[][][] = Array(rightRows).fill(null).map(() => Array(actualRightDepth).fill(null).map(() => []));`;

const targetCode4 = `                for (let row of availableRows) {
                  const targetMatrix = row.side === 'left' ? leftMatrix : rightMatrix;
                  // Push items to the back so empty slots face the center aisle
                  if (row.side === 'left') {
                    for (let d = 0; d < depth; d++) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualLeftHeight });
                    }
                  } else {
                    for (let d = depth - 1; d >= 0; d--) {
                      allSlots.push({ side: row.side, r: row.r, d: d, stack: targetMatrix[row.r][d], maxH: actualRightHeight });
                    }
                  }
                }`; // Need to be careful here, the actual target code doesn't have maxH yet

const originalLoopCode = `                let allSlots: { side: string, r: number, d: number, stack: any[] }[] = [];
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
                }`;
                
const replaceLoopCode = `                let allSlots: { side: string, r: number, d: number, stack: any[], maxH: number }[] = [];
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

const stackLoopCode = `                    let slot = allSlots[currentSlotIdx];
                    while (slot.stack.length < maxHeight && pCount > 0) {
                      slot.stack.push({ product: p.product, color: p.color });
                      pCount--;
                    }
                    
                    if (slot.stack.length === maxHeight) {
                      currentSlotIdx++;
                    }`;
const replaceStackLoopCode = `                    let slot = allSlots[currentSlotIdx];
                    while (slot.stack.length < slot.maxH && pCount > 0) {
                      slot.stack.push({ product: p.product, color: p.color });
                      pCount--;
                    }
                    
                    if (slot.stack.length === slot.maxH) {
                      currentSlotIdx++;
                    }`;


content = content.replace(targetCode1, replaceCode1);
content = content.replace(targetCode2, replaceCode2);
content = content.replace(targetCode3, replaceCode3);
content = content.replace(originalLoopCode, replaceLoopCode);
content = content.replace(stackLoopCode, replaceStackLoopCode);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
