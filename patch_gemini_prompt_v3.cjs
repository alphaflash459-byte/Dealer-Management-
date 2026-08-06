const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
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

const replacement = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
The provided image is a table with multiple numeric columns. IT IS CRITICAL TO EXTRACT NUMBERS FROM THE CORRECT COLUMNS, EVEN IF THERE ARE MANY OTHER COLUMNS.

STEP 1: Read EVERY column header in the table (from left to right).
STEP 2: Figure out which column index corresponds to the following data points:
  - SOLD: Look for header "ចំនួនលក់" or "លក់" (Sold Quantity). The values from this column MUST go to 'soldQuantity'.
  - EXCHANGED: Look for header "ដូរក្រវិល", "ក្រវិល", "ចំនួនដបប្រវិល", or "ដូរ" (Exchanged/Ring pull Quantity). The values from this column MUST go to 'exchangedQuantity'.
  - PROMO/FREE: Look for header "ចំនួនថែម", "ថែម", or "ជួនថែម" (Promo Quantity). The values from this column MUST go to 'promoQuantity'.

STEP 3: IGNORE ANY OTHER NUMBERS. Do NOT extract numbers from columns labeled:
  - "ស្តុកឃ្លាំង", "ស្តុកដើមគ្រា" (Opening)
  - "ស្តុកចូល", "ចូល" (In)
  - "ស្តុកឡើងឡាន", "ក្នុងឡាន", "ស្តុកឡើង", "សរុប" (Loaded/Total)
  - "ស្តុកត្រឡប់", "ត្រឡប់" (Returned)
  - "ស្តុកសល់", "សល់", "ចំនួនសល់" (Remaining)

Example Scenario:
Table Headers: | ទំនិញ (Product) | ក្នុងឡាន (Loaded) | លក់ (Sold) | ក្រវិល (Exchanged) | ថែម (Promo) | សល់ (Remaining) |
Row values:    | WURKZ           | 100             | 15        | 5                 | 2          | 78              |
Extraction Logic:
- 'soldQuantity' gets 15 (from the "លក់" column).
- 'exchangedQuantity' gets 5 (from the "ក្រវិល" column).
- 'promoQuantity' gets 2 (from the "ថែម" column).
- IGNORE 100 (Loaded) and 78 (Remaining).

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
