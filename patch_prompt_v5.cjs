const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
YOU MUST ONLY, ONLY, ONLY EXTRACT FROM THESE THREE COLUMNS:
1. "ចំនួនលក់" / "លក់" -> Map to 'soldQuantity'
2. "ដូរក្រវិល" / "ក្រវិល" / "ចំនួនដបប្រវិល" / "ដូរ" -> Map to 'exchangedQuantity'
3. "ចំនួនថែម" / "ថែម" / "ជួនថែម" -> Map to 'promoQuantity'

YOU MUST COMPLETELY IGNORE ALL OTHER COLUMNS!
DO NOT EXTRACT ANY NUMBERS FROM:
- "ស្តុកឃ្លាំង" or "ស្តុកដើមគ្រា" (Opening Stock)
- "ស្តុកចូល" or "ចូល" (Stock In)
- "ស្តុកឡើងឡាន", "ក្នុងឡាន", "ស្តុកឡើង", or "សរុប" (Loaded / Total Stock)
- "ស្តុកត្រឡប់" or "ត្រឡប់" (Returned Stock)
- "ស្តុកសល់" or "សល់" (Remaining Stock)
- ANY other column not mentioned above.

HOW TO EXTRACT:
- First, look at the TABLE HEADERS to find which column is "លក់", which is "ក្រវិល", and which is "ថែម".
- Then, ONLY read the numbers in those specific columns for each product.
- If a column is empty or missing, put 0.
- DO NOT PUT "ស្តុកឡើងឡាន" (Loaded Stock) into 'soldQuantity'.
- DO NOT PUT "ស្តុកសល់" (Remaining Stock) into any field.

In the 'description', write EXACTLY: "លក់: [val], ដូរក្រវិល: [val], ថែម: [val]" using only non-zero values.
\`;
      }`;

const replacement = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
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

In the 'description' field, write EXACTLY: "លក់: [soldQuantity], ដូរក្រវិល: [exchangedQuantity], ថែម: [promoQuantity]" using the actual extracted numbers.
\`;
      }`;

const index = code.indexOf(target);
if (index !== -1) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("prompt patched successfully");
} else {
    console.log("prompt target not found");
}
