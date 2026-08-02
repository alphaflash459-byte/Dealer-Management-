const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const searchInstructions = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
You are looking at a table that contains multiple columns. To calculate the final sold quantity, you MUST ONLY extract numbers from these 3 specific columns:
1. "ចំនួនលក់" (Sold quantity)
2. "ដូរក្រវិល" (Ring pull exchange / Exchanged)
3. "ចំនួនថែម" (Promo / Free quantity)

You MUST SUM (ADD TOGETHER) the values from ONLY these 3 columns to calculate the final 'quantity' for each product.
Formula: final quantity = (Value in ចំនួនលក់) + (Value in ដូរក្រវិល) + (Value in ចំនួនថែម)

Example: If a product has "4" in ចំនួនលក់, "15" in ដូរក្រវិល, and "." or nothing in ចំនួនថែម, the final quantity is 4 + 15 = 19.
Example: If a product has "." in ចំនួនលក់, "13" in ដូរក្រវិល, and "." in ចំនួនថែម, the final quantity is 13.

WARNING: You MUST COMPLETELY IGNORE the columns "ចំនួនសល់" (Remaining), "ចំនួនជិះឡាន" / "ចំនួនក្នុងឡាន" / "ស្តុកឡើង" (Loaded stock), and "ផ្សេងៗ" (Others). Do NOT include them in the calculation.

In the 'description' field, briefly write down the breakdown like "លក់: X, ដូរក្រវិល: Y, ថែម: Z" (only include non-zero values).
\`;`;

const replaceInstructions = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
Look strictly at the columns representing "ចំនួនលក់" (Sold quantity), "ដូរក្រវិល" (Exchanged), and "ចំនួនថែម" (Promo/Free).
You MUST calculate the TOTAL final 'quantity' for each product by ADDING these 3 columns together.
Formula: quantity = (ចំនួនលក់) + (ដូរក្រវិល) + (ចំនួនថែម)

ABSOLUTELY DO NOT include or look at numbers from "ចំនួនសល់" (Remaining) or "ស្តុកឡើង" (Stock Out/Loaded). If you include these, the data will be completely wrong.

Example calculation:
If a row has:
- ចំនួនលក់ = 4
- ដូរក្រវិល = 15
- ចំនួនថែម = (blank or .)
- ចំនួនសល់ = 108
=> Final quantity MUST be 4 + 15 = 19. (Ignore 108!)

In the 'description', write exactly: "លក់: [val], ដូរក្រវិល: [val], ថែម: [val]" using only non-zero values.
\`;`;

if (content.includes(searchInstructions)) {
  content = content.replace(searchInstructions, replaceInstructions);
  fs.writeFileSync('server.ts', content);
  console.log('Instructions updated successfully.');
} else {
  console.log('Could not find the instructions string in server.ts');
}
