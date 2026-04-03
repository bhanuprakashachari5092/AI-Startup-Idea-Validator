import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const MODEL_NAME = "gemini-1.5-flash"; // Or use "gemini-pro"
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

const runTest = async () => {
    try {
        console.log(`Sending Request to: ${URL.substring(0, 50)}...`);
        const res = await axios.post(URL, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("SUCCESS RESPONSE:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("HTTP ERROR:", err.response?.status, err.response?.statusText);
        console.error("DATA:", JSON.stringify(err.response?.data, null, 2));
    }
}

runTest();
