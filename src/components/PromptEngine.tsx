
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Layers, Cpu, RefreshCcw, Sparkles, ArrowRight, 
  LogIn, Copy, Check, Star, X, Crown
} from 'lucide-react';
import { generateSmartPrompt, generateImprovementQuestion, refinePrompt, type ImprovementQuestion } from '../services/gemini';
import { cn } from '../utils/cn';
import {
    getUserData,
    canPerformAction,
    incrementUsage,
    PROMPT_ENGINE_LIMITS,
    PRO_PROMPT_ENGINE_LIMITS,
    type UserUsage
} from '../services/userService';

interface PromptEngineProps {
  onUpgrade: () => void;
  usageCount: number; // Tetap untuk guest
  setUsageCount: (count: number) => void; // Tetap untuk guest
  isLoggedIn?: boolean;
  refineUsageCount?: number; // Akan diganti logikanya
  setRefineUsageCount?: (count: number) => void; // Akan diganti logikanya
}

// Limit untuk guest
const GUEST_GENERATE_LIMIT = 2;

export default function PromptEngine({ 
  onUpgrade, 
  usageCount, 
  setUsageCount, 
  isLoggedIn = false,
  refineUsageCount = 0, // Prop ini tidak lagi digunakan untuk user login
  setRefineUsageCount = () => {}, // Prop ini tidak lagi digunakan untuk user login
}: PromptEngineProps) {
  const [lazyPrompt, setLazyPrompt] = useState('');
  const [smartPrompt, setSmartPrompt] = useState('');
  const [improvementData, setImprovementData] = useState<ImprovementQuestion | null>(null);
  const [manualRefinement, setManualRefinement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showProLimitPopup, setShowProLimitPopup] = useState(false);

  // State baru untuk menyimpan data dari Firestore
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [isPro, setIsPro] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (isLoggedIn) {
      const data = await getUserData();
      if (data) {
        setUserUsage(data.usage);
        setIsPro(data.isPro === true || data.plan === 'pro');
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchUserData();
  }, [isLoggedIn, fetchUserData]);

  const handleGenerate = async () => {
    if (!lazyPrompt.trim()) return;

    if (isLoggedIn) {
      const canGenerate = await canPerformAction('promptEngine', 'generate');
      if (!canGenerate) {
        if (isPro) {
            setShowProLimitPopup(true);
        } else {
            setShowUpgradePopup(true);
        }
        return;
      }
    } else {
      if (usageCount >= GUEST_GENERATE_LIMIT) {
        setShowLimitPopup(true);
        return;
      }
    }

    setIsLoading(true);
    setImprovementData(null);
    setError(null);
    try {
      const result = await generateSmartPrompt(lazyPrompt);
      setSmartPrompt(result);
      
      const data = await generateImprovementQuestion(lazyPrompt, result);
      setImprovementData(data);

      if (isLoggedIn) {
        await incrementUsage('promptEngine', 'generate');
        fetchUserData(); // Refresh kuota
      } else {
        setUsageCount(usageCount + 1); // Logika guest
      }
    } catch (error: any) {
      console.error("Generation Error:", error);
      setError(error.message.includes('SAFETY') ? "Konten yang dihasilkan mungkin tidak aman. Coba ubah input Anda." : "Terjadi kesalahan sistem. Tim kami sedang menanganinya.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (refinement: string) => {
    if (!isLoggedIn) {
      onUpgrade();
      return;
    }
    
    const canRefine = await canPerformAction('promptEngine', 'refine');
    if (!canRefine) {
        if (isPro) {
            setShowProLimitPopup(true);
        } else {
            setShowUpgradePopup(true);
        }
        return;
    }

    const finalRefinement = refinement || manualRefinement;
    if (!finalRefinement.trim() || isRefining) return;
    
    setIsRefining(true);
    setError(null);
    try {
      const refined = await refinePrompt(smartPrompt, finalRefinement, lazyPrompt);
      setSmartPrompt(refined);
      setManualRefinement('');
      
      const data = await generateImprovementQuestion(lazyPrompt, refined);
      setImprovementData(data);
      
      await incrementUsage('promptEngine', 'refine');
      fetchUserData(); // Refresh kuota

    } catch (error: any) {
      console.error("Refinement Error:", error);
      setError(error.message.includes('SAFETY') ? "Konten yang dihasilkan mungkin tidak aman. Coba ubah input Anda." : "Gagal melakukan refine. Coba lagi atau ubah instruksi.");
    } finally {
      setIsRefining(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(smartPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hitung sisa kuota --- PERBAIKAN DI SINI ---
  const generateLimit = isPro ? PRO_PROMPT_ENGINE_LIMITS.generate : PROMPT_ENGINE_LIMITS.generate;
  const refineLimit = isPro ? PRO_PROMPT_ENGINE_LIMITS.refine : PROMPT_ENGINE_LIMITS.refine;

  const remainingGenerate = isLoggedIn ? generateLimit - (userUsage?.promptEngine.generate || 0) : GUEST_GENERATE_LIMIT - usageCount;
  const remainingRefine = isLoggedIn ? refineLimit - (userUsage?.promptEngine.refine || 0) : 0;

  const renderProps = {
      isLoading,
      lazyPrompt,
      setLazyPrompt,
      handleGenerate,
      isLoggedIn,
      smartPrompt,
      copied,
      copyToClipboard,
      onUpgrade,
      improvementData,
      handleRefine,
      manualRefinement,
      setManualRefinement,
      isRefining,
      error,
      remainingGenerate,
      remainingRefine,
      usageCount,
      refineUsageCount
  }
  
  const LimitPopup = ({ isUpgrade = false }) => {
    const title = isUpgrade ? "Batas Plan Gratis Tercapai" : "Batas Penggunaan Tercapai";
    const description = isUpgrade 
      ? "Upgrade ke PRO untuk generasi, refine, dan fitur tanpa batas."
      : "Buat akun gratis untuk mendapatkan 10 generasi tambahan setiap bulan!";
    const buttonText = isUpgrade ? "Upgrade ke PRO" : "Sign In / Daftar Gratis";
    const Icon = isUpgrade ? Crown : LogIn;

    const show = isUpgrade ? showUpgradePopup : showLimitPopup;
    const setShow = isUpgrade ? setShowUpgradePopup : setShowLimitPopup;

    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-30"
          >
            <div className="relative bg-zinc-900 border border-amber-500/20 p-8 rounded-2xl shadow-2xl">
              <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <Zap className="w-10 h-10 text-amber-400 mb-4 mx-auto" />
              <h3 className="text-xl font-display font-bold mb-2 text-white">{title}</h3>
              <p className="text-zinc-400 max-w-xs mb-6">{description}</p>
              <button
                onClick={() => {
                  setShow(false);
                  onUpgrade();
                }}
                className="w-full bg-amber-500 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 neo-shadow hover:bg-amber-400 transition-colors"
              >
                <Icon className='w-5 h-5' />
                {buttonText}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const ProLimitPopup = () => (
    <AnimatePresence>
      {showProLimitPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-30"
        >
          <div className="relative bg-zinc-900 border border-amber-500/20 p-8 rounded-2xl shadow-2xl">
            <button onClick={() => setShowProLimitPopup(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <Zap className="w-10 h-10 text-amber-400 mb-4 mx-auto" />
            <h3 className="text-xl font-display font-bold mb-2 text-white">Limit Harian Tercapai</h3>
            <p className="text-zinc-400 max-w-xs mb-6">Limit harian anda telah tercapai, silahkan coba besok lagi.</p>
            <button
              onClick={() => setShowProLimitPopup(false)}
              className="w-full bg-amber-500 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 neo-shadow hover:bg-amber-400 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const parentDivClass = "space-y-12 relative";

  return (
    <div className={cn(parentDivClass, !isLoggedIn && "relative")}>
      {!isLoggedIn && <LimitPopup />}
      {isLoggedIn && <LimitPopup isUpgrade />}
      {isLoggedIn && <ProLimitPopup />}
      
      <div className="text-center">
        <h1 className="text-5xl sm:text-7xl font-display font-bold tracking-tighter mb-6 leading-tight">
          Stop Using <span className="text-zinc-500 line-through decoration-emerald-500/50">Lazy Prompts</span>.<br />
          Start Building <span className="gradient-text">Smart Content</span>.
        </h1>
        <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto">
          Transform your vague ideas into high-performing AI prompts optimized for GPT-4, Claude 3, and Gemini.
        </p>
      </div>

      <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        {renderInput(renderProps)}
        {renderOutput(renderProps)}
        {smartPrompt && improvementData && !error && renderRefinement(renderProps)}
      </div>
    </div>
  );
}

// --- Reusable Render Functions (Modifikasi Tampilan Kuota) ---
const renderInput = ({ isLoading, lazyPrompt, setLazyPrompt, handleGenerate, isLoggedIn, remainingGenerate }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 sm:p-8 relative overflow-hidden"
    >
        <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-zinc-800 rounded-lg">
            <Layers className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="font-display font-bold text-xl">Input Lazy Prompt</h2>
        </div>

        <textarea
        value={lazyPrompt}
        onChange={(e) => setLazyPrompt(e.target.value)}
        placeholder="e.g., 'buatkan caption instagram tentang kopi'"
        className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none font-mono text-sm"
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-zinc-500 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            AI Engine: Gemini 1.5 Flash
        </div>
        {isLoggedIn 
            ? <p className='text-xs text-emerald-400'>Sisa Generasi: {Math.max(0, remainingGenerate)}x</p>
            : <p className='text-xs text-emerald-400'>Sisa: {Math.max(0, remainingGenerate)}x</p>
        }
        <button
            onClick={handleGenerate}
            disabled={isLoading || !lazyPrompt.trim()}
            className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all neo-shadow",
            (isLoading || !lazyPrompt.trim())
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
            )}
        >
            {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {isLoading ? "Processing..." : "Generate Smart Prompt"}
        </button>
        </div>
    </motion.div>
);

const renderOutput = ({ smartPrompt, copied, copyToClipboard, error, isLoading }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 sm:p-8 relative min-h-[300px] flex flex-col"
    >
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-800 rounded-lg">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="font-display font-bold text-xl">Smart Prompt Result</h2>
        </div>
        {smartPrompt && !error && (
            <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-emerald-400 flex items-center gap-2 text-sm"
            >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
            </button>
        )}
        </div>

        <div className="flex-grow bg-zinc-950/50 border border-white/5 rounded-xl p-6 font-mono text-sm leading-relaxed overflow-auto max-h-[500px]">
        {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-red-400">
                <Zap className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="font-bold text-lg mb-2">Gagal Generate</h3>
                <p className="text-zinc-400">{error}</p>
            </div>
        ) : smartPrompt ? (
            <div className="whitespace-pre-wrap text-zinc-300">{smartPrompt}</div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-12">
            {isLoading ? (
                <div className="flex items-center gap-3">
                    <RefreshCcw className="w-6 h-6 animate-spin text-emerald-500" />
                    <span className="text-lg">Menganalisis...</span>
                </div>
            ) : (
                <p>Your optimized prompt will appear here.</p>
            )}
            </div>
        )}
        </div>
    </motion.div>
);

const renderRefinement = ({ improvementData, handleRefine, manualRefinement, setManualRefinement, isRefining, isLoggedIn, onUpgrade, remainingRefine }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="glass rounded-2xl p-6 sm:p-8 relative overflow-hidden"
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="font-display font-bold text-xl">Improve Prompt</h2>
            </div>
            {isLoggedIn && <p className='text-xs text-emerald-400'>Sisa Refine: {Math.max(0, remainingRefine)}x</p>}
        </div>
        
        <div onClick={() => !isLoggedIn && onUpgrade()} className={!isLoggedIn ? 'cursor-pointer' : ''}>
        {improvementData ? (
            <div className="space-y-6">
                <div>
                <h3 className="text-zinc-200 font-medium mb-4">{improvementData.question}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {improvementData.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleRefine(option)}
                        disabled={isRefining || !isLoggedIn}
                        className="px-4 py-2 bg-white/5 hover:bg-emerald-500/10 border border-white/10 rounded-full text-xs text-zinc-400 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {option}
                    </button>
                    ))}
                </div>
                <div className="relative">
                    <input
                    type="text"
                    value={manualRefinement}
                    onChange={(e) => setManualRefinement(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine('')}
                    placeholder="Atau ketik jawaban manual..."
                    disabled={isRefining || !isLoggedIn}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm text-zinc-200 outline-none disabled:opacity-50"
                    />
                    <button onClick={() => handleRefine('')} disabled={isRefining || !isLoggedIn} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 disabled:opacity-50">
                    <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                </div>
            </div>
        ) : (
            <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="flex gap-2">
                <div className="h-8 bg-white/5 rounded-full w-24" />
                <div className="h-8 bg-white/5 rounded-full w-32" />
                </div>
            </div>
        )}
        </div>

        {isRefining && (
            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/10 rounded-full shadow-2xl">
                    <RefreshCcw className="w-5 h-5 animate-spin text-emerald-500" />
                    <span className="font-bold text-sm">Memperbarui Prompt...</span>
                </div>
            </div>
        )}

        {!isLoggedIn && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl p-8 text-center">
                <Star className='w-10 h-10 text-amber-400 mb-4' />
                <h3 className="font-display text-2xl font-bold mb-2">Unlock Full Power</h3>
                <p className="text-zinc-400 max-w-sm mb-6">Sign in to refine your prompt, get unlimited generations, and access all features.</p>
                <button onClick={onUpgrade} className='bg-emerald-500 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 neo-shadow'>
                    <LogIn className='w-5 h-5' />
                    Sign In to Continue
                </button>
            </div>
        )}
    </motion.div>
);
