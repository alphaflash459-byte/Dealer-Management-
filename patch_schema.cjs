const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetSchema = `                    required: ["productName", "soldQuantity", "exchangedQuantity", "promoQuantity"]`;
const replacementSchema = `                    required: ["productName", "quantity", "soldQuantity", "exchangedQuantity", "promoQuantity"]`;

if (code.includes(targetSchema)) {
  fs.writeFileSync('server.ts', code.replace(targetSchema, replacementSchema));
  console.log('Patched schema successfully');
} else {
  console.log('Schema target not found.');
}
