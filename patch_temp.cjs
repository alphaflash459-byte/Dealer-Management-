const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = '              config: {\n                responseMimeType: "application/json",\n                responseSchema: {';
const replacement = '              config: {\n                temperature: 0.1,\n                responseMimeType: "application/json",\n                responseSchema: {';

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Patched config successfully');
} else {
  console.log('Config target not found.');
}
