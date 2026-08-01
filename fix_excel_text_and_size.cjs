const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Change title
const searchTitle = 'ws.addRow([`ស្តុកប្រចាំថ្ងៃ ( ${user.username || \'\'} )`, "", "", "", "", "", "", "", ""]);';
const replaceTitle = 'ws.addRow([`របាយការណ៍លក់ប្រចាំថ្ងៃ ( ${user.username || \'\'} )`, "", "", "", "", "", "", "", ""]);';

if (content.includes(searchTitle)) {
  content = content.replace(searchTitle, replaceTitle);
  console.log("Replaced title");
} else {
  console.log("Title not found!");
}

const searchFont = `          if (cell.value != null && typeof cell.value !== 'object') {
            const str = cell.value.toString();
            const hasKhmer = /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(str);
            const hasNonKhmer = /[^\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B\\s]/.test(str);
            
            const khSize = fontStyle.size === 14 ? 14 : 10;
            const enSize = fontStyle.size === 14 ? 14 : 12;`;

const replaceFont = `          if (cell.value != null && typeof cell.value !== 'object') {
            const str = cell.value.toString();
            const hasKhmer = /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(str);
            const hasNonKhmer = /[^\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B\\s]/.test(str);
            
            const isNumber = /^[\\[\\]\\(\\)\\d\\.\\,\\s\\u17E0-\\u17E9\\+]+$/.test(str.trim());
            
            let khSize = fontStyle.size === 14 ? 14 : 10;
            let enSize = fontStyle.size === 14 ? 14 : 12;
            
            if (rowNumber > 3 && isNumber && str.trim() !== '') {
               khSize = 14;
               enSize = 14;
            }`;

if (content.includes(searchFont)) {
  content = content.replace(searchFont, replaceFont);
  console.log("Replaced font size logic");
} else {
  console.log("Font logic not found!");
}

fs.writeFileSync(path, content);
