const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
You must extract the OUTGOING stock. The table has several numeric columns. YOU MUST EXAMINE THE COLUMN HEADERS CAREFULLY.
- EXTRACT from "ចំនួនលក់" (Sold) -> put in 'soldQuantity'
- EXTRACT from "ដូរក្រវិល" / "ចំនួនដបប្រវិល" (Exchanged/Ring pull) -> put in 'exchangedQuantity'
- EXTRACT from "ចំនួនថែម" / "ជួនថែម" / "ថែម" (Promo/Free) -> put in 'promoQuantity'

VISUAL GUIDE for the table layout (Left to Right):
1. First numeric column is often "ក្នុងឡាន" or "ស្តុកឡើង" (Loaded Stock). -> DO NOT EXTRACT (Ignore this!)
2. Second numeric column is often "ចំនួនដបប្រវិល" / "ដូរក្រវិល". -> Put in 'exchangedQuantity'
3. Third numeric column is often "ចំនួនលក់" (Sold). -> Put in 'soldQuantity'
4. Other columns might be "ថែម" (Promo) -> Put in 'promoQuantity'
5. Towards the right is "ចំនួនសល់" (Remaining Stock). -> DO NOT EXTRACT (Ignore this!)

Example: If a row has 127 in column 1, 4 in column 2, 15 in column 3, and 108 in column 5.
Then 'exchangedQuantity' = 4, 'soldQuantity' = 15, and 'promoQuantity' = 0.
IGNORE 127 and 108 completely!

In the 'description', write EXACTLY: "លក់: [val], ដូរក្រវិល: [val], ថែម: [val]" using only non-zero values.
\`;
      }`;

const replacement = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
YOU MUST EXAMINE THE COLUMN HEADERS CAREFULLY AND EXTRACT ONLY THE FOLLOWING COLUMNS:
1. "ចំនួនលក់" (Sold Quantity) -> Extract this value and put it in 'soldQuantity'
2. "ដូរក្រវិល" or "ចំនួនដបប្រវិល" or "ក្រវិល" (Exchanged/Ring pull Quantity) -> Extract this value and put it in 'exchangedQuantity'
3. "ចំនួនថែម" or "ជួនថែម" or "ថែម" (Promo/Free Quantity) -> Extract this value and put it in 'promoQuantity'

WARNING: 
- DO NOT extract values from "ស្តុកឃ្លាំង" or "ស្តុកដើមគ្រា" (Opening Stock)
- DO NOT extract values from "ស្តុកចូល" (Stock In)
- DO NOT extract values from "ស្តុកឡើងឡាន" or "ក្នុងឡាន" or "ស្តុកឡើង" (Stock Out / Loaded)
- DO NOT extract values from "ស្តុកត្រឡប់" (Returned Stock)
- DO NOT extract values from "ស្តុកសល់" or "ចំនួនសល់" (Remaining Stock)
- If a column is missing, assign 0.

Example: If a row has "127" in "ស្តុកឡើងឡាន", "4" in "ដូរក្រវិល", "15" in "ចំនួនលក់", and "108" in "ស្តុកសល់".
You MUST output: 'exchangedQuantity' = 4, 'soldQuantity' = 15, and 'promoQuantity' = 0.
IGNORE 127 and 108 completely!

In the 'description', write EXACTLY: "លក់: [val], ដូរក្រវិល: [val], ថែម: [val]" using only non-zero values.
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
