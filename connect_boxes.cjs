const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const targetMeta = `            .meta-info {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 16px;
              margin-bottom: 16px;
              font-size: 13px;
              border: 1px solid #000 !important;
              padding: 4px 8px;
              border-radius: 8px;`;
              
  const replaceMeta = `            .meta-info {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 16px;
              margin-bottom: -1px;
              font-size: 13px;
              border: 1px solid #000 !important;
              padding: 4px 8px;
              border-radius: 8px 8px 0 0;`;

  if (content.includes(targetMeta)) {
    content = content.replace(targetMeta, replaceMeta);
  }

  const targetTable = `            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }`;
            
  const replaceTable = `            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0;
            }`;

  if (content.includes(targetTable)) {
    content = content.replace(targetTable, replaceTable);
  }

  fs.writeFileSync(filePath, content);
  console.log("Connected boxes in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
