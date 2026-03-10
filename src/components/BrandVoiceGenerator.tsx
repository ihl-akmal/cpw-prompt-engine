
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Zap, Copy, Check, ArrowRight, LogIn, RefreshCcw, 
  FileText, User, MessageSquare, Download, Plus, Star, X, Crown
} from 'lucide-react';
import { generateBrandVoice, refineBrandVoice, generateImprovementQuestion, type ImprovementQuestion } from '../services/gemini';
import { cn } from '../utils/cn';
import {
    getUserData,
    canPerformAction,
    incrementUsage,
    BRAND_VOICE_LIMITS,
    PRO_BRAND_VOICE_LIMITS,
    type UserUsage
} from '../services/userService';

const PRESET_ADJECTIVES = [
  "Menenangkan", "Terpercaya", "Modis", "Energetik", "Minimalis", 
  "Eksklusif", "Ramah", "Inovatif", "Tradisional", "Berani", 
  "Elegan", "Cerdas", "Humoris", "Empatik", "Otoritatif"
];

interface BrandVoiceGeneratorProps {
  onUpgrade: () => void;
  usageCount: number; // Tetap ada untuk guest
  setUsageCount: (count: number) => void; // Tetap ada untuk guest
  isLoggedIn?: boolean;
  refineUsageCount?: number; // Akan diganti logikanya untuk user login
  setRefineUsageCount?: (count: number) => void; // Akan diganti logikanya untuk user login
  downloadUsageCount?: number; // Akan diganti logikanya untuk user login
  setDownloadUsageCount?: (count: number) => void; // Akan diganti logikanya untuk user login
}

