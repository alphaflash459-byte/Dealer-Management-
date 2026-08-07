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

      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
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

In the 'description' field, write: "លក់: [soldQuantity], ដូរ: [exchangedQuantity], ថែម: [promoQuantity]". IF there is an actual note/remark on this row in the image, APPEND it like this: "លក់: ..., ដូរ: ..., ថែម: ... | [Extracted Note]".
`;
      } else if (normalizedTargetType.includes('return') || targetType === 'Stock Return' || targetType === 'ស្តុកត្រឡប់') {
        typeSpecificInstructions = `
*** ABSOLUTE STRICT RULE FOR STOCK RETURN (ស្តុកត្រឡប់ / ត្រឡប់) ***
Your task is to extract the quantity of products being returned or left over.
Look for columns like "ស្តុកត្រឡប់", "ត្រឡប់", "សល់", "ស្តុកសល់", "ចំនួន", or "Returned".
Extract the number for each product row and put it EXACTLY into the 'quantity' field.
If the cell is blank, has a dash, or is empty, use 0.
DO NOT extract numbers from 'ស្តុកឡើងឡាន', 'ក្នុងឡាន', 'លក់'.
`;
      } else if (normalizedTargetType.includes('out') || targetType === 'Stock Out' || targetType === 'ស្តុកឡើងឡាន') {
        typeSpecificInstructions = `
*** ABSOLUTE STRICT RULE FOR STOCK OUT (ស្តុកឡើង / ស្តុកឡើងឡាន) ***
Your task is to extract the quantity of products being loaded or prepared.
Look for columns like "ស្តុកឡើង", "ចំនួនឡើង", "ស្តុកឡើងឡាន", "ក្នុងឡាន", "ចំនួន", or "Loaded".
Extract the number for each product row and put it EXACTLY into the 'quantity' field.
If the cell is blank, has a dash, or is empty, use 0.
DO NOT extract numbers from 'ចំនួនលក់', 'ស្តុកសល់', 'ត្រឡប់'.
`;
      }

      const prompt = `You are an expert data entry AI assistant. Your primary goal is to achieve 100% accuracy in extracting numerical values from the provided inventory document (handwritten or printed, Khmer or English).
Target Transaction Type: ${targetType || 'General'}
${typeSpecificInstructions}

CRITICAL RULES FOR ACCURACY:
1. NUMBERS ARE CRITICAL: Pay extreme attention to every digit. Carefully distinguish between similar-looking numbers (e.g., 1 and 7, 0 and 8, 5 and 6, 3 and 8). Double-check your reading against the column headers.
2. ROW ALIGNMENT: Read strictly row by row. Ensure the numbers you extract belong exactly to the product on that row.
3. KHMER NUMERALS & TEXT: Be aware that numbers might be written in Khmer numerals (១, ២, ៣, ៤, ៥, ៦, ៧, ៨, ៩, ០) or Arabic numerals. Convert any Khmer numerals to standard Arabic numbers in your JSON output.
4. Ignore noise, irrelevant text, or crossed-out items. Only extract valid product lines.
5. AGGREGATE DUPLICATES: If the same product appears multiple times, SUM the quantities together into a single item. NEVER output duplicate \`productName\`s.
6. EXACT MATCH: Map the product name to the provided list if possible. Pay close attention to extra words or suffixes.
7. NOTES/REMARKS (កំណត់សម្គាល់): Look for a column named "កំណត់សម្គាល់", "ផ្សេងៗ", "Note", or any extra text/remarks written next to a product. Extract this text!
7. NOTES/REMARKS (កំណត់សម្គាល់): Look for a column named "កំណត់សម្គាល់", "ផ្សេងៗ", "Note", or any extra text/remarks written next to a product. Extract this text!

Extract the data into a structured JSON array. Each item MUST have ALL of the following fields (if a value is missing or empty on the document, use 0 for numbers):
- \`productName\` (string, the name of the product)
- \`quantity\` (number, ALWAYS output a number. If none, use 0)
- \`soldQuantity\` (number, ALWAYS output a number. Extract from ចំនួនលក់. If none, use 0)
- \`exchangedQuantity\` (number, ALWAYS output a number. Extract from ដូរក្រវិល. If none, use 0)
- \`promoQuantity\` (number, ALWAYS output a number. Extract from ចំនួនថែម. If none, use 0)
- \`unit\` (string, optional, e.g., \`case\`, \`box\`)
- \`description\` (string, PUT ANY EXTRACTED NOTES/REMARKS HERE. If none, leave empty. For Stock Sold, follow its specific rule)${availableProductsStr}

Ensure the output is ONLY a valid JSON array matching the structure. Do not wrap the JSON in markdown codeblocks like \`\`\`json. Return raw JSON.`;

      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-pro-latest"];
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
                temperature: 0.1,
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
                    required: ["productName", "quantity", "soldQuantity", "exchangedQuantity", "promoQuantity"]
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
              console.log(`Rate limit / Quota reached for ${modelName}. Moving to next model if limit is 0, or waiting if it's transient...`);
              if (errStr.includes("limit: 0")) {
                  break; // Move to next model immediately
              }
              if (retries === 0) break;
              retries--;
              await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s instead of 10s to avoid timeout
              continue;
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
      
      let textResponse = response?.text || "[]";
      let parsed = [];
      try {
        // Clean markdown backticks if any
        textResponse = textResponse.replace(/^\s*```(json)?/m, '').replace(/```\s*$/m, '').trim();
        parsed = JSON.parse(textResponse);
      } catch(e) {
        console.error("Failed to parse JSON response:", textResponse);
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
