const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    'const isUnavailable = e.status === "UNAVAILABLE" || errStr.includes("503");',
    'const isUnavailable = e.status === "UNAVAILABLE" || errStr.includes("503") || errStr.includes("fetch failed") || errStr.includes("ETIMEDOUT") || errStr.includes("ECONNRESET");'
);

fs.writeFileSync('server.ts', code);
