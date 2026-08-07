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
You must extract data for THREE SPECIFIC COLUMNS for every product row. 
Look at the table headers in the image and locate these three columns:
1. Column with header "ចំនួនលក់", "លក់", or "Sold" -> This is your 'soldQuantity'
2. Column with header "ដូរក្រវិល", "ក្រវិល", "ចំនួនដបប្រវិល", "ដូរ", or "Exchanged" -> This is your 'exchangedQuantity'
3. Column with header "ចំនួនថែម", "ថែម", "ជួនថែម", or "Promo" -> This is your 'promoQuantity'

For EACH product row, trace your eyes horizontally to these specific columns and extract the number. 
If the cell is blank, has a dash, or is empty, use 0.
You MUST output a number (even if 0) for ALL THREE fields: 'soldQuantity', 'exchangedQuantity', and 'promoQuantity'.

DO NOT mix them up.
DO NOT extract numbers from the "ស្តុកឡើងឡាន" (Loaded) or "ក្នុងឡាន" column.
DO NOT extract numbers from the "ស្តុកសល់" (Remaining) column.

In the 'description' field, write EXACTLY: "លក់: [soldQuantity], ដូរក្រវិល: [exchangedQuantity], ថែម: [promoQuantity]" using the actual extracted numbers.
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
            console.log(`Rate limit / Quota reached for ${modelName}, waiting 5 seconds...`);
            if (retries === 0) break;
            retries--;
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
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
          error: "ប្រព័ន្ធ AI កំពុងមមាញឹក ឬអស់កូតាក្នុងការស្កេន (429 Quota Exceeded)។ សូមរង់ចាំប្រហែល 30 វិនាទី រួចព្យាយាមម្តងទៀត។" 
        }), { status: 429, headers: { 'Content-Type': 'application/json' } });
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
