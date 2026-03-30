import React from 'react';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { Sun, Moon, LogOut, Settings as SettingsIcon, Shield, Bell, User } from 'lucide-react';

export default function Settings() {
  const [theme, setTheme] = React.useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
          <SettingsIcon size={24} />
        </div>
        <h2 className="text-3xl font-black uppercase italic tracking-tight">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <Sun className="text-yellow-500" size={20} />
            <h3 className="text-xl font-bold uppercase italic">Appearance</h3>
          </div>
          <p className="text-sm text-dim font-medium leading-relaxed">
            Choose between Day Mode and Night Mode for your interface.
          </p>
          <div className="flex p-1 bg-black/20 rounded-2xl border border-white/5">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                theme === 'light' ? 'bg-white text-black shadow-lg' : 'text-ghost hover:text-blue-500'
              }`}
            >
              <Sun size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Day Mode</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-ghost hover:text-blue-500'
              }`}
            >
              <Moon size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Night Mode</span>
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <User className="text-blue-500" size={20} />
            <h3 className="text-xl font-bold uppercase italic">Account</h3>
          </div>
          <p className="text-sm text-dim font-medium leading-relaxed">
            Manage your account settings and session.
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-red-500/20"
          >
            <LogOut size={20} />
            <span>Logout Session</span>
          </button>
        </div>

        {/* Notifications (Placeholder) */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <Bell className="text-purple-500" size={20} />
            <h3 className="text-xl font-bold uppercase italic">Notifications</h3>
          </div>
          <p className="text-sm text-white/40 font-medium leading-relaxed">
            Configure how you receive alerts and reminders.
          </p>
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
            <span className="text-xs font-bold uppercase tracking-widest">Push Notifications</span>
            <div className="w-10 h-6 bg-white/10 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Privacy (Placeholder) */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <Shield className="text-green-500" size={20} />
            <h3 className="text-xl font-bold uppercase italic">Privacy</h3>
          </div>
          <p className="text-sm text-white/40 font-medium leading-relaxed">
            Control your data and visibility settings.
          </p>
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
            <span className="text-xs font-bold uppercase tracking-widest">Public Profile</span>
            <div className="w-10 h-6 bg-white/10 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
