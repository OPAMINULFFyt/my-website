import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, X, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const VirtualAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am your Cyber Arsenal Assistant. How can I help you today? (আমি আপনার সাইবার আর্সেনাল সহকারী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?)' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `
        You are an expert Virtual Assistant for "THE CYBER ARSENAL" (also known as OP AMINUL FF).
        Your goal is to help users navigate the website and answer questions about products and services.
        
        Website Information:
        - Name: THE CYBER ARSENAL
        - Purpose: A premium marketplace for digital assets, cybersecurity courses, project files, and hardware kits.
        - Categories: 
          1. Courses: Advanced cybersecurity and programming courses.
          2. Project Files: Source codes and templates.
          3. Hardware Kits: Specialized hardware for tech enthusiasts.
        - Key Features: Instant Deployment, Encrypted Security, 24/7 Elite Support.
        - Support Channels: WhatsApp and Telegram (available in the Support Center).
        
        Guidelines:
        - Be professional, helpful, and tech-savvy.
        - Support both English and Bengali (বাংলা). If the user speaks Bengali, respond in Bengali. If they speak English, respond in English.
        - If you don't know the answer, suggest they contact human support via WhatsApp or Telegram.
        - Keep responses concise and formatted with markdown if needed.
      `;

      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "System error. Please contact human support. (সিস্টেম ত্রুটি। অনুগ্রহ করে সরাসরি সাপোর্টে যোগাযোগ করুন।)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[450px] w-full bg-cyber-black/95 border border-cyber-purple/30 shadow-[0_0_30px_rgba(188,19,254,0.2)] overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-cyber-purple/10 border-b border-cyber-purple/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyber-purple/20 flex items-center justify-center text-cyber-purple border border-cyber-purple/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">AI_ASSISTANT</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-mono text-green-500 uppercase">System_Online</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border ${
                m.role === 'user' 
                  ? 'bg-white/5 border-white/10 text-white/60' 
                  : 'bg-cyber-purple/20 border-cyber-purple/30 text-cyber-purple'
              }`}>
                {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div className={`p-3 text-[11px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-white/5 border border-white/10 text-white/90 rounded-2xl rounded-tr-none'
                  : 'bg-cyber-purple/5 border border-cyber-purple/20 text-white/90 rounded-2xl rounded-tl-none'
              }`}>
                <div className="markdown-body">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 items-center bg-cyber-purple/5 border border-cyber-purple/20 p-3 rounded-2xl rounded-tl-none">
              <Loader2 className="w-3 h-3 text-cyber-purple animate-spin" />
              <span className="text-[10px] font-mono text-cyber-purple/60 uppercase animate-pulse">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white/5 border-t border-white/10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (এখানে লিখুন...)"
            className="w-full bg-cyber-black border border-white/10 px-4 py-2 pr-12 text-xs text-white focus:outline-none focus:border-cyber-purple transition-all placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyber-purple hover:text-white disabled:text-white/10 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default VirtualAssistant;
