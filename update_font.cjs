const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace font imports
  const newImport = `@import url('https://fonts.googleapis.com/css2?family=Moul&family=Inter:wght@400;500;700;900&family=Kantumruy+Pro:wght@400;500;700;900&display=swap');`;
  
  content = content.replace(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;700;900&family=Kantumruy\+Pro:wght@400;500;700;900&display=swap'\);/g, newImport);
  content = content.replace(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Kantumruy\+Pro:wght@400;500;700&family=Inter:wght@400;500;700&display=swap'\);/g, newImport);

  // Replace font families
  const oldFontFamily1 = `font-family: 'Kantumruy Pro', 'Inter', sans-serif;`;
  const newFontFamily = `font-family: 'Khmer OS Muol Light', 'Moul', 'Kantumruy Pro', 'Inter', sans-serif;`;
  
  content = content.replace(/font-family:\s*'Kantumruy Pro',\s*'Inter',\s*sans-serif;/g, newFontFamily);

  fs.writeFileSync(filePath, content);
  console.log("Updated fonts in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
