import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  RefreshCcw, 
  Rocket,
  Check,
  LayoutDashboard,
  Mic2
} from 'lucide-react';
import { cn } from './utils/cn';
import PromptEngine from './components/PromptEngine';
import BrandVoiceGenerator from './components/BrandVoiceGenerator';

type View = 'prompt' | 'brand-voice';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('prompt');
  const [showPricing, setShowPricing] = useState(false);
  const [promptUsage, setPromptUsage] = useState(0);
  const [refineUsage, setRefineUsage] = useState(0);

  useEffect(() => {
    const pCount = localStorage.getItem('prompt_usage_count');
    if (pCount) setPromptUsage(parseInt(pCount, 10));
    const rCount = localStorage.getItem('refine_usage_count');
    if (rCount) setRefineUsage(parseInt(rCount, 10));
  }, []);

  const resetUsage = () => {
    setPromptUsage(0);
    setRefineUsage(0);
    localStorage.setItem('prompt_usage_count', '0');
    localStorage.setItem('refine_usage_count', '0');
    localStorage.setItem('brand_voice_usage_count', '0');
    setShowPricing(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 fill-current" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-base sm:text-xl tracking-tight">
                PROMPT<span className="text-emerald-500">ENGINE</span>
              </span>
              <span className="font-cursive text-emerald-400 text-xs sm:text-lg -mt-0.5 sm:mt-0">
                by akmal
              </span>
            </div>
          </div>
          
          {/* Desktop Switcher */}
          <div className="hidden md:flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setCurrentView('prompt')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                currentView === 'prompt' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Prompt Engine
            </button>
            <button
              onClick={() => setCurrentView('brand-voice')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                currentView === 'brand-voice' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Mic2 className="w-4 h-4" />
              Brand Voice
            </button>
          </div>

          <button 
            onClick={() => setShowPricing(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-all text-xs sm:text-sm neo-shadow flex items-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        </div>

        {/* Mobile Switcher */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 w-full">
            <button
              onClick={() => setCurrentView('prompt')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                currentView === 'prompt' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Prompt Engine
            </button>
            <button
              onClick={() => setCurrentView('brand-voice')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                currentView === 'brand-voice' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400"
              )}
            >
              <Mic2 className="w-3.5 h-3.5" />
              Brand Voice
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {currentView === 'prompt' ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PromptEngine 
                onUpgrade={() => setShowPricing(true)} 
                usageCount={promptUsage}
                setUsageCount={setPromptUsage}
              />
            </motion.div>
          ) : (
            <motion.div
              key="brand-voice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BrandVoiceGenerator onUpgrade={() => setShowPricing(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <Rocket className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-2">Upgrade to Pro</h2>
                <p className="text-zinc-400">Unlock unlimited access to all AI tools.</p>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  "Unlimited Smart Prompts",
                  "Unlimited Brand Voice Guides",
                  "Priority AI processing",
                  "Save & Export all results",
                  "Advanced Custom Templates"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow mb-4">
                Get Started Now
              </button>
              
              <button 
                onClick={resetUsage}
                className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs underline"
              >
                Reset usage (Demo only)
              </button>
              
              <button 
                onClick={() => setShowPricing(false)}
                className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zinc-600 text-sm">© 2026 Copywriting Prompt Engine. Built for the creative elite.</p>
        </div>
      </footer>
    </div>
  );
}
