import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
export const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export default genAI;

