
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  LayoutDashboard,
  Mic2,
  LogIn,
  User as UserIcon
} from 'lucide-react';
import { cn } from './utils/cn';
import PromptEngine from './components/PromptEngine';
import BrandVoiceGenerator from './components/BrandVoiceGenerator';
import Dashboard from './components/Dashboard';

// Firebase Imports
import { auth, googleProvider, isFirebaseConfigured, firebaseConfig } from './services/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, type User } from 'firebase/auth';

// --- Main App Component ---
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// --- Content Wrapper to use hooks from react-router ---
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Auth Functions ---
  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      alert("Konfigurasi Firebase belum lengkap. Silakan periksa file .env.local dan restart server (npm run dev).");
      return;
    }
    if (user) {
      navigate('/dashboard');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Gagal masuk dengan Google. Periksa konsol untuk detail error.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <Navbar user={user} onLogin={handleGoogleLogin} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <MainTools onLogin={handleGoogleLogin} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} handleLogout={handleLogout} /> : <Navigate to="/" />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

// --- Navbar Component ---
const Navbar = ({ user, onLogin }: { user: User | null, onLogin: () => void }) => {
  const navigate = useNavigate();
  
  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      onLogin();
    }
  };

  return (
    <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 fill-current" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-base sm:text-xl tracking-tight">
              PROMPT<span className="text-emerald-500">ENGINE</span>
            </span>
          </div>
        </Link>
        
        <button 
          onClick={handleAuthAction}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-all text-xs sm:text-sm neo-shadow flex items-center gap-2"
        >
          {user ? <UserIcon className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {user ? 'Dashboard' : 'Login / Register'}
        </button>
      </div>
    </nav>
  );
}

// --- Main Tools Page (Prompt & Brand Voice) ---
const MainTools = ({ onLogin }: { onLogin: () => void }) => {
  const [currentView, setCurrentView] = useState<'prompt' | 'brand-voice'>('prompt');
  // Usage state is now managed locally for non-logged-in users
  const [promptUsage, setPromptUsage] = useState(0);
  const [brandVoiceUsage, setBrandVoiceUsage] = useState(0);
  const [refineUsage, setRefineUsage] = useState(0);

  // No more localStorage reading

  return (
    <>
      <div className="md:flex justify-center mb-8">
        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setCurrentView('prompt')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                currentView === 'prompt' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Prompt Engine
            </button>
            <button
              onClick={() => setCurrentView('brand-voice')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                currentView === 'brand-voice' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Mic2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Brand Voice
            </button>
          </div>
      </div>
    
      <AnimatePresence mode="wait">
        {currentView === 'prompt' ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PromptEngine 
              onUpgrade={onLogin} 
              usageCount={promptUsage}
              setUsageCount={setPromptUsage}
              refineUsageCount={refineUsage}
              setRefineUsageCount={setRefineUsage}
              isLoggedIn={false}
            />
          </motion.div>
        ) : (
          <motion.div
            key="brand-voice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BrandVoiceGenerator 
              onUpgrade={onLogin} 
              usageCount={brandVoiceUsage}
              setUsageCount={setBrandVoiceUsage}
              isLoggedIn={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Footer Component ---
const Footer = () => (
  <footer className="border-t border-white/5 py-12 mt-20">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <p className="text-zinc-600 text-sm">© 2024 PROMPTENGINE. All rights reserved.</p>
    </div>
  </footer>
);


export default App;
