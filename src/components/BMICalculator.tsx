import React from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Sparkles, AlertCircle, RefreshCw, Scale, Ruler } from 'lucide-react';

export default function BMICalculator() {
  const [weight, setWeight] = React.useState<string>('');
  const [height, setHeight] = React.useState<string>('');
  const [bmi, setBmi] = React.useState<number | null>(null);
  const [category, setCategory] = React.useState<string>('');
  const [suggestion, setSuggestion] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const calculateBMI = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m

    if (isNaN(w) || isNaN(h) || h === 0) {
      setError("Please enter valid weight and height.");
      return;
    }

    const bmiValue = w / (h * h);
    setBmi(bmiValue);

    let cat = '';
    if (bmiValue < 18.5) cat = 'Underweight';
    else if (bmiValue < 25) cat = 'Normal weight';
    else if (bmiValue < 30) cat = 'Overweight';
    else cat = 'Obese';
    setCategory(cat);

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file and restart the server.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `My BMI is ${bmiValue.toFixed(1)} (${cat}). Weight: ${w}kg, Height: ${height}cm.
      Provide a personalized fitness plan including:
      1. Recommended workout intensity and frequency.
      2. Specific steps to reach or maintain a healthy BMI.
      3. Daily protein and carb intake recommendations (in grams) for maintenance/improvement.
      
      Keep the response professional, encouraging, and under 100 words. Format with clear sections.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setSuggestion(result.text || "Keep focusing on your health journey!");
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(err.message || "Failed to get AI suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
            <Calculator size={24} />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tight">BMI Calculator</h2>
        </div>

        <form onSubmit={calculateBMI} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40">
              <Scale size={14} />
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 70"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40">
              <Ruler size={14} />
              Height (cm)
            </label>
            <input
              type="number"
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 175"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Calculate & Get AI Advice"}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </div>

      <AnimatePresence>
        {bmi !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Your BMI</p>
              <h3 className="text-6xl font-black italic text-blue-500">{bmi.toFixed(1)}</h3>
              <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                category === 'Normal weight' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                category === 'Underweight' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {category}
              </div>
            </div>

            <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="text-purple-500" size={24} />
                <h3 className="text-xl font-bold uppercase italic">AI Health Suggestion</h3>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw size={32} className="text-blue-500 animate-spin" />
                  <p className="text-sm font-medium text-white/40 italic">Gemini is crafting your plan...</p>
                </div>
              ) : suggestion ? (
                <div className="prose prose-invert max-w-none">
                  <div className="text-white/80 leading-relaxed whitespace-pre-wrap font-medium italic">
                    {suggestion}
                  </div>
                </div>
              ) : (
                <p className="text-white/40 italic">Calculate your BMI to see personalized suggestions.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
