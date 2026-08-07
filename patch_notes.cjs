const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetSold = `In the 'description' field, write EXACTLY: "លក់: [soldQuantity], ដូរក្រវិល: [exchangedQuantity], ថែម: [promoQuantity]" using the actual extracted numbers.`;
const replacementSold = `In the 'description' field, write: "លក់: [soldQuantity], ដូរ: [exchangedQuantity], ថែម: [promoQuantity]". IF there is an actual note/remark on this row in the image, APPEND it like this: "លក់: ..., ដូរ: ..., ថែម: ... | [Extracted Note]".`;

const targetRules = `6. EXACT MATCH: Map the product name to the provided list if possible. Pay close attention to extra words or suffixes.`;
const replacementRules = `6. EXACT MATCH: Map the product name to the provided list if possible. Pay close attention to extra words or suffixes.\n7. NOTES/REMARKS (កំណត់សម្គាល់): Look for a column named "កំណត់សម្គាល់", "ផ្សេងៗ", "Note", or any extra text/remarks written next to a product. Extract this text!`;

code = code.replace(targetSold, replacementSold);
code = code.replace(targetRules, replacementRules);
code = code.replace(/- \`description\` \(string, optional, any extra notes for the item\)/g, "- \\`description\\` (string, PUT ANY EXTRACTED NOTES/REMARKS HERE. If none, leave empty. For Stock Sold, follow its specific rule)");

fs.writeFileSync('server.ts', code);
console.log('Patched notes instructions successfully');
