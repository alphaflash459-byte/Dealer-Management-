const fs = require('fs');

// Patch api/extract-note.ts
let code = fs.readFileSync('api/extract-note.ts', 'utf8');
const oldErrHandling = `      if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
        return new Response(JSON.stringify({ 
          success: false,
          error: "ការស្កេនបរាជ័យ (429 Quota Exceeded): ប្រព័ន្ធ AI របស់អ្នកអស់កូតាប្រើប្រាស់ឥតគិតថ្លៃប្រចាំថ្ងៃ (Limit Reached)។ ដើម្បីប្រើប្រាស់មុខងារនេះឥតដែនកំណត់នៅលើ Vercel អ្នកត្រូវចូលទៅកាន់ Google AI Studio បង្កើត API Key ថ្មីដែលមានភ្ជាប់ Billing (Pay-as-you-go) រួចយកទៅដាក់ក្នុង Environment Variables របស់ Vercel ឈ្មោះ GEMINI_API_KEY។" 
        }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        success: false,
        error: lastError.message || "Failed to process image"
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });`;

const newErrHandling = `      if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
        return new Response(JSON.stringify({ 
          success: false,
          error: "ការស្កេនបរាជ័យ (429 Quota Exceeded): ប្រព័ន្ធ AI របស់អ្នកអស់កូតាប្រើប្រាស់ឥតគិតថ្លៃប្រចាំថ្ងៃ (Limit Reached)។ ដើម្បីប្រើប្រាស់មុខងារនេះឥតដែនកំណត់នៅលើ Vercel អ្នកត្រូវចូលទៅកាន់ Google AI Studio បង្កើត API Key ថ្មីដែលមានភ្ជាប់ Billing (Pay-as-you-go) រួចយកទៅដាក់ក្នុង Environment Variables របស់ Vercel ឈ្មោះ GEMINI_API_KEY។" 
        }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      if (errStr.includes("503") || errStr.includes("UNAVAILABLE")) {
        return new Response(JSON.stringify({ 
          success: false,
          error: "ប្រព័ន្ធ AI កំពុងមានអ្នកប្រើប្រាស់ច្រើន (503 High Demand)។ សូមរង់ចាំបន្តិច រួចព្យាយាមម្តងទៀត។" 
        }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        success: false,
        error: lastError.message || "Failed to process image"
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });`;

if (code.includes('error: "ការស្កេនបរាជ័យ (429 Quota Exceeded)')) {
  code = code.replace(oldErrHandling, newErrHandling);
  fs.writeFileSync('api/extract-note.ts', code);
  console.log('Patched api/extract-note.ts');
}

// Patch server.ts
let code2 = fs.readFileSync('server.ts', 'utf8');
const oldErrHandling2 = `        if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
          return res.status(429).json({ 
             success: false,
            error: "ការស្កេនបរាជ័យ (429 Quota Exceeded): ប្រព័ន្ធ AI របស់អ្នកអស់កូតាប្រើប្រាស់ឥតគិតថ្លៃប្រចាំថ្ងៃ (Limit Reached)។ ដើម្បីប្រើប្រាស់មុខងារនេះឥតដែនកំណត់នៅលើ Vercel អ្នកត្រូវចូលទៅកាន់ Google AI Studio បង្កើត API Key ថ្មីដែលមានភ្ជាប់ Billing (Pay-as-you-go) រួចយកទៅដាក់ក្នុង Environment Variables របស់ Vercel ឈ្មោះ GEMINI_API_KEY។" 
           });
        }
        return res.status(500).json({
          success: false,
          error: lastError.message || "Failed to process image"
        });`;

const newErrHandling2 = `        if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
          return res.status(429).json({ 
             success: false,
            error: "ការស្កេនបរាជ័យ (429 Quota Exceeded): ប្រព័ន្ធ AI របស់អ្នកអស់កូតាប្រើប្រាស់ឥតគិតថ្លៃប្រចាំថ្ងៃ (Limit Reached)។ ដើម្បីប្រើប្រាស់មុខងារនេះឥតដែនកំណត់នៅលើ Vercel អ្នកត្រូវចូលទៅកាន់ Google AI Studio បង្កើត API Key ថ្មីដែលមានភ្ជាប់ Billing (Pay-as-you-go) រួចយកទៅដាក់ក្នុង Environment Variables របស់ Vercel ឈ្មោះ GEMINI_API_KEY។" 
           });
        }
        if (errStr.includes("503") || errStr.includes("UNAVAILABLE")) {
          return res.status(503).json({ 
             success: false,
            error: "ប្រព័ន្ធ AI កំពុងមានអ្នកប្រើប្រាស់ច្រើន (503 High Demand)។ សូមរង់ចាំបន្តិច រួចព្យាយាមម្តងទៀត។" 
           });
        }
        return res.status(500).json({
          success: false,
          error: lastError.message || "Failed to process image"
        });`;

if (code2.includes('error: "ការស្កេនបរាជ័យ (429 Quota Exceeded)')) {
  code2 = code2.replace(oldErrHandling2, newErrHandling2);
  fs.writeFileSync('server.ts', code2);
  console.log('Patched server.ts');
}

