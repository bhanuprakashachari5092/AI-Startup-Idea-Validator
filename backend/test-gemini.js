import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function testModel(modelName) {
  try {
    console.log(`Testing ${modelName}:`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hi!");
    const response = await result.response;
    console.log(`SUCCESS for ${modelName}:`, response.text());
  } catch (err) {
    console.error(`FAIL for ${modelName}:`, err.message);
  }
}

async function run() {
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.5-pro"];
  for (const m of models) {
    try {
      await testModel(m);
    } catch (e) {}
  }
}

run();


