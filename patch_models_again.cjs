const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = 'const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-pro", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];';
const replacement = 'const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.5-flash"];';

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Patched modelsToTry successfully');
} else {
  console.log('Target modelsToTry not found.');
  // fallback search
  const regex = /const modelsToTry = \[.*?\];/;
  if (regex.test(code)) {
    fs.writeFileSync('server.ts', code.replace(regex, replacement));
    console.log('Patched modelsToTry via regex successfully');
  }
}
