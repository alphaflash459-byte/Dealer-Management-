import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  // API Route for AI Extraction
  app.post("/api/extract-note", async (req, res) => {
    try {
      const { image, targetType, productNames } = req.body; // targetType could be 'loading', 'selling', 'returning'
      
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
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
CRITICAL RULE FOR STOCK SOLD (ស្តុកលក់ / ស្តុកលក់ចេញ):
You must extract the OUTGOING stock. The table has several numeric columns. YOU MUST EXAMINE THE COLUMN HEADERS CAREFULLY.
- EXTRACT from "ចំនួនលក់" (Sold) -> put in 'soldQuantity'
- EXTRACT from "ដូរក្រវិល" / "ចំនួនដបប្រវិល" (Exchanged/Ring pull) -> put in 'exchangedQuantity'
- EXTRACT from "ចំនួនថែម" / "ជួនថែម" / "ថែម" (Promo/Free) -> put in 'promoQuantity'

VISUAL GUIDE for the table layout (Left to Right):
1. First numeric column is often "ក្នុងឡាន" or "ស្តុកឡើង" (Loaded Stock). -> DO NOT EXTRACT (Ignore this!)
2. Second numeric column is often "ចំនួនដបប្រវិល" / "ដូរក្រវិល". -> Put in 'exchangedQuantity'
3. Third numeric column is often "ចំនួនលក់" (Sold). -> Put in 'soldQuantity'
4. Other columns might be "ថែម" (Promo) -> Put in 'promoQuantity'
5. Towards the right is "ចំនួនសល់" (Remaining Stock). -> DO NOT EXTRACT (Ignore this!)

Example: If a row has 127 in column 1, 4 in column 2, 15 in column 3, and 108 in column 5.
Then 'exchangedQuantity' = 4, 'soldQuantity' = 15, and 'promoQuantity' = 0.
IGNORE 127 and 108 completely!

In the 'description', write EXACTLY: "លក់: [val], ដូរក្រវិល: [val], ថែម: [val]" using only non-zero values.
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
- \`description\` (string, optional, any extra notes for the item)${availableProductsStr}

Ensure the output is ONLY a valid JSON array matching the structure. If you can't read an item clearly, skip it or put your best guess. Do not wrap the JSON in markdown codeblocks like \`\`\`json. Return raw JSON.`;

      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"];
      let response;
      let lastError: any = null;

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
                    required: ["productName"]
                  }
                }
              }
            });
            lastError = null;
            break; // Success
          } catch (e: any) {
            lastError = e;
            const errStr = (e.message || "") + " " + JSON.stringify(e);
            console.error(`Gemini API Error on ${modelName} (retries left: ${retries}):`, e.message || e);
            
            const isRateLimit = e.status === 429 || e.status === "RESOURCE_EXHAUSTED" || errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED");
            const isUnavailable = e.status === "UNAVAILABLE" || errStr.includes("503");

            if (isRateLimit) {
              console.log(`Rate limit / Quota reached for ${modelName}, switching to next model...`);
              break; // Try next model immediately
            }

            if (retries === 0 || !isUnavailable) {
              break; // Try next model
            }
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        if (response) {
          break; // Successfully got response
        }
      }

      if (!response && lastError) {
        const errStr = (lastError.message || "") + " " + JSON.stringify(lastError);
        if (errStr.includes("429") || errStr.includes("Quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
          return res.status(429).json({ 
            success: false,
            error: "ប្រព័ន្ធ AI កំពុងមមាញឹក ឬអស់កូតាក្នុងការស្កេន (429 Quota Exceeded)។ សូមរង់ចាំប្រហែល 30 វិនាទី រួចព្យាយាមម្តងទៀត។" 
          });
        }
        return res.status(500).json({
          success: false,
          error: lastError.message || "Failed to process image"
        });
      }
      
      const textResponse = response?.text || "[]";
      let parsed = [];
      try {
        parsed = JSON.parse(textResponse);
      } catch(e) {
        // failed
      }
      
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error("AI Extraction Error:", error);
      res.status(500).json({ error: error.message || "Failed to process image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support Express v5 which requires *all or similar depending on version, wait, package json has express 4.21
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
