const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const searchInstructions = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
Look strictly at the columns representing "ចំនួនលក់" (Sold quantity), "ដូរក្រវិល" (Exchanged), and "ចំនួនថែម" (Promo/Free).
You MUST extract these 3 numbers separately into the JSON output fields: 'soldQuantity', 'exchangedQuantity', and 'promoQuantity'.
ABSOLUTELY DO NOT include or look at numbers from "ចំនួនសល់" (Remaining) or "ស្តុកឡើង" (Stock Out/Loaded).

In the 'description', write exactly: "លក់: [val], ដូរក្រវិល: [val], ថែម: [val]" using only non-zero values.
\`;`;

const replaceInstructions = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
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
\`;`;

content = content.replace(searchInstructions, replaceInstructions);

fs.writeFileSync('server.ts', content);
console.log('Instructions updated successfully.');
