const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace .page-break:last-child with .page-break:last-of-type
  content = content.replace(/\.page-break:last-child/g, '.page-break:last-of-type');

  // Replace <div class="footer">\n          </div> with nothing
  content = content.replace(/<div class="footer">\s*<\/div>/g, '');

  fs.writeFileSync(filePath, content);
  console.log("Patched empty pages fix in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
