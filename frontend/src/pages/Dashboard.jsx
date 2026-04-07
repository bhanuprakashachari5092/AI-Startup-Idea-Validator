import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import mermaid from "mermaid";

const API_URL = import.meta.env.VITE_API_URL || "https://ai-startup-idea-validator-pzwh.onrender.com";

mermaid.initialize({
    startOnLoad: false, // Better control with manual render
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
    parseError: (err) => console.log("Mermaid silenced mawa! 🧡🚦🥧", err), // Prevent global error injection
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
    themeVariables: { 
        primaryColor: '#ff7a00', 
        primaryTextColor: '#fff',
        primaryBorderColor: '#ff7a00',
        lineColor: '#52525b',
        secondaryColor: '#27272a',
        tertiaryColor: '#18181b'
    }
});

const MetricsGauge = ({ value, label }) => {
    const percentage = parseInt(value) || 0;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-[#0c0c0e] rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff7a00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                <circle cx="50%" cy="50%" r={radius} fill="transparent" stroke="rgba(255,122,0,0.1)" strokeWidth="8" />
                <motion.circle 
                    cx="50%" cy="50%" r={radius} 
                    fill="transparent" 
                    stroke="url(#gauge-gradient)" 
                    strokeWidth="8" 
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff7a00" />
                        <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl md:text-3xl font-black text-white">{percentage}%</motion.span>
                <span className="text-[8px] uppercase tracking-tighter text-zinc-500 font-bold">{label}</span>
            </div>
        </div>
    );
};

const MermaidChart = ({ chart }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current && chart) {
            let cleanedChart = chart.trim();
            const sanitizeChart = (chartText) => {
                let text = chartText.trim();
                if (text.toLowerCase().startsWith("graph")) { text = text.replace(/^graph\s+/i, "flowchart "); }
                if (text.toLowerCase().startsWith("pie")) { text = text.split('\n').map(line => line.includes(':') ? line.replace(/%/g, '') : line).join('\n'); }
                text = text.replace(/;$/gm, "");
                const validHeaders = ["flowchart", "graph", "pie", "sequenceDiagram", "gantt", "classDiagram", "stateDiagram", "erDiagram", "journey", "gitGraph", "mindmap", "timeline", "sankey-beta"];
                if (!validHeaders.some(h => text.toLowerCase().startsWith(h))) { text = "flowchart TD\n" + text; }
                return text;
            };

            const doRender = (textToRender, isRetry = false) => {
                const id = `chart_${Date.now()}_${isRetry ? 'retry' : 'init'}`;
                mermaid.render(id, textToRender)
                    .then(({ svg }) => { if (ref.current) ref.current.innerHTML = svg; })
                    .catch((err) => {
                        if (!isRetry) {
                            const superCleaned = textToRender.replace(/\[\(|\[\{|\[\[\(/g, '["').replace(/\)\]|\}\]|\)\]\]/g, '"]').replace(/\|.*?\|/g, '').replace(/[(){}]/g, '');
                            doRender(sanitizeChart(superCleaned), true);
                        } else if (ref.current) {
                            ref.current.innerHTML = `<div class="text-[10px] text-red-500/80 p-4 text-center">Syntax Miss. mawa! 🚦</div>`;
                        }
                    });
            };

            ref.current.innerHTML = `<div class="animate-pulse text-zinc-500 text-[10px] py-4 text-center">Rendering...</div>`;
            const timer = setTimeout(() => { doRender(sanitizeChart(cleanedChart)); }, 50);
            return () => clearTimeout(timer);
        }
    }, [chart]);

    return (
        <motion.div 
            whileHover={{ scale: 1.02, rotateY: 2, rotateX: 2 }}
            className="my-8 p-6 md:p-10 bg-[#0c0c0e]/80 rounded-[2rem] border border-white/5 overflow-x-auto flex flex-col items-center shadow-2xl backdrop-blur-xl transition-all cursor-crosshair"
        >
            <div ref={ref} className="mermaid-container w-full flex justify-center scale-90 md:scale-100" />
        </motion.div>
    );
};

