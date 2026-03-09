
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  LayoutDashboard,
  Mic2,
  LogIn,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { cn } from './utils/cn';
import Dashboard from './components/Dashboard';
import { auth, googleProvider, isFirebaseConfigured, getUserProfile, type UserProfile } from './services/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import PromptEngine from './components/PromptEngine';
import BrandVoiceGenerator from './components/BrandVoiceGenerator';
import About from './components/About';

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshUserProfile = useCallback(async (user: User) => {
    try {
      const updatedProfile = await getUserProfile(user);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.error("Firebase config is not available.");
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await refreshUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [refreshUserProfile]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has('payment') && searchParams.get('payment') === 'success') {
      const user = auth.currentUser;
      if (user) {
        setTimeout(() => {
          refreshUserProfile(user);
        }, 2000); 
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, refreshUserProfile]);


  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      alert("Konfigurasi Firebase belum lengkap.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup closed by user.");
        return;
      }
      console.error("Authentication failed:", error);
      alert("Gagal masuk dengan Google.");
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
  
  const mainComponent = userProfile 
    ? <Dashboard userProfile={userProfile} handleLogout={handleLogout} /> 
    : <MainTools onLogin={handleGoogleLogin} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <Navbar userProfile={userProfile} onLogin={handleGoogleLogin} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <Routes>
          <Route path="/" element={userProfile ? <Navigate to="/dashboard" /> : mainComponent} />
          <Route path="/dashboard" element={userProfile ? mainComponent : <Navigate to="/" />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}


const Navbar = ({ userProfile, onLogin }: { userProfile: UserProfile | null, onLogin: () => void }) => {
  const navigate = useNavigate();
  
  const handleAuthAction = () => {
    if (userProfile) {
      navigate('/dashboard');
    } else {
      onLogin();
    }
  };

  return (
    <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={userProfile ? "/dashboard" : "/"} className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 fill-current" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-base sm:text-xl tracking-tight">
              promp<span className="text-emerald-500">topia</span>
            </span>
            <span className="font-cursive text-emerald-400 text-xs sm:text-lg -mt-0.5 sm:mt-0">
                by akmal
              </span>
          </div>
        </Link>
        
        <button 
          onClick={handleAuthAction}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-all text-xs sm:text-sm neo-shadow flex items-center gap-2"
        >
          {userProfile ? (
            userProfile.isPro ? <Crown className="w-4 h-4 text-amber-400" /> : <UserIcon className="w-4 h-4" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {userProfile ? 'Dashboard' : 'Upgrade to Pro'}
        </button>
      </div>
    </nav>
  );
}

const MainTools = ({ onLogin }: { onLogin: () => void }) => {
  const [currentView, setCurrentView] = useState<'prompt' | 'brand-voice'>('prompt');
  
  const [guestPromptUsage, setGuestPromptUsage] = useState(0);
  const [guestBrandVoiceUsage, setGuestBrandVoiceUsage] = useState(0);

  useEffect(() => {
    setGuestPromptUsage(parseInt(localStorage.getItem('guest_prompt_engine_usage') || '0', 10));
    setGuestBrandVoiceUsage(parseInt(localStorage.getItem('guest_brand_voice_usage') || '0', 10));
  }, []);

  const handleSetGuestPromptUsage = (count: number) => {
    localStorage.setItem('guest_prompt_engine_usage', count.toString());
    setGuestPromptUsage(count);
  };

  const handleSetGuestBrandVoiceUsage = (count: number) => {
    localStorage.setItem('guest_brand_voice_usage', count.toString());
    setGuestBrandVoiceUsage(count);
  };

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
          <motion.div key="prompt">
            <PromptEngine 
              onUpgrade={onLogin} 
              isLoggedIn={false} 
              usageCount={guestPromptUsage} 
              setUsageCount={handleSetGuestPromptUsage} 
              refineUsageCount={0}
              setRefineUsageCount={() => {}} 
            />
          </motion.div>
        ) : (
          <motion.div key="brand-voice">
             <BrandVoiceGenerator 
              onUpgrade={onLogin} 
              isLoggedIn={false} 
              usageCount={guestBrandVoiceUsage} 
              setUsageCount={handleSetGuestBrandVoiceUsage} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const Footer = () => (
  <footer className="border-t border-white/5 py-12 mt-20">
    <div className="max-w-7xl mx-auto px-4 text-center">
       <div className="flex justify-center gap-4 mb-4">
        <Link to="/" className="text-zinc-400 hover:text-zinc-200">Home</Link>
        <Link to="/about" className="text-zinc-400 hover:text-zinc-200">About</Link>
      </div>
      <p className="text-zinc-600 text-sm">© 2026 PROMPTENGINE. All rights reserved.</p>
    </div>
  </footer>
);

export default App;
