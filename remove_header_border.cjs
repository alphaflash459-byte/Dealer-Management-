const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // To be safe, we'll replace the border-bottom for .header in the stock report only.
  // Actually, we can remove it from both invoices and stock reports, or just the stock reports.
  // The user said "ដកបន្ទាត់មួយនៅ ខាងក្រោម របាយការណ៍ស្តុកលក់ប្រចាំថ្ងៃ ចេញ", which translates to "Remove a line below Daily Sales Stock Report"
  
  const targetAdmin = `            .header {
              text-align: center;
              margin-bottom: 24px;
              border-bottom: 1px solid #000;
              padding-bottom: 12px;
            }`;
            
  const replaceAdmin = `            .header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 12px;
            }`;
            
  const targetUser = `            .header {
              text-align: center;
              margin-bottom: 24px;
              border-bottom: 1px solid #000;
              padding-bottom: 12px;
            }`;
            
  const replaceUser = `            .header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 12px;
            }`;

  if (content.includes(targetAdmin)) {
    content = content.replace(targetAdmin, replaceAdmin);
  }
  
  if (content.includes(targetUser)) {
    content = content.replace(targetUser, replaceUser);
  }

  fs.writeFileSync(filePath, content);
  console.log("Removed header border in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
