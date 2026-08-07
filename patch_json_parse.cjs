const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetJson = `      const textResponse = response?.text || "[]";
      let parsed = [];
      try {
        parsed = JSON.parse(textResponse);
      } catch(e) {
        // failed
      }`;

const replacementJson = `      let textResponse = response?.text || "[]";
      let parsed = [];
      try {
        // Clean markdown backticks if any
        textResponse = textResponse.replace(/^\\s*\`\`\`(json)?/m, '').replace(/\`\`\`\\s*$/m, '').trim();
        parsed = JSON.parse(textResponse);
      } catch(e) {
        console.error("Failed to parse JSON response:", textResponse);
        // failed
      }`;

if (code.includes('const textResponse = response?.text || "[]";')) {
  fs.writeFileSync('server.ts', code.replace(targetJson, replacementJson));
  console.log('Patched json parser successfully');
} else {
  console.log('Json parser target not found.');
}
