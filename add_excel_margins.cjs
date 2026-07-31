const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchStr = `      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Merge Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Merge Name
        { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // Merge Phone
        { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, // Merge Date
        { s: { r: 1, c: 6 }, e: { r: 1, c: 8 } }  // Merge Plate
      );`;

const replaceStr = searchStr + `

      // Set margins to approximately 0.5cm (0.2 inches)
      ws['!margins'] = { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 };`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log("Patched excel margins");
} else {
  console.log("Search string not found!");
}
