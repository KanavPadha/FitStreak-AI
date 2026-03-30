import React from 'react';
import { db, auth, collection, doc, setDoc, getDoc, updateDoc, Timestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { Plus, Activity, Clock, Flame, Save, X } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

const WORKOUT_TYPES = ['Running', 'Cycling', 'Strength', 'Yoga', 'Swimming', 'Walking', 'HIIT', 'Other'];

export default function WorkoutLog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [type, setType] = React.useState(WORKOUT_TYPES[0]);
  const [duration, setDuration] = React.useState(30);
  const [calories, setCalories] = React.useState(200);
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    const workoutId = crypto.randomUUID();
    const workoutData = {
      userId: auth.currentUser.uid,
      type,
      duration: Number(duration),
      calories: Number(calories),
      date: Timestamp.now(),
      notes,
    };

    try {
      await setDoc(doc(db, 'workouts', workoutId), workoutData);
      
      // Update streak logic
      const streakRef = doc(db, 'streaks', auth.currentUser.uid);
      const streakSnap = await getDoc(streakRef);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (streakSnap.exists()) {
        const data = streakSnap.data();
        const lastDate = data.lastActivityDate ? format(data.lastActivityDate.toDate(), 'yyyy-MM-dd') : null;
        
        if (lastDate !== today) {
          const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
          let newStreak = 1;
          if (lastDate === yesterday) {
            newStreak = data.currentStreak + 1;
          }
          
          await updateDoc(streakRef, {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, data.longestStreak),
            lastActivityDate: Timestamp.now()
          });
        }
      } else {
        await setDoc(streakRef, {
          userId: auth.currentUser.uid,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: Timestamp.now()
        });
      }
      
      setIsOpen(false);
      // Reset form
      setType(WORKOUT_TYPES[0]);
      setDuration(30);
      setCalories(200);
      setNotes('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workouts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all"
      >
        <Plus size={20} />
        <span>Log Workout</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass p-8 rounded-3xl z-50 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="text-blue-500" />
                  New Workout
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dim mb-2">Workout Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-neutral-900">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dim mb-2 flex items-center gap-2">
                      <Clock size={14} /> Duration (min)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dim mb-2 flex items-center gap-2">
                      <Flame size={14} /> Calories
                    </label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dim mb-2">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did it go?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Workout</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
