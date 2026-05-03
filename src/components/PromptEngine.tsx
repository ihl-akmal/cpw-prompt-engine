
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Layers, Cpu, RefreshCcw, Sparkles, ArrowRight, 
  LogIn, Copy, Check, Star, X, Crown, Pencil, MessageSquare, ClipboardList, User
} from 'lucide-react';
import { generateSmartPrompt, generateImprovementQuestion, refinePrompt, type ImprovementQuestion } from '../services/gemini';
import { cn } from '../utils/cn';
import {
    getUserData,
    canPerformAction,
    incrementUsage,
    addPromptToHistory,
    PROMPT_ENGINE_LIMITS,
    PRO_PROMPT_ENGINE_LIMITS,
    type UserUsage
} from '../services/userService';

interface PromptEngineProps {
  onUpgrade: () => void;
  usageCount: number; 
  setUsageCount: (count: number) => void; 
  isLoggedIn?: boolean;
  refineUsageCount?: number; 
  setRefineUsageCount?: (count: number) => void; 
  initialLazyPrompt?: string | null;
  initialSmartPrompt?: string | null;
}

const GUEST_GENERATE_LIMIT = 2;

export default function PromptEngine({ 
  onUpgrade, 
  usageCount, 
  setUsageCount, 
  isLoggedIn = false,
  refineUsageCount = 0,
  setRefineUsageCount = () => {},
  initialLazyPrompt = null,
  initialSmartPrompt = null,
}: PromptEngineProps) {
  const [lazyPrompt, setLazyPrompt] = useState('');
  const [smartPrompt, setSmartPrompt] = useState('');
  
  // ... state lainnya tetap sama ...
  const [improvementData, setImprovementData] = useState<ImprovementQuestion | null>(null);
  const [manualRefinement, setManualRefinement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showProLimitPopup, setShowProLimitPopup] = useState(false);
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (initialLazyPrompt) {
        setLazyPrompt(initialLazyPrompt);
    }
    if (initialSmartPrompt) {
        setSmartPrompt(initialSmartPrompt);
    }
  }, [initialLazyPrompt, initialSmartPrompt]);

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
        if (isPro) setShowProLimitPopup(true);
        else setShowUpgradePopup(true);
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
        await addPromptToHistory(lazyPrompt, result);
        fetchUserData();
      } else {
        setUsageCount(usageCount + 1);
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
        if (isPro) setShowProLimitPopup(true);
        else setShowUpgradePopup(true);
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
      await addPromptToHistory(lazyPrompt, refined);
      fetchUserData();

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

  const generateLimit = isPro ? PRO_PROMPT_ENGINE_LIMITS.generate : PROMPT_ENGINE_LIMITS.generate;
  const refineLimit = isPro ? PRO_PROMPT_ENGINE_LIMITS.refine : PROMPT_ENGINE_LIMITS.refine;

  const remainingGenerate = isLoggedIn ? generateLimit - (userUsage?.promptEngine.generate || 0) : GUEST_GENERATE_LIMIT - usageCount;
  const remainingRefine = isLoggedIn ? refineLimit - (userUsage?.promptEngine.refine || 0) : 0;

  const renderProps = {
      isLoading, lazyPrompt, setLazyPrompt, handleGenerate, isLoggedIn,
      smartPrompt, copied, copyToClipboard, onUpgrade, improvementData,
      handleRefine, manualRefinement, setManualRefinement, isRefining, error,
      remainingGenerate, remainingRefine, usageCount, refineUsageCount
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
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-30"
          >
            <div className="relative bg-white border border-gray-200 p-8 rounded-2xl shadow-2xl">
              <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <Zap className="w-10 h-10 text-rose-500 mb-4 mx-auto" />
              <h3 className="text-xl font-display font-bold mb-2 text-gray-800">{title}</h3>
              <p className="text-gray-500 max-w-xs mb-6">{description}</p>
              <button
                onClick={() => { setShow(false); onUpgrade(); }}
                className="w-full bg-rose-200 text-rose-800 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-300 transition-colors"
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-30"
        >
          <div className="relative bg-white border border-gray-200 p-8 rounded-2xl shadow-2xl">
            <button onClick={() => setShowProLimitPopup(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <Zap className="w-10 h-10 text-rose-500 mb-4 mx-auto" />
            <h3 className="text-xl font-display font-bold mb-2 text-gray-800">Limit Harian Tercapai</h3>
            <p className="text-gray-500 max-w-xs mb-6">Limit harian anda telah tercapai, silahkan coba besok lagi.</p>
            <button
              onClick={() => setShowProLimitPopup(false)}
              className="w-full bg-rose-200 text-rose-800 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-300 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("space-y-8", !isLoggedIn && "relative")}>
      {!isLoggedIn && <LimitPopup />}
      {isLoggedIn && <LimitPopup isUpgrade />}
      {isLoggedIn && <ProLimitPopup />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderInput(renderProps)}
        {renderOutput(renderProps)}
      </div>
      <AnimatePresence>
        {smartPrompt && improvementData && !error && (
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {renderRefinement(renderProps)}
            </div>
        )}
      </AnimatePresence>
      
      {!isLoggedIn && renderHowToUse()}
      {!isLoggedIn && renderSecretToBetterAI()}
    </div>
  );
}

const renderHowToUse = () => (
    <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h2 className="text-3xl font-display font-bold text-gray-800 sm:text-4xl">Cara Mengoptimalkan Prompt Anda</h2>
                <p className="mt-3 text-lg text-gray-500">Dapatkan prompt kelas profesional dalam hitungan detik dengan tiga langkah sederhana.</p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="inline-block p-3 bg-rose-100 rounded-xl mb-4">
                        <Pencil className="w-7 h-7 text-rose-500" />
                    </div>
                    <p className="text-sm font-bold text-rose-800 mb-2 uppercase tracking-wider">Langkah 1</p>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-2">Tempel Draf Prompt</h3>
                    <p className="text-sm text-gray-500">Masukkan ide awal, pemikiran mentah, atau instruksi dasar Anda ke dalam kotak input.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="inline-block p-3 bg-rose-100 rounded-xl mb-4">
                        <Sparkles className="w-7 h-7 text-rose-500" />
                    </div>
                    <p className="text-sm font-bold text-rose-800 mb-2 uppercase tracking-wider">Langkah 2</p>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-2">AI Mengoptimalkan</h3>
                    <p className="text-sm text-gray-500">LLM kami menganalisis maksud Anda, menambahkan batasan, memformat, dan memperkaya konteks.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="inline-block p-3 bg-rose-100 rounded-xl mb-4">
                        <Copy className="w-7 h-7 text-rose-500" />
                    </div>
                    <p className="text-sm font-bold text-rose-800 mb-2 uppercase tracking-wider">Langkah 3</p>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-2">Siap Digunakan</h3>
                    <p className="text-sm text-gray-500">Salin prompt baru Anda dan gunakan di ChatGPT, Claude, Midjourney, atau alat AI lainnya.</p>
                </div>
            </div>
        </div>
    </div>
);

const renderSecretToBetterAI = () => (
    <div className="py-12 sm:py-16 bg-rose-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-display font-bold text-gray-800 sm:text-4xl">
                        Rahasia AI yang Lebih Baik? <span className="text-rose-800">Rekayasa Prompt</span>
                    </h2>
                    <p className="text-lg text-gray-500">
                        Seiring model AI menjadi lebih kuat, hambatannya bukan lagi kecerdasan model, melainkan kejelasan instruksi.
                    </p>
                    <p className="text-lg text-gray-500">
                        Pengoptimal Prompt AI kami pada dasarnya bertindak sebagai ahli rekayasa prompt yang duduk di sebelah Anda. Alat ini mengambil pemikiran kasar Anda dan secara otomatis menerapkan praktik terbaik industri untuk menjamin hasil yang luar biasa setiap saat.
                    </p>
                </div>
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex gap-6 items-center">
                        <div className="flex-shrink-0">
                            <div className="p-3 bg-rose-100 rounded-xl">
                                <MessageSquare className="w-7 h-7 text-rose-500" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg text-gray-800 mb-1">Konteks adalah Raja</h3>
                            <p className="text-sm text-gray-500">LLM tidak mengetahui tujuan bisnis Anda atau target audiens. Selalu berikan konteks latar belakang untuk hasil terbaik.</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex gap-6 items-center">
                        <div className="flex-shrink-0">
                            <div className="p-3 bg-rose-100 rounded-xl">
                                <ClipboardList className="w-7 h-7 text-rose-500" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg text-gray-800 mb-1">Jadilah Spesifik dengan Format</h3>
                            <p className="text-sm text-gray-500">Jangan hanya meminta 'ringkasan'. Mintalah 'ringkasan 3 poin menggunakan markdown dengan istilah kunci tebal'.</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex gap-6 items-center">
                        <div className="flex-shrink-0">
                            <div className="p-3 bg-rose-100 rounded-xl">
                                <User className="w-7 h-7 text-rose-500" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg text-gray-800 mb-1">Tentukan Persona</h3>
                            <p className="text-sm text-gray-500">Beri tahu AI harus bertindak sebagai siapa, ini akan membantu meningkatkan ekspektasi output yang kita harapkan.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const renderInput = ({ isLoading, lazyPrompt, setLazyPrompt, handleGenerate, isLoggedIn, remainingGenerate }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm h-full flex flex-col"
    >
        <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-rose-100 rounded-lg">
            <Layers className="w-5 h-5 text-rose-500" />
        </div>
        <h2 className="font-display font-bold text-xl text-gray-800">Input Lazy Prompt</h2>
        </div>

        <textarea
        value={lazyPrompt}
        onChange={(e) => setLazyPrompt(e.target.value)}
        placeholder="e.g., 'buatkan caption instagram tentang kopi'"
        className="w-full flex-grow bg-rose-50/50 border border-gray-300 rounded-xl p-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-all resize-none font-mono text-sm"
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-gray-400 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            AI Engine: Gemini 1.5 Flash
        </div>
        {isLoggedIn 
            ? <p className='text-xs text-rose-600 font-medium'>Sisa Kredit: {Math.max(0, remainingGenerate)}x</p>
            : <p className='text-xs text-rose-600 font-medium'>Sisa: {Math.max(0, remainingGenerate)}x</p>
        }
        <button
            onClick={handleGenerate}
            disabled={isLoading || !lazyPrompt.trim()}
            className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
            (isLoading || !lazyPrompt.trim())
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-rose-200 text-rose-800 hover:bg-rose-300"
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
        className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 relative flex flex-col shadow-sm h-full"
    >
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-800">Smart Prompt Result</h2>
        </div>
        {smartPrompt && !error && (
            <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-rose-600 flex items-center gap-2 text-sm"
            >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
            </button>
        )}
        </div>

        <div className="flex-grow bg-rose-50/50 border border-gray-200 rounded-xl p-6 font-mono text-sm leading-relaxed overflow-auto min-h-[200px] lg:min-h-0">
        {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-red-600">
                <Zap className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="font-bold text-lg mb-2">Gagal Generate</h3>
                <p className="text-gray-500">{error}</p>
            </div>
        ) : smartPrompt ? (
            <div className="whitespace-pre-wrap text-gray-700">{smartPrompt}</div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center py-12">
            {isLoading ? (
                <div className="flex items-center gap-3">
                    <RefreshCcw className="w-6 h-6 animate-spin text-rose-500" />
                    <span className="text-lg text-gray-600">Menganalisis...</span>
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
        className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm"
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                    <Zap className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="font-display font-bold text-xl text-gray-800">Improve Prompt</h2>
            </div>
            {isLoggedIn && <p className='text-xs text-rose-600 font-medium'>Sisa Refine: {Math.max(0, remainingRefine)}x</p>}
        </div>
        
        <div onClick={() => !isLoggedIn && onUpgrade()} className={!isLoggedIn ? 'cursor-pointer' : ''}>
        {improvementData ? (
            <div className="space-y-6">
                <div>
                <h3 className="text-gray-700 font-medium mb-4">{improvementData.question}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {improvementData.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleRefine(option)}
                        disabled={isRefining || !isLoggedIn}
                        className="px-4 py-2 bg-white hover:bg-rose-100 border border-gray-300 rounded-full text-xs text-gray-700 hover:text-rose-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full bg-rose-50/50 border border-gray-300 rounded-xl py-3 px-4 pr-12 text-sm text-gray-700 outline-none disabled:opacity-50 focus:ring-2 focus:ring-rose-400/50"
                    />
                    <button onClick={() => handleRefine('')} disabled={isRefining || !isLoggedIn} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rose-500 disabled:opacity-50">
                    <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                </div>
            </div>
        ) : (
            <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded-full w-24" />
                <div className="h-8 bg-gray-200 rounded-full w-32" />
                </div>
            </div>
        )}
        </div>

        {isRefining && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
                <div className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-2xl">
                    <RefreshCcw className="w-5 h-5 animate-spin text-rose-500" />
                    <span className="font-bold text-sm text-gray-700">Memperbarui Prompt...</span>
                </div>
            </div>
        )}

        {!isLoggedIn && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl p-8 text-center">
                <Star className='w-10 h-10 text-amber-400 mb-4' />
                <h3 className="font-display text-2xl font-bold mb-2 text-gray-800">Unlock Full Power</h3>
                <p className="text-gray-500 max-w-sm mb-6">Sign in to refine your prompt, get more generations, and access all pro features.</p>
                <button onClick={onUpgrade} className='bg-rose-200 text-rose-800 font-bold px-6 py-3 rounded-xl flex items-center gap-2'>
                    <LogIn className='w-5 h-5' />
                    Sign In to Continue
                </button>
            </div>
        )}
    </motion.div>
);
