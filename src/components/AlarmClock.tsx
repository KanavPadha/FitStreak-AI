import React from 'react';
import { db, auth, collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc, handleFirestoreError, OperationType } from '../lib/firebase';
import { Clock, Plus, Trash2, Bell, BellOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AlarmClock() {
  const [alarms, setAlarms] = React.useState<any[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newAlarm, setNewAlarm] = React.useState({ time: '08:00', label: 'Gym Time' });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'alarms'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'alarms');
    });

    return () => unsubscribe();
  }, []);

  const handleAddAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'alarms'), {
        userId: auth.currentUser.uid,
        time: newAlarm.time,
        label: newAlarm.label,
        isActive: true,
        createdAt: new Date()
      });
      setIsAdding(false);
      setNewAlarm({ time: '08:00', label: 'Gym Time' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'alarms');
    }
  };

  const toggleAlarm = async (alarmId: string, currentState: boolean) => {
    try {
      await updateDoc(doc(db, 'alarms', alarmId), {
        isActive: !currentState
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'alarms');
    }
  };

  const deleteAlarm = async (alarmId: string) => {
    try {
      await deleteDoc(doc(db, 'alarms', alarmId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'alarms');
    }
  };

  if (loading) return null;

  return (
    <div className="glass p-6 rounded-3xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Clock className="text-blue-500" />
          Reminders & Alarms
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-blue-500/20 text-blue-500 rounded-full hover:bg-blue-500/30 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {alarms.map((alarm) => (
            <motion.div
              key={alarm.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                alarm.isActive ? 'bg-white/10 border border-white/10' : 'bg-white/5 border border-transparent opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleAlarm(alarm.id, alarm.isActive)}
                  className={`p-2 rounded-xl transition-colors ${
                    alarm.isActive ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'
                  }`}
                >
                  {alarm.isActive ? <Bell size={18} /> : <BellOff size={18} />}
                </button>
                <div>
                  <p className="text-2xl font-black tracking-tight">{alarm.time}</p>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{alarm.label}</p>
                </div>
              </div>
              <button
                onClick={() => deleteAlarm(alarm.id)}
                className="p-2 text-white/20 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {alarms.length === 0 && !isAdding && (
          <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-sm text-white/20 font-medium">No alarms set</p>
          </div>
        )}
      </div>

      {/* Add Alarm Modal */}
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
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black mb-6">Set Reminder</h2>

              <form onSubmit={handleAddAlarm} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Time</label>
                  <input
                    type="time"
                    required
                    value={newAlarm.time}
                    onChange={(e) => setNewAlarm({ ...newAlarm, time: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-2xl font-black focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Drink Water, Gym"
                    value={newAlarm.label}
                    onChange={(e) => setNewAlarm({ ...newAlarm, label: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                  Save Alarm
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
