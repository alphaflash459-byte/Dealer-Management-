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
        ? `\nHere is the list of available product names in the system:\n[${productNames.join(', ')}]\nWhen extracting the product name, please map it to the closest match from this list. If there is no good match, use the original text.`
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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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
      
      const textResponse = response.text || "[]";
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
