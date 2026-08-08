const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Patch console.error to console.warn
const targetConsoleError = 'console.error(`Gemini API Error on ${modelName} (retries left: ${retries}):`, e.message || e);';
const replaceConsoleError = 'console.warn(`Gemini API Warning on ${modelName} (retries left: ${retries}):`, e.message || e);';
code = code.replace(targetConsoleError, replaceConsoleError);

// Also let's reorder models so the ones working are first to avoid console warnings
const regexModels = /const modelsToTry = \[.*?\];/;
const replaceModels = 'const modelsToTry = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-pro-latest"];';
code = code.replace(regexModels, replaceModels);

fs.writeFileSync('server.ts', code);
console.log('Patched error logs and models to try');
