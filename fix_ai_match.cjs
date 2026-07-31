const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const target = `        // match product
        const matchedProduct = products.find(p => p.name.toLowerCase().includes((item.productName || '').toLowerCase()) || (item.productName || '').toLowerCase().includes(p.name.toLowerCase()));`;
        
  const replace = `        // match product
        const searchName = (item.productName || '').trim().toLowerCase();
        let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
        if (!matchedProduct) {
          const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
          matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
        }`;
        
  if (content.includes(target)) {
    content = content.replace(target, replace);
    fs.writeFileSync(filePath, content);
    console.log("Patched AI matching in " + filePath);
  } else {
    console.log("Target not found in " + filePath);
  }
}

patchFile('src/components/AdminDashboard.tsx');
