const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCode = `                let availableRows: {side: string, r: number}[] = [];
                for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});
                for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});`;

const replaceCode = `                let availableRows: {side: string, r: number}[] = [];
                // User requested to sort from Right to Left
                for (let r = 0; r < rightRows; r++) availableRows.push({side: 'right', r});
                for (let r = 0; r < leftRows; r++) availableRows.push({side: 'left', r});`;

content = content.replace(targetCode, replaceCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
