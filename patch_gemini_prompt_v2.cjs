const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
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

const replacement = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
The provided image is a table with multiple numeric columns.
STEP 1: Identify the column headers at the top of the table.
STEP 2: Map the numeric values in each row to their corresponding column headers based on visual horizontal order.
STEP 3: ONLY extract values from columns that semantically mean:
  - "ចំនួនលក់" / "លក់" (Sold Quantity) -> Map to 'soldQuantity'
  - "ដូរក្រវិល" / "ចំនួនដបប្រវិល" / "ក្រវិល" (Exchanged/Ring pull Quantity) -> Map to 'exchangedQuantity'
  - "ចំនួនថែម" / "ជួនថែម" / "ថែម" (Promo/Free Quantity) -> Map to 'promoQuantity'

WARNING - STRICTLY IGNORE THE FOLLOWING COLUMNS (even if they have numbers):
- "ស្តុកឃ្លាំង" / "ស្តុកដើមគ្រា" (Opening Stock)
- "ស្តុកចូល" (Stock In)
- "ស្តុកឡើងឡាន" / "ក្នុងឡាន" / "ស្តុកឡើង" / "ចំនួនឡើង" / "សរុប" (Stock Out / Loaded / Total)
- "ស្តុកត្រឡប់" / "ត្រឡប់" (Returned Stock)
- "ស្តុកសល់" / "ចំនួនសល់" / "សល់" (Remaining Stock)

Example: If the columns in order are [Product Name, Loaded, Exchanged, Sold, Remaining]
And a row is: [WURKZ, 127, 4, 15, 108]
You MUST correctly identify that 127 is Loaded (IGNORE), 4 is Exchanged (EXTRACT), 15 is Sold (EXTRACT), and 108 is Remaining (IGNORE).
So for WURKZ, output: 'exchangedQuantity' = 4, 'soldQuantity' = 15, 'promoQuantity' = 0.

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
