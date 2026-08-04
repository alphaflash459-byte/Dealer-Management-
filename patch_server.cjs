const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target2 = `        if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
          return res.status(429).json({ 
             success: false,
            error: "ប្រព័ន្ធ AI កំពុងមមាញឹក ឬអស់កូតាក្នុងការស្កេន (429 Quota Exceeded)។ សូមរង់ចាំប្រហែល 30 វិនាទី រួចព្យាយាមម្តងទៀត។" 
           });
        }`;

const replace2 = `        if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
          return res.status(429).json({ 
             success: false,
            error: "ប្រព័ន្ធ AI កំពុងមមាញឹក ដោយសារមានអ្នកប្រើប្រាស់ច្រើន។ សូមរង់ចាំបន្តិចសិន រួចព្យាយាមស្កេនម្តងទៀត។" 
           });
        }`;

code = code.replace(target2, replace2);

fs.writeFileSync('server.ts', code);
console.log('server.ts patched again');
