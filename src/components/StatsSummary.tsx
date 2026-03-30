import React from 'react';
import { db, auth, collection, query, where, orderBy, limit, onSnapshot, handleFirestoreError, OperationType, deleteDoc, doc, updateDoc } from '../lib/firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Flame, Clock, TrendingUp, Calendar, Trash2, Edit2, X, Utensils, ArrowRight } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function StatsSummary({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const [workouts, setWorkouts] = React.useState<any[]>([]);
  const [meals, setMeals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingWorkout, setEditingWorkout] = React.useState<any>(null);
  const [deletingWorkoutId, setDeletingWorkoutId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const qWorkouts = query(
      collection(db, 'workouts'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc'),
      limit(20)
    );

    const qMeals = query(
      collection(db, 'meals'),
      where('userId', '==', auth.currentUser.uid),
      limit(20)
    );

    const unsubWorkouts = onSnapshot(qWorkouts, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMeals = onSnapshot(qMeals, (snapshot) => {
      setMeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'meals');
    });

    return () => {
      unsubWorkouts();
      unsubMeals();
    };
  }, []);

  const dailyNutrition = meals.reduce((acc, meal) => {
    acc.protein += meal.protein || 0;
    acc.carbs += meal.carbs || 0;
    acc.calories += meal.calories || 0;
    return acc;
  }, { protein: 0, carbs: 0, calories: 0 });

  const handleDeleteWorkout = async () => {
    if (!deletingWorkoutId) return;
    try {
      await deleteDoc(doc(db, 'workouts', deletingWorkoutId));
      setDeletingWorkoutId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'workouts');
    }
  };

  const handleUpdateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkout) return;

    try {
      await updateDoc(doc(db, 'workouts', editingWorkout.id), {
        type: editingWorkout.type,
        duration: Number(editingWorkout.duration),
        calories: Number(editingWorkout.calories),
      });
      setEditingWorkout(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'workouts');
    }
  };

  const chartData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    return last7Days.map(day => {
      const dayWorkouts = workouts.filter(w => isSameDay(w.date.toDate(), day));
      const totalCalories = dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
      const totalDuration = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
      return {
        name: format(day, 'EEE'),
        calories: totalCalories,
        duration: totalDuration,
      };
    });
  }, [workouts]);

  const stats = React.useMemo(() => {
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0;
    return { totalCalories, totalDuration, avgDuration, count: workouts.length };
  }, [workouts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="text-orange-500" />} label="Total Calories" value={stats.totalCalories} unit="kcal" />
        <StatCard icon={<Clock className="text-blue-500" />} label="Total Time" value={stats.totalDuration} unit="min" />
        <StatCard icon={<TrendingUp className="text-green-500" />} label="Avg. Duration" value={stats.avgDuration} unit="min" />
        <StatCard icon={<Activity className="text-purple-500" />} label="Workouts" value={stats.count} unit="total" />
      </div>

      {/* Activity Chart & Nutrition Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-blue-500" />
            Weekly Activity
          </h3>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-white/60">Duration (min)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-white/60">Calories (kcal)</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="duration" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDuration)" strokeWidth={3} />
              <Area type="monotone" dataKey="calories" stroke="#f97316" fillOpacity={1} fill="url(#colorCalories)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="text-orange-500" />
            Nutrition
          </h3>
          <button 
            onClick={() => onViewChange?.('nutrition')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <ArrowRight size={20} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Total Protein</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic">{dailyNutrition.protein.toFixed(1)}</span>
              <span className="text-sm font-bold text-white/40 uppercase">grams</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Total Carbs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic">{dailyNutrition.carbs.toFixed(1)}</span>
              <span className="text-sm font-bold text-white/40 uppercase">grams</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Total Calories</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic">{dailyNutrition.calories.toFixed(0)}</span>
              <span className="text-sm font-bold text-white/40 uppercase">kcal</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onViewChange?.('nutrition')}
          className="mt-8 w-full py-4 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          Open Tracker
        </button>
      </div>
    </div>

      {/* Recent Activity List */}
      <div className="glass p-6 rounded-3xl shadow-xl">
        <h3 className="text-xl font-bold mb-6">Recent Workouts</h3>
        <div className="space-y-4">
          {workouts.length === 0 ? (
            <p className="text-white/40 text-center py-8">No workouts logged yet. Start your journey today!</p>
          ) : (
            workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">{workout.type}</h4>
                    <p className="text-xs text-white/40">{format(workout.date.toDate(), 'MMM d, yyyy • h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-sm font-bold">{workout.duration}m</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">Duration</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange-500">{workout.calories} kcal</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">Burned</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingWorkout(workout)}
                      className="p-2 text-white/20 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingWorkoutId(workout.id)}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingWorkoutId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-[2rem] w-full max-w-sm relative shadow-2xl border border-red-500/20"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Delete Workout?</h2>
              <p className="text-white/40 text-center text-sm mb-8">This action cannot be undone. Are you sure you want to delete this entry?</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingWorkoutId(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWorkout}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Workout Modal */}
      <AnimatePresence>
        {editingWorkout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-[2rem] w-full max-w-md relative shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setEditingWorkout(null)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black mb-6">Edit Workout</h2>

              <form onSubmit={handleUpdateWorkout} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Workout Type</label>
                  <input
                    type="text"
                    required
                    value={editingWorkout.type}
                    onChange={(e) => setEditingWorkout({ ...editingWorkout, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Duration (min)</label>
                    <input
                      type="number"
                      required
                      value={editingWorkout.duration}
                      onChange={(e) => setEditingWorkout({ ...editingWorkout, duration: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Calories</label>
                    <input
                      type="number"
                      required
                      value={editingWorkout.calories}
                      onChange={(e) => setEditingWorkout({ ...editingWorkout, calories: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                  Update Workout
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: number, unit: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-3xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-white/5">
          {icon}
        </div>
        <span className="text-sm font-medium text-white/60">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{unit}</span>
      </div>
    </motion.div>
  );
}
