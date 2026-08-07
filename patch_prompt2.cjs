const fs = require('fs');

const oldStr = `*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
You must ONLY extract data for THREE SPECIFIC COLUMNS for every product row. IGNORE all other columns.
1. Column with header "ចំនួនលក់", "លក់", or "Sold" -> Extract this to 'soldQuantity'
2. Column with header "ដូរក្រវិល", "ក្រវិល", "ចំនួនដបប្រវិល", "ដូរ", or "Exchanged" -> Extract this to 'exchangedQuantity'
3. Column with header "ចំនួនថែម", "ថែម", "ជួនថែម", or "Promo" -> Extract this to 'promoQuantity'`;

const newStr = `*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
ការស្កេន សម្រាប់ លក់ចេញ ចាប់យកទិន្នន័យតែបី column ចំនួនលក់ ដូរក្រវិល និងចំនួនថែម កុំខ្វល់ឬរំលង column ទិន្នន័យផ្សេងៗ។
1. ចាប់យក ទិន្នន័យ column ចំនួនលក់ ឬ លក់ ដាក់ក្នុង 'soldQuantity'
2. ចាប់យក ទិន្នន័យ column ដូរក្រវិល ឬ ក្រវិល ដាក់ក្នុង 'exchangedQuantity'
3. ចាប់យក ទិន្នន័យ column ចំនួនថែម ឬ ថែម ដាក់ក្នុង 'promoQuantity'`;

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    fs.writeFileSync(filepath, code);
    console.log(`Patched ${filepath}`);
  }
}

patchFile('api/extract-note.ts');
patchFile('server.ts');
