import express from 'express';
import { MODEL_NAME, genAI } from '../config/gemini.js';
import { protect } from '../middleware/auth.js';
import Chat from '../models/Chat.js';

const router = express.Router();

// 💡 HELPER: GEMINI AI ENGINE
async function getGeminiStream(genAI, message, history, systemPrompt) {
    try {
        console.log(`[ENGINE] Connecting to ${MODEL_NAME}...`);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Combining system prompt with history/message for best results
        const chatHistory = [
            { role: 'user', parts: [{ text: `SYSTEM_INSTRUCTION: ${systemPrompt}` }] },
            { role: 'model', parts: [{ text: 'Understood. I will act as the SKU Team Startup Mentor.' }] },
            ...(history || []).slice(-10).map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content || '' }]
            }))
        ];

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessageStream(message);
        return { stream: result.stream };
    } catch (error) {
        console.error(`[ENGINE] Flash Encountered Error:`, error.message);
        throw error;
    }
}


// 💡 FETCH HISTORY 
router.get('/', protect, async (req, res) => {
    try {
        const history = await Chat.find({ user: req.user._id }).sort({ createdAt: 1 });
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: 'HISTORY_FETCH_FAIL' });
    }
});

// 💡 CLEAR HISTORY
router.delete('/clear', protect, async (req, res) => {
    try {
        await Chat.deleteMany({ user: req.user._id });
        res.json({ message: 'Clean slate achieved! 🧡' });
    } catch (e) {
        res.status(500).json({ error: 'CLEAR_FAIL' });
    }
});

// 💡 CHAT ENDPOINT (SSE STREAMING)
router.post('/', protect, async (req, res) => {
    try {
        const { message, history } = req.body;
        console.log(`--- Conversation Start [User: ${req.user.name}] ---`);

        await Chat.create({ user: req.user._id, role: 'user', content: message });

        const systemPrompt = `You are an elite Startup Evaluator AI.
Respond strictly in the user's detected language (use Hyderabadi Telugu Slang for Telugu, like "mawa", "mama", "baigan", "hau", "nakko". And Tapori for Hindi).

Your response MUST follow this strict Markdown structure:

### 🚀 Idea Summary & Feasibility
(Write 2 bold lines summarizing the idea and its overall feasibility. Keep it punchy!).

### 📊 Startup Metrics
| Metric | Assessment |
| --- | --- |
| **Feasibility Score** | (Score out of 10) |
| **Success Probability** | (Percentage %) |
| **Risk Percentage** | (Percentage %) |
| **Unrisk (Safety) Percentage** | (Percentage %) |

### 🔍 Deep Analysis
**Pros:**
* (Pro 1)
* (Pro 2)

**Cons / Risks:**
* (Risk 1)
* (Risk 2)

**Monetization Strategies:**
* (Strategy 1)
* (Strategy 2)

### ⚙️ Systematic Execution Flow
(Provide a concise step-by-step flow).
\`\`\`mermaid
graph TD;
    Start([Idea Validation]) --> B[Market Research];
    B --> C{Develop MVP?};
    C -- Yes --> D[Launch Beta];
    C -- No --> E[Pivot];
    D --> F([Scale Up]);
\`\`\`
(Customize the above mermaid chart entirely based on the user's specific startup idea. Use good professional labels).
`;

        // SSE Initialization
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Prevents proxy buffering

        const { stream } = await getGeminiStream(genAI, message, history, systemPrompt);
        console.log(`[ENGINE] Streaming active with Gemini Flash`);


        let fullText = "";
        for await (const chunk of stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullText += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        if (!fullText) {
            fullText = "Engine is silent. Possible system blockage or quota limit mawa! 🧡";
            res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
        }

        await Chat.create({ user: req.user._id, role: 'assistant', content: fullText });
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('--- CRITICAL RECOVERY TRIGGERED ---');
        console.error(error);
        
        let friendlyMsg = "Something broke in the matrix mawa! Please check your connection. 🧡🚦";
        const errMsg = error.message?.toLowerCase() || "";

        if (errMsg.includes('404')) friendlyMsg = "MODEL ERROR: Mawa, this model isn't supported. 🧡🔒";
        else if (errMsg.includes('400') && errMsg.includes('expired')) friendlyMsg = "EXPIRED KEY: Mawa, your API key is EXPIRED! Generate a new one. 🧡💀";
        else if (errMsg.includes('429')) friendlyMsg = "QUOTA OVER: Speed limit hit mawa! Try in 60 seconds. 🧡🚦";

        else if (errMsg.includes('401')) friendlyMsg = "KEY ERROR: Your Google API key is rejected mawa! 🧡🛡️";

        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
        }
        res.write(`data: ${JSON.stringify({ text: friendlyMsg })}\n\n`);
        res.end();
    }
});

// 💡 TRANSLATION (NON-STREAMING)
router.post('/translate', protect, async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        let promptPrefix = "";
        if (targetLanguage === "Telugu") {
            promptPrefix = `Translate the following text to Telugu using EXCLUSIVE HYDERABAD SLANG (Hyderabadi style). Use slang words like "mawa", "mama", "baigan", "hau", "nakko", "hallu", "ekku" etc. Ensure it sounds like a local Hyderabad startup mentor speaking: \n\n `;
        } else if (targetLanguage === "Hindi") {
            promptPrefix = `Translate to Hindi using TAPORI/MUMBAI/DELHI CONVERSATIONAL SLANG (like "bhai", "theek hai na", etc.). Ensure it sounds like a local mentor speaking: \n\n `;
        } else {
            promptPrefix = `Translate to ${targetLanguage} while keeping JSON/Mermaid code blocks intact: \n\n `;
        }

        const result = await model.generateContent(`${promptPrefix} ${text}`);
        const response = await result.response;
        res.json({ translatedText: response.text() });
    } catch (e) {
        res.status(500).json({ error: 'TRANSLATE_ERROR' });
    }
});

export default router;

