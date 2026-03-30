import React from 'react';
import { db, auth, collection, addDoc, onSnapshot, query, where, orderBy, limit, handleFirestoreError, OperationType, deleteDoc, doc } from '../lib/firebase';
import { GoogleGenAI } from "@google/genai";
import { Utensils, Plus, Trash2, Calculator, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { FirebaseUser } from '../lib/firebase';

export default function MealCalculator({ user }: { user: FirebaseUser | null }) {
  const [meals, setMeals] = React.useState<any[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [mealInput, setMealInput] = React.useState({ 
    name: '', 
    mealTime: 'Morning', 
    mealDetails: '' 
  });
  const [calculating, setCalculating] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log("MealCalculator mounted. User:", user?.uid);
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'meals'),
      where('userId', '==', user.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Meals snapshot received. Count:", snapshot.size);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually to avoid index requirement for now
      data.sort((a: any, b: any) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateB - dateA;
      });
      setMeals(data);
      setLoading(false);
    }, (error) => {
      console.error("Meal fetch error:", error);
      handleFirestoreError(error, OperationType.LIST, 'meals');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCalculateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mealInput.name || !mealInput.mealDetails) return;

    setCalculating(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file and restart the server.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Calculate the nutritional values (protein, carbs, calories) for the following meal.
      Meal Name: ${mealInput.name}
      Detailed Items & Portions: ${mealInput.mealDetails}
      
      Analyze every single item listed in the detailed section with its weight/portion. 
      Match it with global nutritional data for every single eatable thing.
      Return the aggregated total values as a JSON object with keys: protein (in grams), carbs (in grams), and calories (in kcal). 
      Be as accurate as possible. If portions are vague, use standard serving sizes.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const { protein, carbs, calories } = JSON.parse(result.text);

      await addDoc(collection(db, 'meals'), {
        userId: user.uid,
        name: mealInput.name,
        mealTime: mealInput.mealTime,
        mealDetails: mealInput.mealDetails,
        protein: Number(protein),
        carbs: Number(carbs),
        calories: Number(calories),
        date: new Date()
      });

      setIsAdding(false);
      setMealInput({ name: '', mealTime: 'Morning', mealDetails: '' });
    } catch (error: any) {
      console.error("Nutrition calculation error:", error);
      const errorMessage = error.message || "Failed to calculate nutrition. Please try again.";
      alert(errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      await deleteDoc(doc(db, 'meals', mealId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'meals');
    }
  };

  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      const d = date.toDate ? date.toDate() : new Date(date);
      return format(d, 'h:mm a');
    } catch (e) {
      return 'N/A';
    }
  };

  if (loading) return (
    <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-orange-500" size={32} />
      <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Loading Tracker...</p>
    </div>
  );

  const dailyTotals = meals.reduce((acc, meal) => {
    acc.protein += meal.protein || 0;
    acc.carbs += meal.carbs || 0;
    acc.calories += meal.calories || 0;
    return acc;
  }, { protein: 0, carbs: 0, calories: 0 });

  return (
    <div className="glass p-6 rounded-3xl shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Utensils className="text-orange-500" />
          Meal Tracker
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-orange-500/20 text-orange-500 rounded-full hover:bg-orange-500/30 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Daily Totals */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-custom uppercase tracking-widest">Protein</p>
          <p className="text-lg font-black text-blue-500">{Math.round(dailyTotals.protein)}g</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-[10px] font-bold text-muted-custom uppercase tracking-widest">Carbs</p>
          <p className="text-lg font-black text-green-500">{Math.round(dailyTotals.carbs)}g</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-custom uppercase tracking-widest">Calories</p>
          <p className="text-lg font-black text-orange-500">{Math.round(dailyTotals.calories)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {meals.map((meal) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Calculator size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{meal.name}</h4>
                  <p className="text-[10px] text-muted-custom font-medium mb-1">
                    <span className="text-orange-500/80 uppercase tracking-tighter mr-1">{meal.mealTime}</span>
                    • {formatDate(meal.date)}
                  </p>
                  {meal.mealDetails && (
                    <p className="text-[10px] text-ghost line-clamp-1 italic">
                      {meal.mealDetails}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-black text-white/80">{meal.protein}P • {meal.carbs}C</p>
                  <p className="text-[10px] font-bold text-orange-500">{meal.calories} kcal</p>
                </div>
                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="p-2 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {meals.length === 0 && !isAdding && (
          <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02]">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto mb-4">
              <Utensils size={32} />
            </div>
            <h4 className="text-lg font-bold mb-2">No meals logged yet</h4>
            <p className="text-sm text-muted-custom font-medium max-w-[200px] mx-auto">Start tracking your nutrition by adding your first meal.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
            >
              Add Meal Now
            </button>
          </div>
        )}
      </div>

      {/* Add Meal Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-[2rem] w-full max-w-md relative shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <Plus size={24} className="rotate-45" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-500">
                  <Calculator size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">AI Nutrition</h2>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Calculate Protein & Carbs</p>
                </div>
              </div>

              <form onSubmit={handleCalculateAndSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Meal Time</label>
                    <select
                      value={mealInput.mealTime}
                      onChange={(e) => setMealInput({ ...mealInput, mealTime: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Meal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Breakfast"
                      value={mealInput.name}
                      onChange={(e) => setMealInput({ ...mealInput, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Detailed Items & Portions</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. 2 eggs (100g), 1 slice of bread (40g), 1 avocado (150g)"
                    value={mealInput.mealDetails}
                    onChange={(e) => setMealInput({ ...mealInput, mealDetails: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                  <p className="text-[10px] text-white/20 mt-2 italic">List every item and its weight for the most accurate analysis.</p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3">
                  <Info className="text-blue-500 shrink-0" size={20} />
                  <p className="text-[10px] font-medium text-blue-200 leading-relaxed">
                    Our AI will analyze each item individually and match it with global nutritional data to give you the exact protein and carbs.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={calculating}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <span>Calculate & Save</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
