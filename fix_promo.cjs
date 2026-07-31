const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetToReplace = `                          {/* Promo display if computedPromo > 0 */}
                            <div className="text-[10px] font-black text-emerald-600 pl-1">`;

const replaceWith = `                          {/* Promo display if computedPromo > 0 */}
                          {computedPromo > 0 && (
                            <div className="text-[10px] font-black text-emerald-600 pl-1">`;

if (content.includes(targetToReplace)) {
  content = content.replace(targetToReplace, replaceWith);
  fs.writeFileSync(filePath, content);
  console.log("Successfully fixed promo block in AdminDashboard.tsx");
} else {
  console.log("Could not find the target string!");
}
