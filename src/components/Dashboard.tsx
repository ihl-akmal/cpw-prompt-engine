
import React, { useState, useRef, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Mic2, 
  History, 
  Star,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '../utils/cn';
import PromptEngine from './PromptEngine';
import BrandVoiceGenerator from './BrandVoiceGenerator';

interface DashboardProps {
  user: User;
  handleLogout: () => void;
}

const PlanFeature = ({ text, included }: { text: string; included: boolean }) => (
  <li className="flex items-center gap-3">
    {included ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
    ) : (
      <XCircle className="w-5 h-5 text-zinc-600 shrink-0" />
    )}
    <span className={included ? 'text-zinc-200' : 'text-zinc-500'}>{text}</span>
  </li>
);

export default function Dashboard({ user, handleLogout }: DashboardProps) {
  const [currentTool, setCurrentTool] = useState<'prompt' | 'brand-voice'>('prompt');
  const [mainView, setMainView] = useState<'tools' | 'upgrade' | 'profile'>('tools');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [promptUsage, setPromptUsage] = useState(0);
  const [brandVoiceUsage, setBrandVoiceUsage] = useState(0);
  const [refineUsage, setRefineUsage] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleMenuClick = (view: 'upgrade' | 'profile') => {
    setMainView(view);
    setIsMenuOpen(false);
  };

  const renderContent = () => {
      switch (mainView) {
        case 'upgrade':
            return (
              <motion.div
                  key="upgrade-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-8 mt-8"
              >
                  <div className="text-center mb-8">
                      <h2 className="text-3xl sm:text-4xl font-display font-bold">Pilih Paket yang Tepat</h2>
                      <p className="text-zinc-400 mt-2">Buka potensi penuh PromptEngine dengan upgrade ke Pro.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                      {/* Free Plan */}
                      <div className="border border-white/10 rounded-xl p-6 flex flex-col">
                          <h3 className="text-2xl font-bold font-display text-emerald-500">FREE</h3>
                          <p className="text-zinc-400 text-sm h-12">Untuk mencoba dan penggunaan personal.</p>
                          <ul className="space-y-3 my-6">
                              <PlanFeature text={`Prompt Engine Terbatas`} included={true} />
                              <PlanFeature text={`Brand Voice Terbatas`} included={true} />
                              <PlanFeature text="Refine Prompt Terbatas" included={true} />
                              <PlanFeature text="Akses Fitur Baru" included={false} />
                              <PlanFeature text="Dukungan Prioritas" included={false} />
                          </ul>
                          <button className="mt-auto w-full py-3 bg-zinc-700 text-white font-bold rounded-xl cursor-default">Paket Anda Saat Ini</button>
                      </div>

                      {/* Premium Plan */}
                      <div className="border-2 border-amber-500 rounded-xl p-6 flex flex-col relative bg-gradient-to-b from-amber-500/5 to-transparent">
                          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                              <div className="bg-amber-500 text-zinc-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                  Paling Populer
                              </div>
                          </div>
                          <h3 className="text-2xl font-bold font-display text-amber-400">PREMIUM</h3>
                          <p className="text-zinc-400 text-sm h-12">Untuk profesional dan tim yang butuh performa maksimal.</p>
                          <ul className="space-y-3 my-6">
                              <PlanFeature text="Prompt Engine Tanpa Batas" included={true} />
                              <PlanFeature text="Brand Voice Generator Tanpa Batas" included={true} />
                              <PlanFeature text="Refine Prompt Tanpa Batas" included={true} />
                              <PlanFeature text="Akses Fitur Baru Lebih Awal" included={true} />
                              <PlanFeature text="Dukungan Prioritas" included={true} />
                          </ul>
                          <button onClick={() => handleMenuClick('upgrade')} className="mt-auto w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow">
                              Upgrade ke Premium
                          </button>
                      </div>
                  </div>
              </motion.div>
            );
        case 'profile':
            return (
                <motion.div
                    key="profile-view"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-8 mt-8 max-w-2xl mx-auto text-center"
                >
                    <h2 className="text-3xl font-display font-bold mb-6">Profil Akun</h2>
                    <img 
                        src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} 
                        alt={user.displayName || "User Avatar"}
                        className="w-32 h-32 rounded-full border-4 border-emerald-500/50 object-cover mb-4 mx-auto"
                    />
                    <h3 className="font-display font-bold text-2xl truncate">{user.displayName || 'User Name'}</h3>
                    <p className="text-lg text-zinc-400 mb-6 truncate w-full">{user.email}</p>
                    <button
                        onClick={handleLogout}
                        className="px-8 py-3 bg-red-600/80 hover:bg-red-500/80 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                        <LogOut className="w-5 h-5"/>
                        Logout
                    </button>
                </motion.div>
            )
        case 'tools':
        default:
          if (currentTool === 'prompt') {
              return (
                <motion.div
                  key="prompt-dash"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <PromptEngine 
                    isLoggedIn={true}
                    onUpgrade={() => handleMenuClick('upgrade')}
                    usageCount={promptUsage}
                    setUsageCount={setPromptUsage}
                    refineUsageCount={refineUsage}
                    setRefineUsageCount={setRefineUsage}
                  />
                </motion.div>
              );
          }

          if (currentTool === 'brand-voice') {
               return (
                <motion.div
                  key="brand-voice-dash"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <BrandVoiceGenerator 
                     isLoggedIn={true}
                     onUpgrade={() => handleMenuClick('upgrade')}
                     usageCount={brandVoiceUsage}
                     setUsageCount={setBrandVoiceUsage}
                  />
                </motion.div>
              );
          }
          return null;
      }
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* --- Header / Navigation --- */}
      <header className="flex items-center justify-between py-4">
        <div 
            className="font-display font-bold text-xl cursor-pointer"
            onClick={() => setMainView('tools')}
        >
          <span className="gradient-text">Prompt</span>Engine
        </div>

        {/* Tool Toggler */}
        {mainView === 'tools' && (
            <div className="hidden sm:flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => setCurrentTool('prompt')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg text-sm font-medium transition-all",
                    currentTool === 'prompt' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Prompt Engine
                </button>
                <button
                  onClick={() => setCurrentTool('brand-voice')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg text-sm font-medium transition-all",
                    currentTool === 'brand-voice' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Mic2 className="w-4 h-4" />
                  Brand Voice
                </button>
            </div>
        )}

        {/* User Menu Panel */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900">
            <img 
              src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} 
              alt={user.displayName || "User Avatar"}
              className="w-full h-full rounded-full object-cover"
            />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-14 right-0 w-80 glass rounded-2xl p-4 z-50 origin-top-right"
              >
                <div className="border-b border-white/10 pb-3 mb-3">
                    <p className="text-sm font-medium px-3 truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-zinc-400 px-3 truncate">{user.email}</p>
                </div>
                
                <nav className="flex flex-col gap-1">
                  <button onClick={() => handleMenuClick('profile')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/5 transition-colors w-full text-left">
                    <UserIcon className="w-5 h-5 text-emerald-400" />
                    <span>Akun Profil</span>
                  </button>
                  <button onClick={() => alert('Fitur Riwayat Segera Hadir!')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/5 transition-colors w-full text-left">
                    <History className="w-5 h-5 text-emerald-400" />
                    <span>Riwayat Prompting</span>
                  </button>

                  <button onClick={() => handleMenuClick('upgrade')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/5 transition-colors w-full text-left">
                    <Star className="w-5 h-5 text-amber-400" />
                    <span>Upgrade to Pro</span>
                  </button>

                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/5 transition-colors w-full text-left border-t border-white/10 mt-2 pt-3">
                    <LogOut className="w-5 h-5 text-red-500" />
                    <span>Logout</span>
                  </button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

       {/* View Toggler for Mobile */}
        {mainView === 'tools' && (
            <div className="sm:hidden flex items-center bg-white/5 rounded-xl p-1 border border-white/10 mt-4">
                <button
                  onClick={() => setCurrentTool('prompt')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    currentTool === 'prompt' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Prompt Engine
                </button>
                <button
                  onClick={() => setCurrentTool('brand-voice')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    currentTool === 'brand-voice' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Mic2 className="w-4 h-4" />
                  Brand Voice
                </button>
            </div>
        )}

      {/* --- Main Content --- */}
      <main>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>
    </div>
  );
}
