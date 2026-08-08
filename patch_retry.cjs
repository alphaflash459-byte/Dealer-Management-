const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRetry = 'if (errStr.includes("limit: 0")) {';
const replaceRetry = 'if (errStr.includes("limit: 0") || errStr.includes("limit: 20")) {';
code = code.replace(targetRetry, replaceRetry);

fs.writeFileSync('server.ts', code);
console.log('Patched retry logic');
