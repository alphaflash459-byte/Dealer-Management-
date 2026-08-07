const fs = require('fs');

const validModels = 'const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];';

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  // Replace model list
  code = code.replace(
    /const modelsToTry = \[.*?\];/g,
    validModels
  );

  // Replace retry logic to fail fast on 429
  const oldRetryLogic = `
          if (isRateLimit) {
            console.log(\`Rate limit / Quota reached for \${modelName}, waiting 5 seconds...\`);
            if (retries === 0) break;
            retries--;
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }`;
          
  const newRetryLogic = `
          if (isRateLimit) {
            console.log(\`Rate limit / Quota reached for \${modelName}\`);
            break; // Fail fast for this model, try next one
          }`;

  if (code.includes('waiting 5 seconds...')) {
    code = code.replace(oldRetryLogic, newRetryLogic);
  } else {
    code = code.replace(
      /if \(isRateLimit\) \{[\s\S]*?continue;\n\s*\}/,
      newRetryLogic
    );
  }
  
  fs.writeFileSync(filepath, code);
}

patchFile('api/extract-note.ts');
patchFile('server.ts');
console.log("Patched successfully");
