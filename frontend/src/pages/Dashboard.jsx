import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 💎 ULTRA-STABLE CHAT BUBBLE
 */
import mermaid from "mermaid";

// Initialize Mermaid for dark mode
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
        primaryColor: '#ff7a00',
        primaryTextColor: '#fff',
        primaryBorderColor: '#ff7a00',
        lineColor: '#ff7a00',
        secondaryColor: '#006100',
        tertiaryColor: '#fff',
    }
});

const MermaidChart = ({ chart }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && chart) {
            // Clear existing content to avoid duplicate rendering
            ref.current.innerHTML = "";
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            
            try {
                mermaid.render(id, chart).then(({ svg }) => {
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                    }
                });
            } catch (err) {
                console.error("Mermaid Render Error", err);
                ref.current.innerHTML = "<p class='text-red-500'>Mawa! Flow logic too complex for simple visual. Check code above.</p>";
            }
        }
    }, [chart]);

    return (
        <div className="my-8 p-6 bg-black/40 rounded-3xl border border-white/5 overflow-x-auto flex justify-center">
            <div ref={ref} className="mermaid-container w-full" />
        </div>
    );
};

const ChatMessage = ({ msg }) => {
    const isUser = msg.role === "user";
    // Important: Use msg.content directly if not translating to avoid sync issues
    const [translatedContent, setTranslatedContent] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [currentMode, setCurrentMode] = useState("Original");
    
    // Reset translation if original content changes (rare but good for safety)
    useEffect(() => {
        setTranslatedContent(null);
        setCurrentMode("Original");
    }, [msg.content]);

    const displayContent = translatedContent || msg.content || "";

    const handleSpeak = () => {
        if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
        const cleanText = displayContent.replace(/[#*`_]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = currentMode === "Telugu" ? "te-IN" : currentMode === "Hindi" ? "hi-IN" : "en-US";
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const handleTranslate = async (target) => {
        if (isUser) return;
        setIsTranslating(true);
        setShowLangMenu(false);
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.post(
                "https://ai-startup-idea-validator-pzwh.onrender.com/api/chat/translate",
                { text: msg.content, targetLanguage: target },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.translatedText) {
                setTranslatedContent(res.data.translatedText);
                setCurrentMode(target);
            }
        } catch (e) {
            console.error("Trans Error", e);
            alert("Mawa! Translation slow. Retry once or re-login if sessions are messy.");
        } finally {
            setIsTranslating(false);
        }
    };

    const renderContent = (text) => {
        if (!text) return <span className="opacity-20 italic">Generating neural response...</span>;
        
        if (text.includes("```mermaid")) {
            const parts = text.split(/```mermaid([\s\S]*?)```/);
            return parts.map((part, i) => {
                if (i % 2 === 1) {
                    return (
                        <div key={i} className="flex flex-col gap-2">
                             <MermaidChart chart={part.trim()} />
                             <details className="mb-4">
                                <summary className="text-[8px] opacity-20 cursor-pointer hover:opacity-50 uppercase tracking-widest">Show Logic Source</summary>
                                <div className="mt-2 p-4 bg-black/80 rounded-xl border border-orange-500/10 text-[10px] text-orange-400 font-mono">
                                    <pre className="overflow-x-auto">{part.trim()}</pre>
                                </div>
                             </details>
                        </div>
                    );
                }
                return <p key={i} className="whitespace-pre-wrap leading-relaxed mb-4 text-gray-200">{part}</p>;
            });
        }
        return <p className="whitespace-pre-wrap leading-relaxed text-gray-200">{text}</p>;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }} 
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className={`flex ${isUser ? "justify-end" : "justify-start"} mb-10 last:mb-0 relative group`}
        >
            <div className={`max-w-[92%] md:max-w-[75%] px-7 py-5 rounded-[2rem] relative backdrop-blur-3xl transition-all duration-500 shadow-2xl border ${
                isUser 
                ? "bg-gradient-to-tr from-[#ff7a00] to-[#e11d48] text-white rounded-br-none border-white/10 shadow-[0_10px_40px_-15px_rgba(255,122,0,0.4)]" 
                : "bg-[#0f0f0f]/90 border-white/10 rounded-bl-none ring-1 ring-white/5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
            }`}>
                <div className="text-sm md:text-base font-semibold leading-relaxed tracking-wide">{renderContent(displayContent)}</div>

                {!isUser && !isTranslating && displayContent && (
                    <div className="absolute -top-7 right-6 flex items-center bg-[#111111] border border-white/10 rounded-full px-3 py-1 shadow-2xl backdrop-blur-3xl ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                            <button onClick={() => setShowLangMenu(!showLangMenu)} className="p-1 hover:bg-white/5 rounded-full text-lg">🌐</button>
                            <AnimatePresence>
                                {showLangMenu && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                        className="absolute bottom-full mb-3 right-0 bg-[#0d0d0d] border border-white/10 rounded-xl p-1 shadow-2xl z-[70] min-w-[120px]"
                                    >
                                        <button onClick={() => handleTranslate("Telugu")} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-[#ff7a00] hover:bg-white/5 rounded-lg text-center">Telugu</button>
                                        <button onClick={() => handleTranslate("English")} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-blue-400 hover:bg-white/5 rounded-lg border-t border-white/5 text-center">English</button>
                                        <button onClick={() => handleTranslate("Hindi")} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-green-400 hover:bg-white/5 rounded-lg border-t border-white/5 text-center">Hindi</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="w-[1px] h-3 bg-white/10 mx-2"></div>
                        <button onClick={handleSpeak} className="p-1 hover:bg-white/5 rounded-full text-lg">
                            {isSpeaking ? "🛑" : "🔊"}
                        </button>
                    </div>
                )}

                <div className={`absolute -bottom-7 flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.4em] opacity-20 ${isUser ? "right-4" : "left-4"}`}>
                    {isUser ? "Neural Thought" : `Mentor Logic / ${currentMode}`}
                    {isTranslating && <span className="ml-2 animate-spin text-orange-500 font-bold">⚡</span>}
                </div>
            </div>
        </motion.div>
    );
};

const Dashboard = () => {
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 💡 FETCH HISTORY FROM DB ON MOUNT
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await axios.get("https://ai-startup-idea-validator-pzwh.onrender.com/api/chat", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data || []);
            } catch (err) {
                console.error("History fetch fail:", err);
            }
        };
        fetchHistory();
    }, []);


    useEffect(() => {
        scrollToBottom();
    }, [history, streamingContent, isLoading]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim() || isLoading) return;

        const currentInput = message;
        setHistory(prev => [...prev, { role: "user", content: currentInput }]);
        setMessage("");
        setIsLoading(true);
        setStreamingContent("");
        setError("");

        try {
            const token = sessionStorage.getItem("token");
            const response = await fetch("https://ai-startup-idea-validator-pzwh.onrender.com/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ message: currentInput, history: history })
            });

            if (response.status === 401) {
                throw new Error("Mawa! Session expired. Please logout and login again! 🧡");
            }
            if (!response.ok) throw new Error("Connection unstable.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                
                // Keep the last partial line in the buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
                    
                    const dataStr = trimmedLine.replace("data: ", "").trim();
                    if (dataStr === "[DONE]") { break; }
                    
                    try {
                        const dataObj = JSON.parse(dataStr);
                        if (dataObj.text) {
                            fullText += dataObj.text;
                            setStreamingContent(fullText);
                        }
                    } catch (error) {
                        console.error("JSON parse error on line:", trimmedLine, error);
                    }

                }
            }
            // CRITICAL: Ensure fullText is not empty before adding to history
            const finalReply = fullText || "Mawa! Something went wrong in the core. Please try again! 🧡";
            setHistory(prev => [...prev, { role: "assistant", content: finalReply }]);
            setStreamingContent("");
        } catch (err) { 
            console.error(err);
            setError(err.message || "Connection unstable."); 
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#000000] text-white font-sans overflow-hidden font-bold">
            <header className="fixed top-16 left-0 right-0 h-16 bg-black/80 backdrop-blur-3xl border-b border-white/5 flex items-center px-8 z-50 justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ff7a00] flex items-center justify-center font-black text-xl shadow-[0_0_20px_#ff7a0040]">SKU</div>
                    <h2 className="font-black text-[10px] tracking-[-0.05em] uppercase">NEURAL CORE <span className="text-[#ff7a00]">FLASH LATEST</span></h2>
                </div>

                <div className="flex items-center gap-4">
                     <button 
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to clear the neural history, mawa? 💥")) {
                                try {
                                    const token = sessionStorage.getItem("token");
                                    await axios.delete("https://ai-startup-idea-validator-pzwh.onrender.com/api/chat/clear", {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    setHistory([]);
                                } catch (e) { console.error("Clear fail", e); }
                            }
                        }}
                        className="px-4 py-1.5 rounded-full border border-red-500/30 text-[8px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                     >
                         Clear Neural Core
                     </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto mt-16 scrollbar-hide py-10">
                <div className="max-w-5xl mx-auto pb-48 px-10">
                    <AnimatePresence>
                        {history.length === 0 && !isLoading && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full flex flex-col items-center justify-center py-40"
                            >
                                 <div className="relative mb-12">
                                     <div className="text-9xl mb-4 opacity-40 filter drop-shadow-[0_0_30px_rgba(255,122,0,0.3)]">🧠</div>
                                     <motion.div 
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute inset-0 bg-primary/20 rounded-full blur-3xl -z-10"
                                     />
                                 </div>
                                 
                                 <h3 className="text-6xl font-black tracking-[-0.04em] uppercase text-center leading-none">
                                     STRATEGIC MENTOR <br />
                                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">INITIALIZED.</span>
                                 </h3>
                                 <p className="text-[9px] text-[#ff7a00] uppercase tracking-[0.6em] mt-8 font-black border-t border-white/5 pt-8 animate-pulse italic">
                                     PRECISION ANALYTICS & MARKET LOGIC ACTIVE
                                 </p>
                            </motion.div>
                        )}
                        {history.map((msg, index) => (
                            <ChatMessage key={index} msg={msg} />
                        ))}
                        {streamingContent && (
                            <ChatMessage msg={{ role: "assistant", content: streamingContent }} />
                        )}
                         {isLoading && !streamingContent && (
                            <div className="flex justify-start py-8">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#0d0d0d] px-10 py-6 rounded-3xl border border-white/10 flex items-center gap-6 shadow-2xl ring-1 ring-white/5"
                                >
                                     <div className="flex gap-2">
                                         <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#ff7a00]"></div>
                                         <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse [animation-delay:0.2s] shadow-[0_0_10px_#ff7a00]"></div>
                                         <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse [animation-delay:0.4s] shadow-[0_0_10px_#ff7a00]"></div>
                                     </div>
                                     <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40 italic">Strategy Engine Handshaking...</span>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/90 to-transparent z-50 pt-24 text-center">
                {error && <div className="text-red-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4 animate-pulse">{error}</div>}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto relative group"
                >
                    {/* Layer 1: Base Ambient Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ff7a00] to-[#f43f5e] rounded-full blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
                    
                    {/* Layer 2: Ultra-Bright Moving Highlight (Professional Neon) */}
                    <motion.div 
                        animate={{ 
                            background: [
                                "radial-gradient(circle at 0% 50%, rgba(255,122,0,0.4) 0%, transparent 50%)",
                                "radial-gradient(circle at 100% 50%, rgba(244,63,94,0.4) 0%, transparent 50%)",
                                "radial-gradient(circle at 0% 50%, rgba(255,122,0,0.4) 0%, transparent 50%)"
                            ]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full -z-10 blur-2xl"
                    />

                    {/* Main Container */}
                    <div className={`relative flex items-center gap-4 bg-black/60 border-2 transition-all duration-500 rounded-full py-4 px-6 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ${
                        message.trim() 
                        ? "border-[#ff7a00] shadow-[0_0_30px_rgba(255,122,0,0.3)] ring-1 ring-[#ff7a00]/20" 
                        : "border-white/10 hover:border-white/20 focus-within:border-[#ff7a00]/50"
                    }`}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
                            placeholder="Type your neural request..."
                            className="flex-1 bg-transparent outline-none text-white text-xl placeholder-white/10 font-bold tracking-tight"
                            disabled={isLoading}
                        />
                        
                        <div className="flex items-center gap-3">
                            <AnimatePresence>
                                {message.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.5, x: 20 }}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff7a00] px-4 py-1 bg-[#ff7a00]/10 rounded-full border border-[#ff7a00]/20"
                                    >
                                        Ready
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <button 
                                onClick={handleSendMessage}
                                disabled={isLoading || !message.trim()}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative group/btn ${
                                    message.trim() && !isLoading 
                                    ? "bg-gradient-to-br from-[#ff7a00] to-[#f43f5e] shadow-[0_0_30px_rgba(255,122,0,0.5)] scale-110" 
                                    : "bg-white/5 grayscale opacity-30 cursor-not-allowed"
                                }`}
                            >
                                {/* Button Internal Glow */}
                                {message.trim() && (
                                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping pointer-events-none" />
                                )}
                                <span className="text-2xl relative z-10">⚡</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
