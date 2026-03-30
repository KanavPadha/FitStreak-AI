import React from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, Bot, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function AITrainer() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'model',
      text: "Hey there! I'm Streak, your personal AI fitness trainer. Ready to crush some goals today? Ask me anything about workouts, nutrition, or just for some motivation!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file and restart the server.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a professional, motivating, and highly knowledgeable personal fitness trainer named 'Streak'. Your goal is to help users achieve their fitness milestones on FitStreak. You provide clear instructions on exercises, nutrition advice, and motivational support. You can chat casually but always steer the conversation towards health and fitness. Be punchy, encouraging, and professional. Use emojis occasionally to stay engaging.",
        }
      });

      // We send the full history for context
      const response = await chat.sendMessage({
        message: input
      });

      const modelMessage: Message = {
        role: 'model',
        text: response.text || "I'm here to help, but I couldn't process that. Let's try again!",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Sorry, I'm having a bit of a technical glitch. Let's get back to training in a moment!",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[70vh] flex flex-col glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Streak AI Trainer</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Online & Ready</span>
            </div>
          </div>
        </div>
        <Sparkles className="text-blue-500" size={20} />
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-500' : 'bg-white/10'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'
              }`}>
                {msg.text}
                <div className={`text-[10px] mt-2 opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-6 border-t border-white/5 bg-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Streak for advice..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-16 font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-4 text-white/20 font-bold uppercase tracking-widest">
          Streak AI can provide general fitness guidance. Consult a professional for medical advice.
        </p>
      </form>
    </div>
  );
}
