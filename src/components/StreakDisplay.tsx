import React from 'react';
import { db, auth, doc, onSnapshot, handleFirestoreError, OperationType, collection, query, where, setDoc, deleteDoc, getDocs } from '../lib/firebase';
import { Flame, Trophy, TrendingUp, Info, CheckCircle2, Circle, AlertCircle, Target, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isPast, isToday, subMonths } from 'date-fns';

export default function StreakDisplay() {
  const [streak, setStreak] = React.useState<any>(null);
  const [workouts, setWorkouts] = React.useState<any[]>([]);
  const [habits, setHabits] = React.useState<any[]>([]);
  const [dailyGoals, setDailyGoals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [newGoal, setNewGoal] = React.useState('');

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  React.useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Streaks
    const unsubscribeStreak = onSnapshot(doc(db, 'streaks', auth.currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setStreak(snapshot.data());
      } else {
        setStreak({ currentStreak: 0, longestStreak: 0 });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'streaks');
    });

    // Fetch Workouts for current month
    const qWorkouts = query(
      collection(db, 'workouts'),
      where('userId', '==', auth.currentUser.uid),
      where('date', '>=', monthStart)
    );
    const unsubscribeWorkouts = onSnapshot(qWorkouts, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Habits
    const qHabits = query(
      collection(db, 'habits'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeHabits = onSnapshot(qHabits, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Daily Goals
    const qGoals = query(
      collection(db, 'dailyGoals'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
      setDailyGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeStreak();
      unsubscribeWorkouts();
      unsubscribeHabits();
      unsubscribeGoals();
    };
  }, []);

  const getDayStatus = (day: Date) => {
    const hasWorkout = workouts.some(w => isSameDay(w.date.toDate(), day));
    const hasHabit = habits.some(h => h.completedDates?.includes(format(day, 'yyyy-MM-dd')));
    const hasGoal = dailyGoals.some(g => g.date === format(day, 'yyyy-MM-dd'));
    
    if (hasWorkout || hasHabit) return 'active';
    if (hasGoal) return 'hasGoal';
    if (isToday(day)) return 'today';
    if (isPast(day)) return 'missed';
    return 'future';
  };

  const getDayGoal = (day: Date) => {
    return dailyGoals.find(g => g.date === format(day, 'yyyy-MM-dd'));
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedDay) return;

    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const goalId = `${auth.currentUser.uid}_${dateStr}`;

    try {
      if (newGoal.trim() === '') {
        await deleteDoc(doc(db, 'dailyGoals', goalId));
      } else {
        await setDoc(doc(db, 'dailyGoals', goalId), {
          userId: auth.currentUser.uid,
          date: dateStr,
          goal: newGoal,
          isCompleted: false
        });
      }
      setSelectedDay(null);
      setNewGoal('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'dailyGoals');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="streak-gradient p-8 rounded-3xl shadow-2xl flex items-center justify-between overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">Current Streak</p>
            <div className="flex items-baseline gap-3">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={streak?.currentStreak || 0}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-7xl font-black text-white"
                >
                  {streak?.currentStreak || 0}
                </motion.h2>
              </AnimatePresence>
              <span className="text-2xl font-bold text-white/80">Days</span>
            </div>
          </div>
          <div className="relative z-10 p-6 bg-white/20 backdrop-blur-md rounded-2xl">
            <Flame size={64} className="text-white animate-pulse" />
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {/* Best Streak Card */}
          <div 
            className="glass p-6 rounded-3xl flex flex-col justify-center relative group"
            onMouseEnter={() => setHoveredCard('best')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-500">
                <Trophy size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Best Streak</span>
              </div>
              <Info size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
            <p className="text-3xl font-black">{streak?.longestStreak || 0} <span className="text-sm font-medium text-white/40">Days</span></p>
            
            <AnimatePresence>
              {hoveredCard === 'best' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 right-0 mb-4 p-4 glass rounded-2xl z-50 shadow-2xl border-orange-500/20"
                >
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Streak Stats</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-white/40">All-time High</span>
                      <span className="text-white">{streak?.longestStreak || 0} Days</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-white/40">Consistency</span>
                      <span className="text-white">Top 5%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Level Card */}
          <div 
            className="glass p-6 rounded-3xl flex flex-col justify-center relative group"
            onMouseEnter={() => setHoveredCard('level')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-500">
                <TrendingUp size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Level</span>
              </div>
              <span className="text-xs font-bold text-white/40">75%</span>
            </div>
            <p className="text-3xl font-black mb-3">12 <span className="text-sm font-medium text-white/40">Elite</span></p>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                className="h-full bg-blue-500" 
              />
            </div>

            <AnimatePresence>
              {hoveredCard === 'level' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 right-0 mb-4 p-4 glass rounded-2xl z-50 shadow-2xl border-blue-500/20"
                >
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Level Progress</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-white/40">XP to Level 13</span>
                      <span className="text-white">450 / 600</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-white/40">Next Reward</span>
                      <span className="text-white">Titan Badge</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="glass p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="text-green-500" />
            Activity Calendar
          </h3>
          <span className="text-sm font-medium text-white/40 uppercase tracking-widest">{format(new Date(), 'MMMM yyyy')}</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-white/20 mb-2">{day}</div>
          ))}
          {daysInMonth.map((day, i) => {
            const status = getDayStatus(day);
            const goal = getDayGoal(day);
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.1 }}
                onClick={() => {
                  setSelectedDay(day);
                  setNewGoal(goal?.goal || '');
                }}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group cursor-pointer
                  ${status === 'active' ? 'bg-green-500/20 border border-green-500/30 text-green-500' : 
                    status === 'hasGoal' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-500' :
                    status === 'missed' ? 'bg-red-500/10 border border-red-500/20 text-red-500/40' : 
                    status === 'today' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-500' : 
                    'bg-white/5 border border-white/5 text-white/20'}
                `}
              >
                <span className="text-[10px] font-bold">{format(day, 'd')}</span>
                {goal && <div className="w-1 h-1 bg-purple-500 rounded-full mt-0.5" />}
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 glass rounded text-[8px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {format(day, 'MMM d')} - {goal ? `Goal: ${goal.goal}` : status === 'active' ? 'Activity Logged' : status === 'missed' ? 'Missed' : status === 'today' ? 'Today' : 'Upcoming'}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center flex-wrap gap-4 mt-6 pt-6 border-t border-white/5">
          <LegendItem color="bg-green-500/20 border-green-500/30" label="Active" />
          <LegendItem color="bg-purple-500/20 border-purple-500/30" label="Goal Set" />
          <LegendItem color="bg-red-500/10 border-red-500/20" label="Missed" />
          <LegendItem color="bg-blue-500/20 border-blue-500/50" label="Today" />
        </div>
      </div>

      {/* Daily Goal Modal */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-[2rem] w-full max-w-md relative shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setSelectedDay(null)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <Target className="text-purple-500" size={32} />
                <div>
                  <h2 className="text-2xl font-black">Daily Goal</h2>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{format(selectedDay, 'MMMM d, yyyy')}</p>
                </div>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">What's your goal for this day?</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Run 5km, Drink 3L water, No sugar..."
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!auth.currentUser || !selectedDay) return;
                      const dateStr = format(selectedDay, 'yyyy-MM-dd');
                      const goalId = `${auth.currentUser.uid}_${dateStr}`;
                      await deleteDoc(doc(db, 'dailyGoals', goalId));
                      setSelectedDay(null);
                    }}
                    className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl font-black hover:bg-white/10 transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-purple-500 text-white rounded-2xl font-black hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color} border`} />
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}
