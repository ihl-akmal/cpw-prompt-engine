
import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Mic2, 
  History, 
  Star,
  LogOut,
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

// Limits for logged-in free users
const PROMPT_ENGINE_LIMIT = 3;
const BRAND_VOICE_LIMIT = 2;
const REFINE_LIMIT = Infinity; // Unlimited

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
  const [mainView, setMainView] = useState<'tools' | 'upgrade'>('tools');
  
  const [promptUsage, setPromptUsage] = useState(0);
  const [brandVoiceUsage, setBrandVoiceUsage] = useState(0);
  const [refineUsage, setRefineUsage] = useState(0);

  const handleUpgradeClick = () => setMainView('upgrade');

  const renderContent = () => {
      if (mainView === 'upgrade') {
          return (
            <motion.div
                key="upgrade-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-8"
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
                            <PlanFeature text={`Limit ${PROMPT_ENGINE_LIMIT}x Prompt Engine`} included={true} />
                            <PlanFeature text={`Limit ${BRAND_VOICE_LIMIT}x Brand Voice Generator`} included={true} />
                            <PlanFeature text="Refine Prompt Tanpa Batas" included={true} />
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
                        <button className="mt-auto w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow">
                            Upgrade ke Premium
                        </button>
                    </div>
                </div>
            </motion.div>
          );
      }

      // Default to tools view
      if (currentTool === 'prompt') {
          return (
            <motion.div
              key="prompt-dash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PromptEngine 
                isLoggedIn={true}
                onUpgrade={handleUpgradeClick}
                usageCount={promptUsage}
                setUsageCount={setPromptUsage}
                refineUsageCount={refineUsage}
                setRefineUsageCount={setRefineUsage}
                maxUsage={PROMPT_ENGINE_LIMIT}
                maxRefineUsage={REFINE_LIMIT}
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
            >
              <BrandVoiceGenerator 
                 isLoggedIn={true}
                 onUpgrade={handleUpgradeClick}
                 usageCount={brandVoiceUsage}
                 setUsageCount={setBrandVoiceUsage}
                 maxUsage={BRAND_VOICE_LIMIT}
              />
            </motion.div>
          );
      }
  }

  return (
    <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 px-4">
      {/* --- Left Sidebar --- */}
      <aside className="hidden lg:flex flex-col gap-8">
        {/* User Profile Card */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
            <img 
                src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} 
                alt={user.displayName || "User Avatar"}
                className="w-24 h-24 rounded-full border-4 border-emerald-500/50 object-cover mb-4"
            />
            <h2 className="font-display font-bold text-xl truncate">{user.displayName || 'User Name'}</h2>
            <p className="text-xs text-zinc-400 mb-6 truncate w-full">{user.email}</p>
            <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
                <LogOut className="w-4 h-4"/>
                Logout
            </button>
        </div>

        {/* History Panel */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-emerald-400"/>
            <h3 className="font-display font-bold text-lg">Riwayat Prompting</h3>
          </div>
          <div className="space-y-2 text-sm text-zinc-500 text-center py-8">
            <p>Fitur riwayat akan segera hadir.</p>
          </div>
        </div>
        
        {/* Upgrade Panel */}
        <div className="glass rounded-2xl p-6 bg-gradient-to-tr from-emerald-500/10 to-transparent border border-emerald-500/30">
           <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-amber-400"/>
            <h3 className="font-display font-bold text-lg">Upgrade to Pro</h3>
          </div>
           <p className="text-sm text-zinc-400 mb-4">
            Dapatkan akses tanpa batas, fitur eksklusif, dan dukungan prioritas.
          </p>
           <button 
                onClick={handleUpgradeClick}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow">
            Lihat Opsi Upgrade
           </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main>
        {/* View Toggler */}
        <div className="md:flex justify-center mb-8">
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 w-full md:w-auto">
              <button
                onClick={() => { setMainView('tools'); setCurrentTool('prompt'); }}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                  mainView === 'tools' && currentTool === 'prompt' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Prompt Engine
              </button>
              <button
                onClick={() => { setMainView('tools'); setCurrentTool('brand-voice'); }}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                  mainView === 'tools' && currentTool === 'brand-voice' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Mic2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Brand Voice
              </button>
            </div>
        </div>
      
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>
    </div>
  );
}
