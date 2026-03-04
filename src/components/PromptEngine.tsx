
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Layers,
  Cpu,
  RefreshCcw,
  Sparkles,
  ArrowRight,
  LogIn,
  Copy,
  Check,
  Star
} from 'lucide-react';
import { generateSmartPrompt, generateImprovementQuestion, refinePrompt, type ImprovementQuestion } from '../services/gemini';
import { cn } from '../utils/cn';

const MAX_FREE_TRIES = 1;
const MAX_REFINE_TRIES = 1;

interface PromptEngineProps {
  onUpgrade: () => void;
  usageCount: number;
  setUsageCount: (count: number) => void;
  isLoggedIn?: boolean;
  refineUsageCount?: number;
  setRefineUsageCount?: (count: number) => void;
  maxUsage?: number;
  maxRefineUsage?: number;
}

export default function PromptEngine({ 
  onUpgrade, 
  usageCount, 
  setUsageCount, 
  isLoggedIn = false,
  refineUsageCount = 0,
  setRefineUsageCount = () => {},
  maxUsage = MAX_FREE_TRIES,
  maxRefineUsage = MAX_REFINE_TRIES
}: PromptEngineProps) {
  const [lazyPrompt, setLazyPrompt] = useState('');
  const [smartPrompt, setSmartPrompt] = useState('');
  const [improvementData, setImprovementData] = useState<ImprovementQuestion | null>(null);
  const [manualRefinement, setManualRefinement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!lazyPrompt.trim()) return;
    
    if (usageCount >= maxUsage) {
      onUpgrade();
      return;
    }

    setIsLoading(true);
    setImprovementData(null);
    try {
      const result = await generateSmartPrompt(lazyPrompt);
      setSmartPrompt(result);
      
      const data = await generateImprovementQuestion(lazyPrompt, result);
      setImprovementData(data);

      const newCount = usageCount + 1;
      setUsageCount(newCount);
      if (!isLoggedIn) {
        localStorage.setItem('prompt_usage_count', newCount.toString());
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (refinement: string) => {
    const finalRefinement = refinement || manualRefinement;
    if (!finalRefinement.trim() || isRefining) return;

    if (refineUsageCount >= maxRefineUsage) {
      onUpgrade();
      return;
    }
    
    setIsRefining(true);
    try {
      const refined = await refinePrompt(smartPrompt, finalRefinement, lazyPrompt);
      setSmartPrompt(refined);
      setManualRefinement('');
      
      const data = await generateImprovementQuestion(lazyPrompt, refined);
      setImprovementData(data);

      const newCount = refineUsageCount + 1;
      setRefineUsageCount(newCount);
      if (!isLoggedIn) {
        localStorage.setItem('refine_usage_count', newCount.toString());
      }
    } catch (error) {
      console.error(error);
      alert('Failed to refine prompt.');
    } finally {
      setIsRefining(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(smartPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const remainingPrompts = maxUsage - usageCount;
  const remainingRefines = maxRefineUsage - refineUsageCount;
  const isLimitReached = remainingPrompts <= 0;
  const isRefineLimitReached = remainingRefines <= 0;

  const renderProps = {
      isLimitReached,
      remaining: remainingPrompts,
      isLoading,
      lazyPrompt,
      setLazyPrompt,
      handleGenerate,
      isLoggedIn,
      smartPrompt,
      copied,
      copyToClipboard,
      onUpgrade,
      isRefineLimitReached,
      remainingRefines: remainingRefines,
      improvementData,
      handleRefine,
      manualRefinement,
      setManualRefinement,
      isRefining
  }

  if (isLoggedIn) {
    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            {renderInput(renderProps)}
            {renderOutput(renderProps)}
            {smartPrompt && improvementData && renderRefinement(renderProps)}
        </div>
    );
  }

  return (
    <div className="space-y-12">
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
        {smartPrompt && improvementData && renderRefinement(renderProps)}
      </div>
    </div>
  );
}

// --- Reusable Render Functions ---
const renderInput = ({ isLimitReached, remaining, isLoading, lazyPrompt, setLazyPrompt, handleGenerate, isLoggedIn }) => (
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
        disabled={isLimitReached}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-zinc-500 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            AI Engine: Gemini 1.5 Flash
        </div>
        <div className={cn(
            "font-bold text-xs px-3 py-1.5 rounded-full",
            isLimitReached ? "bg-zinc-800 text-zinc-500" : "bg-zinc-800 text-emerald-400"
        )}>
            {isLimitReached ? "Limit Tercapai" : `Sisa: ${remaining}x`}
        </div>
        <button
            onClick={handleGenerate}
            disabled={isLoading || !lazyPrompt.trim() || isLimitReached}
            className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all neo-shadow",
            isLoading || !lazyPrompt.trim() || isLimitReached
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

const renderOutput = ({ smartPrompt, copied, copyToClipboard, isLimitReached, onUpgrade, isLoggedIn }) => (
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
        {smartPrompt && (
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
        {smartPrompt ? (
            <div className="whitespace-pre-wrap text-zinc-300">{smartPrompt}</div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-12">
            <p>Your optimized prompt will appear here.</p>
            </div>
        )}
        </div>

        {isLimitReached && !smartPrompt && (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-10">
            {isLoggedIn ? (
                <>
                    <Star className="w-12 h-12 text-amber-400 mb-4" />
                    <h3 className="text-2xl font-display font-bold mb-2">Limit Tercapai</h3>
                    <p className="text-zinc-400 mb-6">Upgrade akun Anda untuk melanjutkan generating & refining tanpa batas.</p>
                    <button 
                        onClick={onUpgrade}
                        className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow flex items-center gap-2"
                    >
                        <Star className="w-5 h-5" /> Upgrade ke Pro
                    </button>
                </>
            ) : (
                <>
                    <LogIn className="w-12 h-12 text-emerald-500 mb-4" />
                    <h3 className="text-2xl font-display font-bold mb-2">Limit Gratis Tercapai</h3>
                    <p className="text-zinc-400 mb-6">Daftar atau masuk untuk mendapatkan lebih banyak limit.</p>
                    <button 
                        onClick={onUpgrade}
                        className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow flex items-center gap-2"
                    >
                        <LogIn className="w-5 h-5" /> Login / Daftar
                    </button>
                </>
            )}
            </div>
        )}
    </motion.div>
);

const renderRefinement = ({ isRefineLimitReached, remainingRefines, improvementData, handleRefine, manualRefinement, setManualRefinement, isRefining, onUpgrade, isLoggedIn }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 sm:p-8 relative overflow-hidden"
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="font-display font-bold text-xl">Improve Prompt</h2>
            </div>
            <div className={cn(
                "font-bold text-xs px-3 py-1.5 rounded-full",
                 isRefineLimitReached ? "bg-zinc-800 text-zinc-500" : "bg-zinc-800 text-emerald-400"
            )}>
                {isRefineLimitReached ? "Limit Tercapai" : `Sisa Refine: ${remainingRefines}x`}
            </div>
        </div>
        
        <div className="space-y-6">
            <div>
            <h3 className="text-zinc-200 font-medium mb-4">{improvementData.question}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {improvementData.options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleRefine(option)}
                    disabled={isRefining || isRefineLimitReached}
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
                disabled={isRefining || isRefineLimitReached}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm text-zinc-200 outline-none disabled:opacity-50"
                />
                <button onClick={() => handleRefine('')} disabled={isRefining || isRefineLimitReached} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 disabled:opacity-50">
                <ArrowRight className="w-5 h-5" />
                </button>
            </div>
            </div>
        </div>

        {isRefining && (
            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
            <RefreshCcw className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
        )}

        {isRefineLimitReached && (
             <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-10">
             {isLoggedIn ? (
                 <>
                     <Star className="w-12 h-12 text-amber-400 mb-4" />
                     <h3 className="text-2xl font-display font-bold mb-2">Limit Refine Tercapai</h3>
                     <p className="text-zinc-400 mb-6">Upgrade akun Anda untuk melanjutkan refining tanpa batas.</p>
                     <button 
                         onClick={onUpgrade}
                         className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow flex items-center gap-2"
                     >
                         <Star className="w-5 h-5" /> Upgrade ke Pro
                     </button>
                 </>
             ) : (
                 <>
                     <LogIn className="w-12 h-12 text-emerald-500 mb-4" />
                     <h3 className="text-2xl font-display font-bold mb-2">Limit Refine Tercapai</h3>
                     <p className="text-zinc-400 mb-6">Untuk melanjutkan, silakan masuk dengan akun Anda.</p>
                     <button 
                         onClick={onUpgrade}
                         className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow flex items-center gap-2"
                     >
                         <LogIn className="w-5 h-5" /> Login / Daftar
                     </button>
                 </>
             )}
             </div>
        )}
    </motion.div>
);