export default function BrandVoiceGenerator({ 
    onUpgrade, 
    usageCount, 
    setUsageCount, 
    isLoggedIn = false,
    refineUsageCount = 0,
    setRefineUsageCount = () => {},
    downloadUsageCount = 0,
    setDownloadUsageCount = () => {},
}: BrandVoiceGeneratorProps) {
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [selectedAdjectives, setSelectedAdjectives] = useState<string[]>([]);
  const [customAdjective, setCustomAdjective] = useState('');
  const [antiVoice, setAntiVoice] = useState('');
  const [example, setExample] = useState('');
  
  const [generatedVoice, setGeneratedVoice] = useState('');
  const [improvementData, setImprovementData] = useState<ImprovementQuestion | null>(null);
  const [manualRefinement, setManualRefinement] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
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

  const toggleAdjective = (adj: string) => {
    if (selectedAdjectives.includes(adj)) {
      setSelectedAdjectives(selectedAdjectives.filter(a => a !== adj));
    } else if (selectedAdjectives.length < 5) {
      setSelectedAdjectives([...selectedAdjectives, adj]);
    }
  };

  const addCustomAdjective = () => {
    if (customAdjective.trim() && !selectedAdjectives.includes(customAdjective) && selectedAdjectives.length < 5) {
      setSelectedAdjectives([...selectedAdjectives, customAdjective.trim()]);
      setCustomAdjective('');
    }
  };

  const handleGenerate = async () => {
    if (!brandName || !industry || !audience || selectedAdjectives.length === 0) return;

    if (isLoggedIn) {
      const canGenerate = await canPerformAction('brandVoice', 'generate');
      if (!canGenerate) {
          if (isPro) {
              setShowProLimitPopup(true);
          } else {
              setShowUpgradePopup(true);
          }
          return;
      }
    } else {
      // Logika lama untuk guest tetap digunakan
      if (usageCount >= 1) {
          setShowLimitPopup(true);
          return;
      }
    }
    
    setIsLoading(true);
    setImprovementData(null);
    setError(null);
    try {
      const result = await generateBrandVoice({ name: brandName, industry, audience, adjectives: selectedAdjectives, antiVoice, example });
      setGeneratedVoice(result);
      
      const data = await generateImprovementQuestion(brandName + " " + industry, result);
      setImprovementData(data);

      if (isLoggedIn) {
        await incrementUsage('brandVoice', 'generate');
        fetchUserData(); // Refresh data kuota
      } else {
        setUsageCount(usageCount + 1); // Logika lama untuk guest
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
    
    const canRefine = await canPerformAction('brandVoice', 'refine');
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
      const refined = await refineBrandVoice(generatedVoice, finalRefinement);
      setGeneratedVoice(refined);
      setManualRefinement('');
      
      const data = await generateImprovementQuestion(brandName, refined);
      setImprovementData(data);
      
      await incrementUsage('brandVoice', 'refine');
      fetchUserData(); // Refresh data kuota
    } catch (error: any) {
        console.error("Refinement Error:", error);
        setError(error.message.includes('SAFETY') ? "Konten yang dihasilkan mungkin tidak aman. Coba ubah input Anda." : "Gagal melakukan refine. Coba lagi atau ubah instruksi.");
    } finally {
      setIsRefining(false);
    }
  };

  const downloadAsDoc = async () => {
    if (!isLoggedIn) {
        setShowDownloadPrompt(true);
        return;
    }

    const canDownload = await canPerformAction('brandVoice', 'download');
    if (!canDownload) {
        if (isPro) {
            setShowProLimitPopup(true);
        } else {
            setShowUpgradePopup(true);
        }
        return;
    }

    await incrementUsage('brandVoice', 'download');
    fetchUserData(); // Refresh data kuota
    
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Brand Voice Guide - ${brandName}</title></head>
      <body>
        <h1>Brand Voice Guide: ${brandName}</h1>
        <div style="font-family: Arial, sans-serif;">
          ${generatedVoice.replace(/\n/g, '<br>')}
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BrandVoice_${brandName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedVoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kalkulasi sisa kuota untuk ditampilkan di UI
  const generateLimit = isPro ? PRO_BRAND_VOICE_LIMITS.generate : BRAND_VOICE_LIMITS.generate;
  const refineLimit = isPro ? PRO_BRAND_VOICE_LIMITS.refine : BRAND_VOICE_LIMITS.refine;
  const downloadLimit = isPro ? PRO_BRAND_VOICE_LIMITS.download : BRAND_VOICE_LIMITS.download;

  const remainingGenerate = isLoggedIn ? generateLimit - (userUsage?.brandVoice.generate || 0) : 1 - usageCount;
  const remainingRefine = isLoggedIn ? refineLimit - (userUsage?.brandVoice.refine || 0) : 0;
  const remainingDownload = isLoggedIn ? downloadLimit - (userUsage?.brandVoice.download || 0) : 0;


  const renderProps = {
    brandName, setBrandName, industry, setIndustry, audience, setAudience, 
    selectedAdjectives, toggleAdjective, customAdjective, setCustomAdjective, 
    addCustomAdjective, antiVoice, setAntiVoice, example, setExample, 
    handleGenerate, isLoading, isLoggedIn,
    generatedVoice, copied, copyToClipboard, downloadAsDoc, onUpgrade, error,
    improvementData, handleRefine, manualRefinement, setManualRefinement, isRefining,
    showDownloadPrompt, setShowDownloadPrompt, 
    // Mengirim sisa kuota yang sudah dihitung
    usageCount, refineUsageCount, downloadUsageCount,
    remainingGenerate, remainingRefine, remainingDownload
  };
  
  const LimitPopup = ({ isUpgrade = false }) => {
    const title = isUpgrade ? "Batas Plan Gratis Tercapai" : "Batas Penggunaan Tercapai";
    const description = isUpgrade 
      ? "Upgrade ke PRO untuk generasi, refine, unduh, dan fitur tanpa batas."
      : "Buat akun gratis untuk mendapatkan lebih banyak kuota generasi!";
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

  const mainContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
        {!isLoggedIn && <LimitPopup />}
        {isLoggedIn && <LimitPopup isUpgrade />}
        {isLoggedIn && <ProLimitPopup />}
        {renderInputForm(renderProps)}
        {renderOutputArea(renderProps)}
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tighter mb-4">
          Brand <span className="gradient-text">Voice Generator</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Ciptakan kepribadian brand yang unik dan konsisten untuk memenangkan hati audiens Anda.
        </p>
      </div>
      {mainContent}
      <AnimatePresence>
        {generatedVoice && !error && renderRefinementSection(renderProps)}
      </AnimatePresence>
    </div>
  );
}

// --- Reusable Render Functions (Modifikasi Tampilan Kuota) ---

const renderInputForm = ({ brandName, setBrandName, industry, setIndustry, audience, setAudience, selectedAdjectives, toggleAdjective, customAdjective, setCustomAdjective, addCustomAdjective, antiVoice, setAntiVoice, example, setExample, handleGenerate, isLoading, isLoggedIn, remainingGenerate }) => (
    <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass rounded-2xl p-6 sm:p-8 space-y-6"
    >
        <div className="space-y-4">
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Nama Brand & Bidang</label>
            <div className="grid grid-cols-2 gap-4">
            <input 
                type="text" 
                placeholder="Nama Brand"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none"
            />
            <input 
                type="text" 
                placeholder="Bidang (e.g. Fashion)"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none"
            />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Target Audiens</label>
            <textarea 
            placeholder="Misal: Ibu muda usia 25-35, suka gaya simpel..."
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none h-20 resize-none"
            />
        </div>

        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Lima Kata Sifat ({selectedAdjectives.length}/5)</label>
            <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_ADJECTIVES.map(adj => (
                <button
                key={adj}
                onClick={() => toggleAdjective(adj)}
                className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-all border",
                    selectedAdjectives.includes(adj) 
                    ? "bg-emerald-500 border-emerald-500 text-zinc-950 font-bold" 
                    : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
                )}
                >
                {adj}
                </button>
            ))}
            </div>
            <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Ketik kata sifat lain..."
                value={customAdjective}
                onChange={(e) => setCustomAdjective(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomAdjective()}
                className="flex-grow bg-zinc-900/50 border border-white/10 rounded-xl py-2 px-4 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none"
            />
            <button 
                onClick={() => addCustomAdjective()}
                className="p-2 bg-zinc-800 rounded-xl border border-white/10 hover:bg-zinc-700"
            >
                <Plus className="w-5 h-5" />
            </button>
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Hal yang Dihindari (Anti-Voice)</label>
            <input 
            type="text" 
            placeholder="Misal: Jangan pakai bahasa gaul..."
            value={antiVoice}
            onChange={(e) => setAntiVoice(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none"
            />
        </div>

        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Contoh Kalimat (Opsional)</label>
            <input 
            type="text" 
            placeholder="Misal: Halo Kak, selamat datang di toko kami..."
            value={example}
            onChange={(e) => setExample(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none"
            />
        </div>
        </div>

        <div className="flex flex-col items-end gap-3 pt-4 border-t border-white/5">
        {isLoggedIn
            ? <p className='text-xs text-emerald-400 self-start'>Sisa Generasi: {Math.max(0, remainingGenerate)}x</p>
            : <p className='text-xs text-emerald-400 self-start'>Sisa penggunaan gratis: {Math.max(0, remainingGenerate)}x</p>
        }
        <button
            onClick={handleGenerate}
            disabled={isLoading || !brandName || !industry || !audience || selectedAdjectives.length === 0}
            className={cn(
            "w-full py-4 rounded-xl font-bold transition-all neo-shadow flex items-center justify-center gap-2",
            (isLoading || !brandName || !industry || !audience || selectedAdjectives.length === 0)
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
            )}
        >
            {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {isLoading ? "Menganalisis Brand..." : "Generate Brand Voice"}
        </button>
        </div>
    </motion.div>
);

const renderOutputArea = ({ generatedVoice, copied, copyToClipboard, downloadAsDoc, isLoggedIn, error, isLoading, showDownloadPrompt, setShowDownloadPrompt, onUpgrade, remainingDownload }) => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass rounded-2xl p-6 sm:p-8 min-h-[600px] flex flex-col relative"
    >
        <AnimatePresence>
        {showDownloadPrompt && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-20"
            >
                <div className="relative bg-zinc-900 border border-emerald-500/20 p-8 rounded-2xl shadow-2xl">
                    <button onClick={() => setShowDownloadPrompt(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <Download className="w-10 h-10 text-emerald-400 mb-4 mx-auto" />
                    <h3 className="text-xl font-display font-bold mb-2 text-white">Fitur Unduh untuk Member</h3>
                    <p className="text-zinc-400 max-w-xs mb-6">Dapatkan fitur unduh dengan masuk ke dashboard Anda.</p>
                    <button
                        onClick={() => {
                            setShowDownloadPrompt(false);
                            onUpgrade();
                        }}
                        className="w-full bg-emerald-500 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 neo-shadow hover:bg-emerald-400 transition-colors"
                    >
                        <LogIn className='w-5 h-5' />
                        Sign In
                    </button>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="font-display font-bold text-xl">Brand Voice Guide</h2>
            </div>
            {generatedVoice && !error && (
                <div className="flex items-center gap-4">
                {isLoggedIn && <p className='text-xs text-emerald-400'>Sisa Unduh: {Math.max(0, remainingDownload)}x</p>}
                <div className="flex gap-2">
                  <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-emerald-400"
                      title="Copy to clipboard"
                  >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                      onClick={downloadAsDoc}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-emerald-400"
                      title="Download as GDocs (.doc)"
                  >
                      <Download className="w-5 h-5" />
                  </button>
                </div>
                </div>
            )}
        </div>

        <div className="flex-grow bg-zinc-950/50 border border-white/5 rounded-xl p-6 font-sans text-sm leading-relaxed overflow-auto max-h-[700px]">
            {error ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-red-400">
                    <Zap className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="font-bold text-lg mb-2">Gagal Generate</h3>
                    <p className="text-zinc-400">{error}</p>
                </div>
            ) : generatedVoice ? (
                <div className="prose prose-invert prose-emerald max-w-none">
                {generatedVoice.split('\n').map((line, i) => {
                    if (line.startsWith('#')) return <h3 key={i} className="text-emerald-400 font-display font-bold mt-4 mb-2">{line.replace(/#/g, '')}</h3>;
                    if (line.startsWith('-')) return <li key={i} className="text-zinc-300 ml-4">{line.substring(1)}</li>;
                    return <p key={i} className="text-zinc-300 mb-2">{line}</p>;
                })}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-20">
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <RefreshCcw className="w-6 h-6 animate-spin text-emerald-500" />
                            <span className="text-lg">Menganalisis...</span>
                        </div>
                    ) : (
                        <>
                            <User className="w-16 h-16 mb-4 opacity-10" />
                            <p>Isi formulir di sebelah kiri untuk<br />melihat kepribadian brand Anda.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    </motion.div>
);

const renderRefinementSection = ({ improvementData, handleRefine, manualRefinement, setManualRefinement, isRefining, isLoggedIn, onUpgrade, remainingRefine }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="glass rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto relative overflow-hidden"
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="font-display font-bold text-xl">Refine Brand Voice</h2>
            </div>
            {isLoggedIn && <p className='text-xs text-emerald-400'>Sisa Refine: {Math.max(0, remainingRefine)}x</p>}
        </div>
        
        <div onClick={() => !isLoggedIn && onUpgrade()} className={!isLoggedIn ? 'cursor-pointer' : ''}>
            {improvementData ? (
            <div className="space-y-6">
                <div>
                <h3 className="text-zinc-200 font-medium mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {improvementData.question}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {improvementData.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleRefine(option)}
                        disabled={isRefining || !isLoggedIn}
                        className="px-4 py-2 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/50 rounded-full text-xs transition-all text-zinc-400 hover:text-emerald-400"
                    >
                        {option}
                    </button>
                    ))}
                </div>

                <div className="relative group">
                    <input
                    type="text"
                    value={manualRefinement}
                    onChange={(e) => setManualRefinement(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine('')}
                    placeholder="Atau berikan instruksi perbaikan manual..."
                    disabled={isRefining || !isLoggedIn}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                    <button
                    onClick={() => handleRefine('')}
                    disabled={!manualRefinement.trim() || isRefining || !isLoggedIn}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 disabled:text-zinc-700 transition-colors"
                    >
                    <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                </div>
            </div>
            ) : (
            <div className="space-y-4">
                <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                <div className="flex gap-2">
                <div className="h-8 bg-white/5 rounded-full w-24 animate-pulse" />
                <div className="h-8 bg-white/5 rounded-full w-32 animate-pulse" />
                </div>
            </div>
            )}
        </div>

        {isRefining && (
            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/10 rounded-full shadow-2xl">
                <RefreshCcw className="w-5 h-5 animate-spin text-emerald-500" />
                <span className="font-bold text-sm">Memperbarui Guide...</span>
                </div>
            </div>
        )}

        {!isLoggedIn && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl p-8 text-center">
                <Star className='w-10 h-10 text-amber-400 mb-4' />
                <h3 className="font-display text-2xl font-bold mb-2">Unlock Full Power</h3>
                <p className="text-zinc-400 max-w-sm mb-6">Sign in to refine your brand voice, get unlimited generations, and access all features.</p>
                <button onClick={onUpgrade} className='bg-emerald-500 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 neo-shadow'>
                    <LogIn className='w-5 h-5' />
                    Sign In to Continue
                </button>
            </div>
        )}
    </motion.div>
);
