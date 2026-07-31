const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const replaceStr = `            table, th, td {
              border: 1px solid #000 !important;
            }`;
  if (content.includes(replaceStr)) {
    console.log("Already patched " + filePath);
  } else {
    console.log("Not patched yet!");
  }
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
