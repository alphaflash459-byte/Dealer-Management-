const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const target = `const availableProductsStr = productNames && productNames.length > 0 
        ? \`\\nHere is the list of available product names in the system:\\n[\${productNames.join(', ')}]\\nWhen extracting the product name, please map it to the closest match from this list. If there is no good match, use the original text.\`
        : "";`;
        
  const replace = `const availableProductsStr = productNames && productNames.length > 0 
        ? \`\\nHere is the exact list of available product names in the system:\\n[\${productNames.join(', ')}]\\nCRITICAL: When extracting the product name, please map it EXACTLY to a name from this list. If the note says 'CBL ORD', you MUST map it to 'CBL ORD' (if it exists in the list) and NOT just 'CBL'. Pay close attention to extra words or suffixes. If there is no good match, use the original text.\`
        : "";`;
        
  if (content.includes(target)) {
    content = content.replace(target, replace);
    fs.writeFileSync(filePath, content);
    console.log("Patched AI prompt in " + filePath);
  } else {
    console.log("Target not found in " + filePath);
  }
}

patchFile('server.ts');
