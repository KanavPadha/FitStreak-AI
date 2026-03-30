import React, { Component } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StatsSummary from './components/StatsSummary';
import StreakDisplay from './components/StreakDisplay';
import BadgeList from './components/BadgeList';
import WorkoutLog from './components/WorkoutLog';
import AlarmClock from './components/AlarmClock';
import MealCalculator from './components/MealCalculator';
import BMICalculator from './components/BMICalculator';
import AITrainer from './components/AITrainer';
import ExerciseLibrary from './components/ExerciseLibrary';
import Settings from './components/Settings';
import { auth, onAuthStateChanged, FirebaseUser, db, collection, query, where, getDocs } from './lib/firebase';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, AlertCircle, RefreshCw, Flame, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
          <div className="glass p-12 rounded-3xl max-w-md border-red-500/20 shadow-2xl shadow-red-500/10">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-8">
              <AlertCircle size={48} />
            </div>
            <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
            <p className="text-white/40 mb-8 font-medium">We encountered an unexpected error. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw size={20} />
              <span>Refresh Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [aiTip, setAiTip] = React.useState<string | null>(null);
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [activeView, setActiveView] = React.useState('dashboard');
  const [motivationalQuote, setMotivationalQuote] = React.useState('');

  const quotes = [
    "The only bad workout is the one that didn't happen.",
    "Action is the foundational key to all success.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
    "The hard part isn't getting your body in shape. The hard part is getting your mind in shape.",
    "Success starts with self-discipline.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "Don't stop when you're tired. Stop when you're done.",
    "A one-hour workout is only 4% of your day. No excuses.",
    "The difference between the impossible and the possible lies in a person's determination.",
    "If you want something you've never had, you must be willing to do something you've never done.",
    "The only way to define your limits is by going beyond them.",
    "Strength does not come from physical capacity. It comes from an indomitable will.",
    "You don't have to be great to start, but you have to start to be great.",
    "Your health is an investment, not an expense."
  ];

  React.useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMotivationalQuote(randomQuote);
  }, [user]);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const fetchAiTip = async () => {
    if (!user) return;
    setLoadingAi(true);
    try {
      const workoutsSnap = await getDocs(query(collection(db, 'workouts'), where('userId', '==', user.uid)));
      
      const workoutData = workoutsSnap.docs.map(d => ({ type: d.data().type, duration: d.data().duration }));

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file and restart the server.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze this fitness data and provide a short, punchy suggestion for improvement.
      Workouts: ${JSON.stringify(workoutData)}
      
      Keep it under 30 words. Focus on consistency and specific improvements.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setAiTip(result.text || "Keep pushing! Your streak is your power.");
    } catch (error: any) {
      console.error("AI Error:", error);
      const message = error.message || "Consistency is the key to progress. Keep going!";
      setAiTip(message);
    } finally {
      setLoadingAi(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchAiTip();
    }
  }, [user]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter uppercase italic">Welcome Back, {user?.displayName?.split(' ')[0]}</h2>
                <p className="text-xl text-blue-500 font-black uppercase italic tracking-widest leading-none">
                  "{motivationalQuote}"
                </p>
                <AnimatePresence mode="wait">
                  {aiTip && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl max-w-xl"
                    >
                      <Sparkles className="text-blue-500 shrink-0" size={20} />
                      <p className="text-sm font-medium text-blue-200 italic">"{aiTip}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <StreakDisplay />
            <Dashboard onViewChange={setActiveView} />
          </div>
        );
      case 'stats':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">Statistics & Progress</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <StatsSummary onViewChange={setActiveView} />
          </div>
        );
      case 'workouts':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">Workout Logs</h2>
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Back
                </button>
                <WorkoutLog />
              </div>
            </div>
            <StatsSummary onViewChange={setActiveView} />
          </div>
        );
      case 'nutrition':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">Nutrition Tracker</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <MealCalculator user={user} />
          </div>
        );
      case 'bmi':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">BMI Calculator</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <BMICalculator />
          </div>
        );
      case 'chat':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">AI Trainer Chat</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <AITrainer />
          </div>
        );
      case 'library':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">Exercise Library</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <ExerciseLibrary user={user} />
          </div>
        );
      case 'alarms':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">Reminders & Alarms</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <AlarmClock />
          </div>
        );
      case 'badges':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">Achievements</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <BadgeList />
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase italic">App Settings</h2>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            <Settings />
          </div>
        );
      default:
        return <Dashboard onViewChange={setActiveView} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeView={activeView} onViewChange={setActiveView}>
        {!user ? (
          <div className="py-20 text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-widest border border-blue-500/20">
                <Sparkles size={14} />
                <span>AI-Powered Fitness Tracking</span>
              </div>
              <h2 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none italic uppercase">
                Build Your <span className="text-blue-600">Legacy</span> One Day At A Time
              </h2>
              <p className="text-xl text-muted-custom font-medium max-w-2xl mx-auto">
                Join thousands of athletes tracking their daily streaks, logging workouts, and earning badges with FitStreak.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="p-1 bg-white/5 rounded-2xl">
                  <div className="px-8 py-4 bg-white text-black rounded-xl font-bold text-lg cursor-pointer hover:bg-white/90 transition-colors">
                    Get Started Free
                  </div>
                </div>
                <div className="px-8 py-4 border border-white/10 rounded-xl font-bold text-lg hover:bg-white/5 transition-colors cursor-pointer">
                  Learn More
                </div>
              </div>
            </motion.div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
              <FeatureCard icon={<Flame className="text-orange-500" />} title="Streak System" desc="Maintain your daily momentum and watch your streak grow." />
              <FeatureCard icon={<Activity className="text-blue-500" />} title="Workout Logs" desc="Track every activity with detailed metrics and notes." />
              <FeatureCard icon={<Sparkles className="text-purple-500" />} title="AI Coaching" desc="Get personalized tips and motivation from our AI coach." />
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </Layout>
    </ErrorBoundary>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass p-8 rounded-3xl text-left space-y-4 hover:border-white/20 transition-all">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-sm text-muted-custom leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function InsightItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-dim">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}
