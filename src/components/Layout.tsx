import React from 'react';
import Auth from './Auth';
import { Activity, Flame, Award, LayoutDashboard, Settings, Menu, X, Utensils, Clock, BarChart3, Calculator, MessageSquare, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ 
  children, 
  activeView, 
  onViewChange 
}: { 
  children: React.ReactNode, 
  activeView: string, 
  onViewChange: (view: string) => void 
}) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 size={20} /> },
    { id: 'workouts', label: 'Workouts', icon: <Activity size={20} /> },
    { id: 'nutrition', label: 'Nutrition', icon: <Utensils size={20} /> },
    { id: 'bmi', label: 'BMI', icon: <Calculator size={20} /> },
    { id: 'chat', label: 'AI Trainer', icon: <MessageSquare size={20} /> },
    { id: 'library', label: 'Library', icon: <Dumbbell size={20} /> },
    { id: 'badges', label: 'Badges', icon: <Award size={20} /> },
    { id: 'alarms', label: 'Alarms', icon: <Clock size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 glass border-b border-white/5 z-50 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform">
              <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">FitStreak</h1>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-custom">
          {navItems.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-2 transition-all hover:text-blue-500 ${activeView === item.id ? 'text-blue-600' : ''}`}
            >
              {item.label}
              {activeView === item.id && <motion.div layoutId="nav-active-dot" className="w-1 h-1 rounded-full bg-blue-500" />}
            </button>
          ))}
        </div>

        <Auth />
      </nav>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed top-20 left-0 bottom-0 w-72 glass border-r border-white/5 z-50 p-6 overflow-y-auto"
            >
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-ghost uppercase tracking-[0.2em] mb-4 px-4">Menu</p>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                      activeView === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'hover:bg-white/5 text-muted-custom hover:text-blue-500'
                    }`}
                  >
                    <span className={`${activeView === item.id ? 'text-white' : 'text-blue-500 group-hover:text-blue-400'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    {activeView === item.id && (
                      <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-12 p-6 rounded-3xl bg-blue-600/10 border border-blue-600/20">
                <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">Pro Tip</p>
                <p className="text-[10px] text-blue-200/60 leading-relaxed">
                  Consistency is more important than intensity. Keep your streak alive!
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 sm:px-12 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-ghost text-[10px] font-bold uppercase tracking-[0.3em]">
        <p>&copy; 2026 FitStreak AI • Built with Google AI Studio</p>
      </footer>
    </div>
  );
}

function NavLink({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 transition-all hover:text-white ${active ? 'text-white' : 'text-white/40'}`}
    >
      {icon}
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {active && <motion.div layoutId="nav-active" className="w-1 h-1 rounded-full bg-blue-500 ml-1" />}
    </button>
  );
}
