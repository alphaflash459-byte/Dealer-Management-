const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
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

const replacement = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
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

const index = code.indexOf(target);
if (index !== -1) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("prompt patched successfully");
} else {
    console.log("prompt target not found");
}
