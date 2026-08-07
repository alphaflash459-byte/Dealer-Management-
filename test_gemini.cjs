const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: "AIzaSyB-Vm_fcJxb06GQ9a0QTX5LTW2o8JJdMXQ" });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "hello"
    });
    console.log(response.text);
  } catch(e) {
    console.error(e.message);
  }
}
run();
