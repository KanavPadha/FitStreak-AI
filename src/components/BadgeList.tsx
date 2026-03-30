import React from 'react';
import { db, auth, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../lib/firebase';
import { Award, Shield, Star, Zap, Target, Flame } from 'lucide-react';
import { motion } from 'motion/react';

const BADGE_ICONS: Record<string, any> = {
  'streak-3': { icon: <Flame size={24} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'streak-7': { icon: <Zap size={24} />, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  'workout-10': { icon: <Star size={24} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'early-bird': { icon: <Target size={24} />, color: 'text-green-500', bg: 'bg-green-500/10' },
  'elite-status': { icon: <Shield size={24} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'default': { icon: <Award size={24} />, color: 'text-white/40', bg: 'bg-white/5' },
};

export default function BadgeList() {
  const [badges, setBadges] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'badges'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBadges(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'badges');
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <div className="glass p-8 rounded-3xl shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <Award className="text-yellow-500" />
          Earned Badges
        </h3>
        <span className="text-sm font-medium text-white/40">{badges.length} Unlocked</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {badges.length === 0 ? (
          <div className="col-span-full py-8 flex flex-col items-center gap-4 text-white/20">
            <Award size={48} strokeWidth={1} />
            <p className="text-sm font-medium">Earn badges by completing workouts and maintaining streaks!</p>
          </div>
        ) : (
          badges.map((badge, index) => {
            const config = BADGE_ICONS[badge.badgeId] || BADGE_ICONS.default;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="flex flex-col items-center text-center gap-3 group"
              >
                <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center ${config.color} border border-white/5 group-hover:border-white/20 transition-all shadow-lg shadow-black/20`}>
                  {config.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1">{badge.name}</h4>
                  <p className="text-[10px] text-white/40">{new Date(badge.earnedAt.toDate()).toLocaleDateString()}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
