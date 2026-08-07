const fs = require('fs');

const models = 'const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.0-pro-exp-02-05"];';

let code = fs.readFileSync('api/extract-note.ts', 'utf8');
code = code.replace(
  /const modelsToTry = \[.*?\];/g,
  models
);
fs.writeFileSync('api/extract-note.ts', code);

let code2 = fs.readFileSync('server.ts', 'utf8');
code2 = code2.replace(
  /const modelsToTry = \[.*?\];/g,
  models
);
fs.writeFileSync('server.ts', code2);
console.log("Patched models successfully");
