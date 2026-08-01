const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const search = `            if (rowNumber > 3 && isNumber && str.trim() !== '') {
               khSize = 14;
               enSize = 14;
            }`;
            
const replace = `            if (rowNumber > 3 && isNumber && str.trim() !== '') {
               khSize = 14;
               enSize = 14;
               if (colNumber === 1) {
                 khSize = 10;
                 enSize = 10;
               }
            }`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log("Patched col1 size");
} else {
  console.log("String not found!");
}
