const fs = require('fs');
let code = fs.readFileSync('api/extract-note.ts', 'utf8');
code = code.replace(
  'const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];',
  'const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.5-flash", "gemini-2.0-flash-lite-preview-02-05"];'
);
fs.writeFileSync('api/extract-note.ts', code);

let code2 = fs.readFileSync('server.ts', 'utf8');
code2 = code2.replace(
  'const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];',
  'const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.5-flash", "gemini-2.0-flash-lite-preview-02-05"];'
);
fs.writeFileSync('server.ts', code2);
console.log("Patched models successfully");
