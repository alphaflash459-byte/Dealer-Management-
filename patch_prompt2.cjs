const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetPrompt = 'Extract the data into a structured JSON array. Each item must have:\n- \\`productName\\` (string, the name of the product)\n- \\`quantity\\` (number, the primary quantity. For Stock Sold, DO NOT calculate this, leave it 0)\n- \\`soldQuantity\\` (number, required for Stock Sold. Extract from ចំនួនលក់)\n- \\`exchangedQuantity\\` (number, required for Stock Sold. Extract from ដូរក្រវិល)\n- \\`promoQuantity\\` (number, required for Stock Sold. Extract from ចំនួនថែម)\n- \\`unit\\` (string, optional, e.g., \\`case\\`, \\`box\\`)\n- \\`description\\` (string, optional, any extra notes for the item)${availableProductsStr}\n\nEnsure the output is ONLY a valid JSON array matching the structure. Do not wrap the JSON in markdown codeblocks like \\`\\`\\`json. Return raw JSON.`;';

const replacementPrompt = 'Extract the data into a structured JSON array. Each item MUST have ALL of the following fields (if a value is missing or empty on the document, use 0 for numbers):\n- \\`productName\\` (string, the name of the product)\n- \\`quantity\\` (number, ALWAYS output a number. If none, use 0)\n- \\`soldQuantity\\` (number, ALWAYS output a number. Extract from ចំនួនលក់. If none, use 0)\n- \\`exchangedQuantity\\` (number, ALWAYS output a number. Extract from ដូរក្រវិល. If none, use 0)\n- \\`promoQuantity\\` (number, ALWAYS output a number. Extract from ចំនួនថែម. If none, use 0)\n- \\`unit\\` (string, optional, e.g., \\`case\\`, \\`box\\`)\n- \\`description\\` (string, optional, any extra notes for the item)${availableProductsStr}\n\nEnsure the output is ONLY a valid JSON array matching the structure. Do not wrap the JSON in markdown codeblocks like \\`\\`\\`json. Return raw JSON.`;';

if (code.includes(targetPrompt)) {
  fs.writeFileSync('server.ts', code.replace(targetPrompt, replacementPrompt));
  console.log('Patched prompt 2 successfully');
} else {
  console.log('Prompt 2 target not found.');
}
