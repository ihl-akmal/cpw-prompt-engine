
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  LayoutDashboard,
  Mic2,
  LogIn,
  User as UserIcon,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { cn } from './utils/cn';
import { auth, googleProvider, isFirebaseConfigured, getUserProfile, type UserProfile } from './services/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import About from './components/About';

// Lazy load komponen
const Dashboard = lazy(() => import('./components/Dashboard'));
const PromptEngine = lazy(() => import('./components/PromptEngine'));
const BrandVoiceGenerator = lazy(() => import('./components/BrandVoiceGenerator'));
const UpgradePage = lazy(() => import('./components/UpgradePage'));

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

  const LoadingFallback = () => (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center text-gray-800">
      Memuat Halaman...
    </div>
  );

  if (authLoading) {
    return <LoadingFallback />;
  }
  
  const mainComponent = userProfile 
    ? <Dashboard userProfile={userProfile} handleLogout={handleLogout} /> 
    : <MainTools onLogin={handleGoogleLogin} />;

  return (
    <div className="min-h-screen bg-rose-50 text-gray-800 selection:bg-rose-500/30">
      <Navbar userProfile={userProfile} onLogin={handleGoogleLogin} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <Suspense fallback={<div className="text-center py-20">Memuat komponen...</div>}>
          <Routes>
            <Route path="/" element={userProfile ? <Navigate to="/dashboard" /> : mainComponent} />
            <Route path="/dashboard" element={userProfile ? mainComponent : <Navigate to="/" />} />
            <Route path="/upgrade" element={userProfile ? <Navigate to="/dashboard" /> : <UpgradePage onLogin={handleGoogleLogin} />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

const Navbar = ({ userProfile, onLogin }: { userProfile: UserProfile | null, onLogin: () => void }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAuthAction = () => {
    if (userProfile) {
      navigate('/dashboard');
    } else {
      onLogin();
    }
    setIsMenuOpen(false);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  }

  return (
    <nav className="border-b border-black/5 bg-rose-50/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={userProfile ? "/dashboard" : "/"} className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-rose-200 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-rose-800 fill-current" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-base sm:text-xl tracking-tight text-gray-800">
              promp<span className="text-rose-800">think</span>
            </span>
            <span className="text-xs font-semibold text-white bg-rose-800/80 px-1.5 py-0.5 text-center rounded-full">Beta Version</span>
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-4">
          {!userProfile && (
            <Link to="/upgrade" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="whitespace-nowrap">Upgrade to Pro</span>
            </Link>
          )}
          <button 
            onClick={handleAuthAction}
            className="px-4 py-2 bg-rose-200 text-rose-800 font-bold rounded-lg transition-all text-sm hover:bg-rose-300 flex items-center gap-2"
          >
            {userProfile ? (
              userProfile.isPro ? <Crown className="w-4 h-4 text-amber-400" /> : <UserIcon className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span className="whitespace-nowrap">{userProfile ? 'Dashboard' : 'Login/Register'}</span>
          </button>
        </div>

        {/* Mobile Nav Button */}
        <div className="sm:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-black/5">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden overflow-hidden"
          >
            <div className="pt-2 pb-4 px-4 flex flex-col gap-4">
              {!userProfile && (
                <button onClick={() => handleNavClick('/upgrade')} className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 p-2 rounded-md hover:bg-black/5">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Upgrade to Pro</span>
                </button>
              )}
              <button 
                onClick={handleAuthAction}
                className="px-4 py-2 bg-rose-200 text-rose-800 font-bold rounded-lg transition-all text-base hover:bg-rose-300 flex items-center justify-center gap-2"
              >
                {userProfile ? (
                  <UserIcon className="w-5 h-5" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                <span>{userProfile ? 'Dashboard' : 'Login/Register'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        <div className="flex items-center bg-white/50 rounded-xl p-1 border border-black/10 w-full md:w-auto shadow-sm">
            <button
              onClick={() => setCurrentView('prompt')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                currentView === 'prompt' ? "bg-rose-200 text-rose-800" : "text-gray-500 hover:text-rose-700"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Prompt Engine
            </button>
            <button
              onClick={() => setCurrentView('brand-voice')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                currentView === 'brand-voice' ? "bg-rose-200 text-rose-800" : "text-gray-500 hover:text-rose-700"
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
            <Suspense fallback={<div>Memuat...</div>}>
              <PromptEngine 
                onUpgrade={onLogin} 
                isLoggedIn={false} 
                usageCount={guestPromptUsage} 
                setUsageCount={handleSetGuestPromptUsage} 
                refineUsageCount={0}
                setRefineUsageCount={() => {}} 
              />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div key="brand-voice">
             <Suspense fallback={<div>Memuat...</div>}>
               <BrandVoiceGenerator 
                onUpgrade={onLogin} 
                isLoggedIn={false} 
                usageCount={guestBrandVoiceUsage} 
                setUsageCount={handleSetGuestBrandVoiceUsage} 
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const Footer = () => (
  <footer className="border-t border-black/5 py-12 mt-20">
    <div className="max-w-7xl mx-auto px-4 text-center">
       <div className="flex justify-center gap-4 mb-4">
        <Link to="/" className="text-gray-500 hover:text-gray-800">Home</Link>
        <Link to="/about" className="text-gray-500 hover:text-gray-800">About</Link>
      </div>
      <p className="text-gray-400 text-sm">© 2026 Prompthink. Dikembangkan oleh <u className="text-rose-800"><a href="https://grazedu.web.id">Grazedu.</a></u> All rights reserved.</p>
    </div>
  </footer>
);

export default App;
