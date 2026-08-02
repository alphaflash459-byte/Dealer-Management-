const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const searchInstructions = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
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
\`;
      }`;

const replaceInstructions = `      if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
        typeSpecificInstructions = \`
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
Look strictly at the columns representing "ចំនួនលក់" (Sold quantity), "ដូរក្រវិល" (Exchanged), and "ចំនួនថែម" (Promo/Free).
You MUST extract these 3 numbers separately into the JSON output fields: 'soldQuantity', 'exchangedQuantity', and 'promoQuantity'.
ABSOLUTELY DO NOT include or look at numbers from "ចំនួនសល់" (Remaining) or "ស្តុកឡើង" (Stock Out/Loaded).

In the 'description', write exactly: "លក់: [val], ដូរក្រវិល: [val], ថែម: [val]" using only non-zero values.
\`;
      }`;

const searchPrompt = `Extract the data into a structured JSON array. Each item must have:
- \`productName\` (string, the name of the product)
- \`quantity\` (number, the final aggregated quantity)
- \`unit\` (string, optional, e.g., \`case\`, \`box\`)
- \`description\` (string, optional, any extra notes for the item)\${availableProductsStr}

Ensure the output is ONLY a valid JSON array matching the structure. If you can't read an item clearly, skip it or put your best guess. Do not wrap the JSON in markdown codeblocks like \`\`\`json. Return raw JSON.\`;`;

const replacePrompt = `Extract the data into a structured JSON array. Each item must have:
- \`productName\` (string, the name of the product)
- \`quantity\` (number, the final aggregated quantity, if it's general transaction)
- \`soldQuantity\` (number, optional, ONLY for Stock Sold: value from "ចំនួនលក់" column)
- \`exchangedQuantity\` (number, optional, ONLY for Stock Sold: value from "ដូរក្រវិល" column)
- \`promoQuantity\` (number, optional, ONLY for Stock Sold: value from "ចំនួនថែម" column)
- \`unit\` (string, optional, e.g., \`case\`, \`box\`)
- \`description\` (string, optional, any extra notes for the item)\${availableProductsStr}

Ensure the output is ONLY a valid JSON array matching the structure. If you can't read an item clearly, skip it or put your best guess. Do not wrap the JSON in markdown codeblocks like \`\`\`json. Return raw JSON.\`;`;

const searchSchema = `                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["productName", "quantity"]
                  }`;

const replaceSchema = `                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      soldQuantity: { type: Type.NUMBER },
                      exchangedQuantity: { type: Type.NUMBER },
                      promoQuantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["productName"]
                  }`;


content = content.replace(searchInstructions, replaceInstructions);
content = content.replace(searchPrompt, replacePrompt);
content = content.replace(searchSchema, replaceSchema);

const searchResult = `      let jsonArray;
      try {
        jsonArray = JSON.parse(textResponse);
      } catch (e) {
        // ...
      }`;

const searchResultMap = `      return res.json({ success: true, data: jsonArray });`;

const replaceResultMap = `
      // Process JSON array to ensure correct quantity for Stock Sold
      if (Array.isArray(jsonArray)) {
        jsonArray = jsonArray.map((item: any) => {
          if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
            const sq = Number(item.soldQuantity) || 0;
            const eq = Number(item.exchangedQuantity) || 0;
            const pq = Number(item.promoQuantity) || 0;
            if (sq > 0 || eq > 0 || pq > 0) {
               item.quantity = sq + eq + pq;
               let descParts = [];
               if (sq > 0) descParts.push(\`លក់: \${sq}\`);
               if (eq > 0) descParts.push(\`ដូរក្រវិល: \${eq}\`);
               if (pq > 0) descParts.push(\`ថែម: \${pq}\`);
               item.description = descParts.join(', ');
            }
          }
          item.quantity = item.quantity || 0;
          return item;
        }).filter((item: any) => item.quantity > 0);
      }

      return res.json({ success: true, data: jsonArray });`;

content = content.replace(searchResultMap, replaceResultMap);

fs.writeFileSync('server.ts', content);
console.log('server.ts updated');
