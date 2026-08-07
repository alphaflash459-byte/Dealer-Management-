const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const modelsToTry = \[.*?\];/;
const replacement = 'const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];';

if (regex.test(code)) {
  fs.writeFileSync('server.ts', code.replace(regex, replacement));
  console.log('Patched modelsToTry final successfully');
}
