const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCode = `                    // Fill this row towards the center aisle
                    // Left side: aisle is at depth - 1, so fill from depth - 1 down to 0
                    // Right side: aisle is at 0, so fill from 0 up to depth - 1
                    if (row.side === 'left') {
                      for (let d = depth - 1; d >= 0; d--) {
                        if (pCount === 0) break;
                        const stack = targetMatrix[row.r][d];
                        while (stack.length < maxHeight && pCount > 0) {
                          stack.push({ product: p.product, color: p.color });
                          pCount--;
                        }
                      }
                    } else {
                      for (let d = 0; d < depth; d++) {
                        if (pCount === 0) break;
                        const stack = targetMatrix[row.r][d];
                        while (stack.length < maxHeight && pCount > 0) {
                          stack.push({ product: p.product, color: p.color });
                          pCount--;
                        }
                      }
                    }`;

const replaceCode = `                    // Push items to the back so empty slots face the center aisle
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
                    }`;

content = content.replace(targetCode, replaceCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
