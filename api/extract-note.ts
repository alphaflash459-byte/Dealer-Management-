import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image, targetType, productNames } = req.body; 
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API Key is not configured in environment variables." });
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
  } catch (error) {
    console.error("AI Extraction Error:", error);
    res.status(500).json({ error: error.message || "Failed to process image" });
  }
}
