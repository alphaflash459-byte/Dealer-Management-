const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const targetAdmin = `            .header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 12px;
            }`;
            
  const replaceAdmin = `            .header {
              text-align: center;
              margin-bottom: 8px;
            }`;
            
  const targetUser = `            .header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 12px;
            }`;
            
  const replaceUser = `            .header {
              text-align: center;
              margin-bottom: 8px;
            }`;

  if (content.includes(targetAdmin)) {
    content = content.replace(targetAdmin, replaceAdmin);
  }
  
  if (content.includes(targetUser)) {
    content = content.replace(targetUser, replaceUser);
  }

  fs.writeFileSync(filePath, content);
  console.log("Fixed header space in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
