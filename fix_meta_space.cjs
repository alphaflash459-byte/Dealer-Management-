const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const target = `            .meta-info {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 16px;
              margin-bottom: 30px;`;
              
  const replace = `            .meta-info {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 16px;
              margin-bottom: 16px;`;

  if (content.includes(target)) {
    content = content.replace(target, replace);
    fs.writeFileSync(filePath, content);
    console.log("Fixed meta-info space in " + filePath);
  }
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
