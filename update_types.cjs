const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace('quantity: number;', 'quantity: number;\n  soldQty?: number;\n  exchangedQty?: number;');
fs.writeFileSync('src/types.ts', content);
