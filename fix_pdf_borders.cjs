const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const findStr = `            table {
              width: 100%;`;
  const replaceStr = `            table, th, td {
              border: 1px solid #000 !important;
            }
            table {
              width: 100%;`;
  if (content.includes(findStr)) {
    content = content.replaceAll(findStr, replaceStr);
    fs.writeFileSync(filePath, content);
    console.log("Patched PDF table borders in " + filePath);
  } else {
    console.log("Could not find table { in " + filePath);
  }
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
