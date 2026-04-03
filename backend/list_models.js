import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI('AIzaSyCZBAf7mlccR1hezBRcKR5bGNx-OWUmeWg');

async function run() {
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCZBAf7mlccR1hezBRcKR5bGNx-OWUmeWg`);
    const json = await listRes.json();
    fs.writeFileSync('out_models_2.json', JSON.stringify(json, null, 2), 'utf8');
    console.log("Saved to out_models_2.json");
  } catch(e) {
    console.error("List Models Error:", e);
  }
}
run();
