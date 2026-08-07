const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      } else if (normalizedTargetType.includes('return') || targetType === 'Stock Return' || targetType === 'ស្តុកត្រឡប់') {
        typeSpecificInstructions = \`
INSTRUCTIONS FOR STOCK RETURN (ស្តុកត្រឡប់):
Extract only the returned stock quantity (ស្តុកត្រឡប់ / ត្រឡប់).
\`;
      } else if (normalizedTargetType.includes('out') || targetType === 'Stock Out' || targetType === 'ស្តុកឡើងឡាន') {
        typeSpecificInstructions = \`
INSTRUCTIONS FOR STOCK OUT (ស្តុកឡើង / ស្តុកឡើងឡាន):
Extract only the loaded stock quantity (ស្តុកឡើង / ចំនួនឡើង).
\`;
      }`;

const replacement = `      } else if (normalizedTargetType.includes('return') || targetType === 'Stock Return' || targetType === 'ស្តុកត្រឡប់') {
        typeSpecificInstructions = \`
*** ABSOLUTE STRICT RULE FOR STOCK RETURN (ស្តុកត្រឡប់ / ត្រឡប់) ***
Your task is to extract the quantity of products being returned or left over.
Look for columns like "ស្តុកត្រឡប់", "ត្រឡប់", "សល់", "ស្តុកសល់", "ចំនួន", or "Returned".
Extract the number for each product row and put it EXACTLY into the 'quantity' field.
If the cell is blank, has a dash, or is empty, use 0.
DO NOT extract numbers from 'ស្តុកឡើងឡាន', 'ក្នុងឡាន', 'លក់'.
\`;
      } else if (normalizedTargetType.includes('out') || targetType === 'Stock Out' || targetType === 'ស្តុកឡើងឡាន') {
        typeSpecificInstructions = \`
*** ABSOLUTE STRICT RULE FOR STOCK OUT (ស្តុកឡើង / ស្តុកឡើងឡាន) ***
Your task is to extract the quantity of products being loaded or prepared.
Look for columns like "ស្តុកឡើង", "ចំនួនឡើង", "ស្តុកឡើងឡាន", "ក្នុងឡាន", "ចំនួន", or "Loaded".
Extract the number for each product row and put it EXACTLY into the 'quantity' field.
If the cell is blank, has a dash, or is empty, use 0.
DO NOT extract numbers from 'ចំនួនលក់', 'ស្តុកសល់', 'ត្រឡប់'.
\`;
      }`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Patched instructions successfully');
} else {
  console.log('Instructions target not found.');
}
