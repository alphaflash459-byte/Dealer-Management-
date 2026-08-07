import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json();
    const { image, targetType, productNames } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API Key is not configured in Vercel Environment Variables. Please add GEMINI_API_KEY in your Vercel Project Settings." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const ai = new GoogleGenAI({ 
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const availableProductsStr = productNames && productNames.length > 0 
      ? `\nHere is the exact list of available product names in the system:\n[${productNames.join(', ')}]\nCRITICAL: When extracting the product name, please map it EXACTLY to a name from this list. If the note says 'CBL ORD', you MUST map it to 'CBL ORD' (if it exists in the list) and NOT just 'CBL'. Pay close attention to extra words or suffixes. If there is no good match, use the original text.`
      : "";

    let typeSpecificInstructions = "";
    const normalizedTargetType = (targetType || '').toLowerCase();

    if (normalizedTargetType.includes('sold') || normalizedTargetType.includes('sell') || targetType === 'Stock Sold' || targetType === 'ស្តុកលក់ចេញ') {
      typeSpecificInstructions = `
*** ABSOLUTE STRICT RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ) ***
ការស្កេន សម្រាប់ លក់ចេញ ចាប់យកទិន្នន័យតែបី column គឺ ចំនួនលក់, ក្រវិល, និង ថែម។ ហាមច្រឡំ column ក្រវិល និង ថែម ដាច់ខាត! សូមពិនិត្យមើលក្បាល column អោយច្បាស់មុននឹងទាញយកទិន្នន័យ!
1. ចាប់យក ទិន្នន័យពី column "ចំនួនលក់" ឬ "លក់" ដាក់ក្នុង 'soldQuantity'
2. ចាប់យក ទិន្នន័យពី column "ដូរក្រវិល" ឬ "ក្រវិល" ដាក់ក្នុង 'exchangedQuantity' (បញ្ជាក់៖ កុំយកទិន្នន័យពី column ថែម មកដាក់ក្នុងនេះ)
3. ចាប់យក ទិន្នន័យពី column "ចំនួនថែម" ឬ "ថែម" ដាក់ក្នុង 'promoQuantity' (បញ្ជាក់៖ កុំយកទិន្នន័យពី column ក្រវិល មកដាក់ក្នុងនេះ)

For EACH product row, extract ONLY the numbers from these 3 columns.
If a cell is blank, has a dash, or is empty, use 0.
You MUST output a number (even if 0) for ALL THREE fields: 'soldQuantity', 'exchangedQuantity', and 'promoQuantity'.

DO NOT extract numbers from any other columns (e.g., ignore "ស្តុកឡើងឡាន", "ក្នុងឡាន", "ស្តុកសល់", etc.).

In the 'description' field, write EXACTLY: "លក់: [soldQuantity], ក្រវិល: [exchangedQuantity], ថែម: [promoQuantity]" using the actual extracted numbers.
`;
    } else if (normalizedTargetType.includes('return') || targetType === 'Stock Return' || targetType === 'ស្តុកត្រឡប់') {
      typeSpecificInstructions = `
INSTRUCTIONS FOR STOCK RETURN (ស្តុកត្រឡប់):
Extract only the returned stock quantity (ស្តុកត្រឡប់ / ត្រឡប់).
`;
    } else if (normalizedTargetType.includes('out') || targetType === 'Stock Out' || targetType === 'ស្តុកឡើងឡាន') {
      typeSpecificInstructions = `
INSTRUCTIONS FOR STOCK OUT (ស្តុកឡើង / ស្តុកឡើងឡាន):
Extract only the loaded stock quantity (ស្តុកឡើង / ចំនួនឡើង).
`;
    }

    const prompt = `You are an expert data entry AI assistant. Extract inventory transactions from the provided image (handwritten or printed, Khmer or English).
Target Transaction Type: ${targetType || 'General'}
${typeSpecificInstructions}

CRITICAL RULES:
1. Ignore noise, irrelevant text, or crossed-out items. Only extract valid product lines.
2. AGGREGATE DUPLICATES: If the same product appears multiple times, SUM the quantities together into a single item. NEVER output duplicate \`productName\`s.
3. EXACT MATCH: Map the product name to the provided list if possible. Pay close attention to extra words or suffixes.

Extract the data into a structured JSON array. Each item must have:
- \`productName\` (string, the name of the product)
- \`quantity\` (number, the primary quantity. For Stock Sold, DO NOT calculate this, leave it 0 or omit it)
- \`soldQuantity\` (number, required for Stock Sold. Extract from ចំនួនលក់)
- \`exchangedQuantity\` (number, required for Stock Sold. Extract from ដូរក្រវិល)
- \`promoQuantity\` (number, required for Stock Sold. Extract from ចំនួនថែម)
- \`unit\` (string, optional, e.g., \`case\`, \`box\`)
- \`description\` (string, optional, any extra notes for the item)
${availableProductsStr}

Ensure the output is ONLY a valid JSON array matching the structure. If you can't read an item clearly, skip it or put your best guess. Do not wrap the JSON in markdown codeblocks like \`\`\`json. Return raw JSON.`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    
    let response;
    let lastError = null;

    for (const modelName of modelsToTry) {
      let retries = 2;
      while (retries >= 0) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data
                  }
                },
                { text: prompt }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    soldQuantity: { type: Type.NUMBER },
                    exchangedQuantity: { type: Type.NUMBER },
                    promoQuantity: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["productName", "soldQuantity", "exchangedQuantity", "promoQuantity"]
                }
              }
            }
          });
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          const errStr = (e.message || "") + " " + JSON.stringify(e);
          console.log(`Gemini API Error on ${modelName} (retries left: ${retries}):`, e.message || e);
          
          const isRateLimit = e.status === 429 || e.status === "RESOURCE_EXHAUSTED" || errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED");
          const isUnavailable = e.status === "UNAVAILABLE" || errStr.includes("503");

          if (isRateLimit) {
            console.log(`Rate limit / Quota reached for ${modelName}`);
            break; // Fail fast for this model, try next one
          }

          if (retries === 0 || !isUnavailable) {
            break;
          }
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      if (response) {
        break;
      }
    }

    if (!response && lastError) {
      const errStr = (lastError.message || "") + " " + JSON.stringify(lastError);
      if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
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
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const textResponse = response?.text || "[]";
    let parsed = [];
    try {
      parsed = JSON.parse(textResponse);
    } catch(e) {
      // failed
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to process image" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
