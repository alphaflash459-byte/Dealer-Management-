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

      const prompt = `You are an AI assistant that extracts handwritten or printed notes about inventory transactions. The note could be in Khmer or English.
Extract the data into a structured JSON array.
Each item must have:
- 'productName' (string, extract exactly as written, translating to English is optional if it's clear, otherwise keep original text)
- 'quantity' (number)
- 'unit' (string, optional, like 'case', 'box', 'item')
- 'description' (string, optional, any extra notes for the item)${availableProductsStr}
Ensure the output is ONLY a valid JSON array matching the structure.
If you can't read an item clearly, skip it or put your best guess.
Do not wrap the JSON in markdown codeblocks like \`\`\`json. Return raw JSON.`;

      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
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
                      unit: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["productName", "quantity"]
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
