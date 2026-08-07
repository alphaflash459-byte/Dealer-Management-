const fs = require('fs');

const oldPrompt = `*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
You must extract data for THREE SPECIFIC COLUMNS for every product row. 
Look at the table headers in the image and locate these three columns:
1. Column with header "ចំនួនលក់", "លក់", or "Sold" -> This is your 'soldQuantity'
2. Column with header "ដូរក្រវិល", "ក្រវិល", "ចំនួនដបប្រវិល", "ដូរ", or "Exchanged" -> This is your 'exchangedQuantity'
3. Column with header "ចំនួនថែម", "ថែម", "ជួនថែម", or "Promo" -> This is your 'promoQuantity'

For EACH product row, trace your eyes horizontally to these specific columns and extract the number. 
If the cell is blank, has a dash, or is empty, use 0.
You MUST output a number (even if 0) for ALL THREE fields: 'soldQuantity', 'exchangedQuantity', and 'promoQuantity'.

DO NOT mix them up.
DO NOT extract numbers from the "ស្តុកឡើងឡាន" (Loaded) or "ក្នុងឡាន" column.
DO NOT extract numbers from the "ស្តុកសល់" (Remaining) column.

In the 'description' field, write EXACTLY: "លក់: [soldQuantity], ដូរក្រវិល: [exchangedQuantity], ថែម: [promoQuantity]" using the actual extracted numbers.`;

const newPrompt = `*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
You must ONLY extract data for THREE SPECIFIC COLUMNS for every product row. IGNORE all other columns.
1. Column with header "ចំនួនលក់", "លក់", or "Sold" -> Extract this to 'soldQuantity'
2. Column with header "ដូរក្រវិល", "ក្រវិល", "ចំនួនដបប្រវិល", "ដូរ", or "Exchanged" -> Extract this to 'exchangedQuantity'
3. Column with header "ចំនួនថែម", "ថែម", "ជួនថែម", or "Promo" -> Extract this to 'promoQuantity'

For EACH product row, extract ONLY the numbers from these 3 columns.
If a cell is blank, has a dash, or is empty, use 0.
You MUST output a number (even if 0) for ALL THREE fields: 'soldQuantity', 'exchangedQuantity', and 'promoQuantity'.

DO NOT extract numbers from any other columns (e.g., ignore "ស្តុកឡើងឡាន", "ក្នុងឡាន", "ស្តុកសល់", etc.).

In the 'description' field, write EXACTLY: "លក់: [soldQuantity], ក្រវិល: [exchangedQuantity], ថែម: [promoQuantity]" using the actual extracted numbers.`;

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (code.includes(oldPrompt)) {
    code = code.replace(oldPrompt, newPrompt);
    fs.writeFileSync(filepath, code);
    console.log(`Patched ${filepath} successfully`);
  } else {
    console.log(`Could not find old prompt in ${filepath}`);
  }
}

patchFile('api/extract-note.ts');
patchFile('server.ts');
