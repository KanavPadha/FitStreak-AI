import React from 'react';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized for Firebase Auth. Please add "localhost" to your authorized domains in the Firebase Console (Authentication > Settings > Authorized domains).');
      } else {
        alert('Login failed: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <UserIcon size={16} />
            </div>
          )}
          <span className="text-sm font-medium hidden sm:inline-block">{user.displayName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
    >
      <LogIn size={18} />
      <span>Sign In with Google</span>
    </motion.button>
  );
}