const ChatMessage = ({ msg }) => {
    const isUser = msg.role === "user";
    const [translatedContent, setTranslatedContent] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [currentMode, setCurrentMode] = useState("Original");
    
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
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/api/chat/translate`, { text: msg.content, targetLanguage: target }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.translatedText) {
                setTranslatedContent(res.data.translatedText);
                setCurrentMode(target);
            }
        } catch (e) {
            alert("Translation failed. Please try again.");
        } finally {
            setIsTranslating(false);
        }
    };

    const renderContent = (text) => {
        if (!text) return <span className="opacity-50">Generating response...</span>;
        
        // DYNAMIC GAUGE DETECTION: If text contains a percentage like "Success Probability: 85%"
        const successMatch = text.match(/Success Probability.*?(\d+)%/i);
        const successVal = successMatch ? successMatch[1] : null;

        const renderedText = text.includes("```mermaid") 
            ? text.split(/```mermaid([\s\S]*?)```/)
            : [text];

        return (
            <div className="flex flex-col gap-6">
                {successVal && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center my-4">
                        <MetricsGauge value={successVal} label="Success Probability mawa! 🚀" />
                    </motion.div>
                )}
                {renderedText.map((part, i) => {
                    const trimmed = part.trim();
                    if (text.includes("```mermaid") && i % 2 === 1) return (
                        <div key={`chart-${i}`} className="mt-4 mb-4 w-full perspective-1000">
                            <div className="flex items-center gap-2 mb-3 ml-2 opacity-60">
                                <div className="w-1.5 h-1.5 bg-[#ff7a00] rounded-full animate-ping"></div>
                                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#ff7a00]">Dynamic Intel</span>
                            </div>
                            <MermaidChart chart={trimmed} />
                        </div>
                    );
                    if (!trimmed) return null;
                    return <div key={`text-${i}`} className="whitespace-pre-wrap leading-relaxed text-gray-300 text-sm md:text-base selection:bg-[#ff7a00] selection:text-black">{trimmed}</div>;
                })}
            </div>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isUser ? "justify-end" : "justify-start"} mb-12 md:mb-16 relative group w-full`}
        >
            <div className={`max-w-[92%] md:max-w-[85%] lg:max-w-[70%] px-6 py-6 md:px-8 md:py-7 rounded-[2.5rem] relative transition-all duration-500 shadow-2xl ${
                isUser 
                ? "bg-gradient-to-br from-[#ff7a00] to-[#f43f5e] text-white rounded-br-none shadow-orange-500/10 ring-1 ring-white/10" 
                : "bg-[#0c0c0e] border border-white/5 rounded-bl-none shadow-[#000]/60 ring-1 ring-white/5"
            }`}>
                {/* ROLE INDICATOR */}
                <div className={`absolute -top-3 ${isUser ? "right-6" : "left-6"} px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg border z-10 ${
                    isUser ? "bg-white text-orange-600 border-orange-200" : "bg-black/50 text-gray-400 border-white/10"
                }`}>
                    {isUser ? "Founder" : "AI Mentor"}
                </div>

                <div className="font-normal leading-relaxed text-sm md:text-base">{renderContent(displayContent)}</div>

                {!isUser && displayContent && (
                    <div className={`absolute -top-4 right-4 flex items-center transition-all duration-300 z-10 ${isTranslating ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        {isTranslating ? (
                            <motion.div 
                                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-white/5 bg-zinc-950 shadow-xl flex items-center justify-center p-1.5"
                            >
                                <div className="w-full h-full rounded-full bg-[#ff7a00]/20 animate-pulse" />
                            </motion.div>
                        ) : (
                            <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl px-2 py-1 shadow-2xl backdrop-blur-md">
                                <div className="relative">
                                    <button onClick={() => setShowLangMenu(!showLangMenu)} className="p-1.5 hover:text-[#ff7a00] text-xs transition-colors rounded-lg hover:bg-white/5">🌐</button>
                                    <AnimatePresence>
                                        {showLangMenu && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute bottom-full mb-3 right-0 bg-black/90 border border-white/10 rounded-xl py-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[120px] overflow-hidden"
                                            >
                                                {["Telugu", "English", "Hindi"].map(lang => (
                                                    <button key={lang} onClick={() => handleTranslate(lang)} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#ff7a00] hover:text-white text-gray-300 transition-all">{lang}</button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="w-[1px] h-3 bg-white/10 mx-1"></div>
                                <button onClick={handleSpeak} className="p-1.5 hover:text-[#ff7a00] text-xs transition-colors rounded-lg hover:bg-white/5">
                                    {isSpeaking ? "🛑" : "🔊"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
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

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/api/chat`, { headers: { Authorization: `Bearer ${token}` } });
                setHistory(res.data || []);
            } catch (err) { console.error(err); }
        };
        fetchHistory();
    }, []);

    useEffect(() => { scrollToBottom(); }, [history, streamingContent, isLoading]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim() || isLoading) return;

        const currentInput = message;
        setHistory(prev => [...prev, { role: "user", content: currentInput }]);
        setMessage(""); setIsLoading(true); setStreamingContent(""); setError("");

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ message: currentInput, history: history })
            });

            if (response.status === 401) throw new Error("Session expired. Please login again.");
            if (!response.ok) throw new Error("Connection error.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
                    
                    const dataStr = trimmedLine.replace("data: ", "").trim();
                    if (dataStr === "[DONE]") break;
                    
                    try {
                        const dataObj = JSON.parse(dataStr);
                        if (dataObj.text) {
                            fullText += dataObj.text;
                            setStreamingContent(fullText);
                        }
                    } catch (err) {}
                }
            }
            setHistory(prev => [...prev, { role: "assistant", content: fullText || "Service unavailable." }]);
            setStreamingContent("");
        } catch (err) { 
            setError(err.message || "Connection error."); 
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-black text-zinc-100 font-sans overflow-hidden">
            <header className="fixed top-16 left-0 right-0 h-16 bg-black/80 backdrop-blur-3xl border-b border-white/5 flex items-center px-4 md:px-8 z-40 justify-between shadow-2xl overflow-hidden">
                <div className="scanner-line"></div>
                <div className="flex items-center gap-3 group cursor-pointer">
                    <motion.div 
                        animate={{ 
                            boxShadow: ["0 0 20px rgba(255,122,0,0.3)", "0 0 40px rgba(255,122,0,0.6)", "0 0 20px rgba(255,122,0,0.3)"],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff7a00] to-orange-400 flex items-center justify-center font-black text-xs text-white relative overflow-hidden"
                    >
                        {/* Shimmer Effect */}
                        <motion.div 
                            animate={{ left: ["-100%", "200%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="absolute top-0 bottom-0 w-8 bg-white/30 -skew-x-20"
                        />
                        SKU
                    </motion.div>
                    <div className="flex flex-col">
                        <motion.h2 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="font-black text-[11px] uppercase tracking-[0.4em] bg-gradient-to-r from-[#ff7a00] via-white to-[#ff7a00] bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer"
                        >
                            Idea Validator
                        </motion.h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em] relative">
                                Active • AI Engine 3.1
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={async () => {
                        window.speechSynthesis.cancel();
                        if (window.confirm("Purge all data, mawa? 🚮")) {
                            try {
                                const token = localStorage.getItem("token");
                                await axios.delete(`${API_URL}/api/chat/clear`, { headers: { Authorization: `Bearer ${token}` } });
                                setHistory([]);
                            } catch (e) {}
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600/10 hover:bg-red-600 border border-red-600/30 hover:border-red-600 text-red-500 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Clear History
                </button>
            </header>

            <main className="flex-1 overflow-y-auto mt-14 scrollbar-hide pt-6 md:pt-10 pb-40">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
                    <AnimatePresence>
                        {history.length === 0 && !isLoading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                                className="flex flex-col items-center justify-center py-20 px-4 md:py-32"
                            >
                                 <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-950 border border-white/5 rounded-2xl flex items-center justify-center text-3xl md:text-4xl mb-6 shadow-sm text-[#ff7a00]">
                                     💡
                                 </div>
                                 <h3 className="text-xl md:text-3xl font-semibold tracking-tight text-center text-white mb-3">
                                     Validate your startup idea.
                                 </h3>
                                 <p className="text-sm md:text-base text-zinc-400 text-center max-w-md leading-relaxed">
                                     Describe your product, target audience, and business model. Our AI mentor will analyze its feasibility instantly.
                                 </p>
                            </motion.div>
                        )}
                        {history.map((msg, index) => <ChatMessage key={msg._id || index} msg={msg} />)}
                        {streamingContent && <ChatMessage key="streaming-content" msg={{ role: "assistant", content: streamingContent }} />}
                        {isLoading && !streamingContent && (
                            <div className="flex justify-start mb-6 w-full max-w-4xl mx-auto">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950 px-5 py-4 rounded-xl rounded-bl-sm border border-white/5 flex items-center gap-2 shadow-sm">
                                     <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                                     <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                     <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black via-black to-transparent z-50 pt-10">
                {error && <div className="text-red-400 text-xs text-center mb-4 px-4 bg-red-500/10 py-2 rounded-lg max-w-md mx-auto ring-1 ring-red-500/20">{error}</div>}
                
                <div className="w-full max-w-4xl mx-auto relative group">
                    {/* ATTRACING HIGH GLOW BACKGROUND */}
                    <div className={`absolute -inset-[2px] bg-gradient-to-r from-[#ff7a00] via-[#f43f5e] to-[#ff7a00] rounded-[2rem] blur-lg transition-all duration-500 opacity-30 ${message.trim() ? "opacity-100 blur-xl animate-pulse ring-1 ring-orange-400" : "group-focus-within:opacity-80 group-focus-within:blur-xl"}`}></div>
                    
                    {/* INPUT CONTAINER */}
                    <div className="relative flex items-end md:items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl py-2 px-3 md:py-3 md:px-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Type your startup idea..."
                            className="flex-1 bg-transparent outline-none text-white text-sm md:text-base placeholder-zinc-500 px-3 py-2 md:py-0 resize-none max-h-32 scrollbar-hide min-h-[44px] leading-relaxed"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isLoading || !message.trim()}
                            className={`p-2 w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ml-2 mb-1 md:mb-0 shrink-0 relative overflow-hidden ${
                                message.trim() && !isLoading 
                                ? "bg-gradient-to-tr from-[#ff7a00] to-[#f43f5e] text-white shadow-[0_0_20px_#ff7a0080]" 
                                : "bg-white/5 text-zinc-600 cursor-not-allowed"
                            }`}
                        >
                            {/* Inner button glow when active */}
                            {message.trim() && !isLoading && (
                                <div className="absolute inset-0 bg-white/20 animate-ping rounded-full opacity-50"></div>
                            )}
                            <svg className="w-4 h-4 md:w-5 md:h-5 transform -rotate-90 ml-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </div>
                </div>
                <div className="text-center mt-4 text-[10px] text-zinc-500/70 select-none font-medium tracking-wide">
                    AI Startup Validator can make mistakes. Validate answers independently.
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
