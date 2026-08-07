const fs = require('fs');

let code = fs.readFileSync('api/extract-note.ts', 'utf8');
code = code.replace(
  'error: "ប្រព័ន្ធ AI កំពុងមមាញឹក ឬអស់កូតាក្នុងការស្កេន (429 Quota Exceeded)។ សូមរង់ចាំប្រហែល 30 វិនាទី រួចព្យាយាមម្តងទៀត។"',
  'error: "ការស្កេនបរាជ័យ (429 Quota Exceeded): ប្រព័ន្ធ AI របស់អ្នកអស់កូតាប្រើប្រាស់ឥតគិតថ្លៃប្រចាំថ្ងៃ (Limit Reached)។ ដើម្បីប្រើប្រាស់មុខងារនេះឥតដែនកំណត់នៅលើ Vercel អ្នកត្រូវចូលទៅកាន់ Google AI Studio បង្កើត API Key ថ្មីដែលមានភ្ជាប់ Billing (Pay-as-you-go) រួចយកទៅដាក់ក្នុង Environment Variables របស់ Vercel ឈ្មោះ GEMINI_API_KEY។"'
);
fs.writeFileSync('api/extract-note.ts', code);

let code2 = fs.readFileSync('server.ts', 'utf8');
code2 = code2.replace(
  'error: "ប្រព័ន្ធ AI កំពុងមមាញឹក ឬអស់កូតាក្នុងការស្កេន (429 Quota Exceeded)។ សូមរង់ចាំប្រហែល 30 វិនាទី រួចព្យាយាមម្តងទៀត។"',
  'error: "ការស្កេនបរាជ័យ (429 Quota Exceeded): ប្រព័ន្ធ AI របស់អ្នកអស់កូតាប្រើប្រាស់ឥតគិតថ្លៃប្រចាំថ្ងៃ (Limit Reached)។ ដើម្បីប្រើប្រាស់មុខងារនេះឥតដែនកំណត់នៅលើ Vercel អ្នកត្រូវចូលទៅកាន់ Google AI Studio បង្កើត API Key ថ្មីដែលមានភ្ជាប់ Billing (Pay-as-you-go) រួចយកទៅដាក់ក្នុង Environment Variables របស់ Vercel ឈ្មោះ GEMINI_API_KEY។"'
);
fs.writeFileSync('server.ts', code2);
console.log("Patched error messages");
