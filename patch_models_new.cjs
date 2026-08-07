const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const modelsToTry = \[.*?\];/;
const replacement = 'const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];';

if (regex.test(code)) {
  fs.writeFileSync('server.ts', code.replace(regex, replacement));
  console.log('Patched modelsToTry with 3.5-flash successfully');
}
