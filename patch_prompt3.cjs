const fs = require('fs');

const oldStr = `*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
ការស្កេន សម្រាប់ លក់ចេញ ចាប់យកទិន្នន័យតែបី column ចំនួនលក់ ដូរក្រវិល និងចំនួនថែម កុំខ្វល់ឬរំលង column ទិន្នន័យផ្សេងៗ។
1. ចាប់យក ទិន្នន័យ column ចំនួនលក់ ឬ លក់ ដាក់ក្នុង 'soldQuantity'
2. ចាប់យក ទិន្នន័យ column ដូរក្រវិល ឬ ក្រវិល ដាក់ក្នុង 'exchangedQuantity'
3. ចាប់យក ទិន្នន័យ column ចំនួនថែម ឬ ថែម ដាក់ក្នុង 'promoQuantity'`;

const newStr = `*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
ការស្កេន សម្រាប់ លក់ចេញ ចាប់យកទិន្នន័យតែបី column គឺ ចំនួនលក់, ក្រវិល, និង ថែម។ ហាមច្រឡំ column ក្រវិល និង ថែម ដាច់ខាត! សូមពិនិត្យមើលក្បាល column អោយច្បាស់មុននឹងទាញយកទិន្នន័យ!
1. ចាប់យក ទិន្នន័យពី column "ចំនួនលក់" ឬ "លក់" ដាក់ក្នុង 'soldQuantity'
2. ចាប់យក ទិន្នន័យពី column "ដូរក្រវិល" ឬ "ក្រវិល" ដាក់ក្នុង 'exchangedQuantity' (បញ្ជាក់៖ កុំយកទិន្នន័យពី column ថែម មកដាក់ក្នុងនេះ)
3. ចាប់យក ទិន្នន័យពី column "ចំនួនថែម" ឬ "ថែម" ដាក់ក្នុង 'promoQuantity' (បញ្ជាក់៖ កុំយកទិន្នន័យពី column ក្រវិល មកដាក់ក្នុងនេះ)`;

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
