const { GoogleGenAI } = require("@google/genai");
async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.list();
  console.log(response.pageInternal.map(m => m.name).join(", "));
}
main();
