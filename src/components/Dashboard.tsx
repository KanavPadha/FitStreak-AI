import React from 'react';
import { motion } from 'motion/react';
import { Activity, Utensils, CheckCircle, Bell, Award, BarChart3, ArrowRight, Calculator, MessageSquare, Dumbbell, Settings } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const features: Feature[] = [
  {
    id: 'workouts',
    name: 'Workout Log',
    description: 'Track your physical activities, duration, and calories burned with precision.',
    icon: <Activity size={32} />,
    color: 'blue'
  },
  {
    id: 'nutrition',
    name: 'Nutrition Tracker',
    description: 'Calculate the nutritional value of your meals using advanced AI analysis.',
    icon: <Utensils size={32} />,
    color: 'orange'
  },
  {
    id: 'alarms',
    name: 'Reminders & Alarms',
    description: 'Set fitness reminders and wake-up calls to stay on track with your goals.',
    icon: <Bell size={32} />,
    color: 'purple'
  },
  {
    id: 'badges',
    name: 'Achievements',
    description: 'View your earned badges and celebrate your fitness milestones and progress.',
    icon: <Award size={32} />,
    color: 'yellow'
  },
  {
    id: 'bmi',
    name: 'BMI Calculator',
    description: 'Calculate your Body Mass Index and get AI-powered health suggestions.',
    icon: <Calculator size={32} />,
    color: 'blue'
  },
  {
    id: 'chat',
    name: 'AI Trainer',
    description: 'Chat with Streak, your personal AI fitness trainer, for advice and motivation.',
    icon: <MessageSquare size={32} />,
    color: 'purple'
  },
  {
    id: 'library',
    name: 'Exercise Library',
    description: 'Browse a curated list of exercises with step-by-step instructions and visuals.',
    icon: <Dumbbell size={32} />,
    color: 'green'
  },
  {
    id: 'settings',
    name: 'App Settings',
    description: 'Customize your experience, toggle Day/Night mode, and manage your account.',
    icon: <Settings size={32} />,
    color: 'slate'
  },
  {
    id: 'stats',
    name: 'Stats Summary',
    description: 'View your overall progress, activity charts, and historical performance data.',
    icon: <BarChart3 size={32} />,
    color: 'cyan'
  }
];

export default function Dashboard({ onViewChange }: { onViewChange: (view: string) => void }) {
  return (
    <div className="space-y-12 py-8">
      <div className="max-w-3xl space-y-6">
        <h2 className="text-5xl font-black tracking-tight uppercase italic leading-none">
          Your Personal <span className="text-blue-600">Fitness</span> Command Center
        </h2>
        <div className="space-y-4">
          <p className="text-xl text-dim font-medium leading-relaxed">
            FitStreak is a comprehensive fitness management platform designed to help you build lasting habits and track every aspect of your wellness journey.
          </p>
          <p className="text-lg text-muted-custom font-medium leading-relaxed">
            From logging intense workouts to analyzing your nutrition with AI, our tools are built to provide you with the insights you need to succeed. Select a module below to begin your daily session.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => onViewChange(feature.id)}
            className="glass group cursor-pointer p-8 rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all flex flex-col h-full relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${feature.color}-500/10 blur-3xl rounded-full group-hover:bg-${feature.color}-500/20 transition-all`} />
            
            <div className={`w-16 h-16 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center text-${feature.color}-500 mb-6 group-hover:scale-110 transition-transform`}>
              {feature.icon}
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-2xl font-black uppercase italic tracking-tight">{feature.name}</h3>
              <p className="text-sm text-muted-custom font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-ghost group-hover:text-blue-500 transition-colors">
              <span>Open Module</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
