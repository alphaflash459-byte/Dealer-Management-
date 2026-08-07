const { GoogleGenAI } = require("@google/genai");

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = [
    "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-2.5-flash-lite",
    "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"
  ];
  
  for (const m of models) {
    try {
      const resp = await ai.models.generateContent({
        model: m,
        contents: "hi"
      });
      console.log(m, "WORKS!");
    } catch (e) {
      console.log(m, "FAILED:", e.message);
    }
  }
}
main();
