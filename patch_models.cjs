const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = 'const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];';
const replacement = 'const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-pro", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];';

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Patched modelsToTry successfully');
} else {
  console.log('Target modelsToTry not found.');
}

// Let's also make the retry logic fail-fast if limit is 0
code = fs.readFileSync('server.ts', 'utf8');
const targetLoop = `            if (isRateLimit) {
              console.log(\`Rate limit / Quota reached for \${modelName}, waiting 10 seconds...\`);
              if (retries === 0) break;
              retries--;
              await new Promise(resolve => setTimeout(resolve, 10000));
              continue;
            }`;
const replacementLoop = `            if (isRateLimit) {
              console.log(\`Rate limit / Quota reached for \${modelName}. Moving to next model if limit is 0, or waiting if it's transient...\`);
              if (errStr.includes("limit: 0")) {
                  break; // Move to next model immediately
              }
              if (retries === 0) break;
              retries--;
              await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s instead of 10s to avoid timeout
              continue;
            }`;

if (code.includes(targetLoop)) {
  fs.writeFileSync('server.ts', code.replace(targetLoop, replacementLoop));
  console.log('Patched loop successfully');
} else {
  console.log('Target loop not found.');
}
