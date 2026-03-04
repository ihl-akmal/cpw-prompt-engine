
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Copy, 
  Check, 
  ArrowRight, 
  LogIn,
  RefreshCcw, 
  FileText,
  User,
  MessageSquare,
  Download,
  Plus,
  Star
} from 'lucide-react';
import { generateBrandVoice, refineBrandVoice, generateImprovementQuestion, type ImprovementQuestion } from '../services/gemini';
import { cn } from '../utils/cn';

const PRESET_ADJECTIVES = [
  "Menenangkan", "Terpercaya", "Modis", "Energetik", "Minimalis", 
  "Eksklusif", "Ramah", "Inovatif", "Tradisional", "Berani", 
  "Elegan", "Cerdas", "Humoris", "Empatik", "Otoritatif"
];

interface BrandVoiceGeneratorProps {
  onUpgrade: () => void;
  usageCount: number;
  setUsageCount: (count: number) => void;
  isLoggedIn?: boolean;
}

export default function BrandVoiceGenerator({ 
    onUpgrade, 
    usageCount, 
    setUsageCount, 
    isLoggedIn = false,
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

  const isLimitReached = false; // Menonaktifkan limit

  const toggleAdjective = (adj: string) => {
    if (selectedAdjectives.includes(adj)) {
      setSelectedAdjectives(selectedAdjectives.filter(a => a !== adj));
    } else if (selectedAdjectives.length < 5) { // Tingkatkan batas kata sifat
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
    
    setIsLoading(true);
    setImprovementData(null);
    setError(null);
    try {
      const result = await generateBrandVoice({
        name: brandName,
        industry,
        audience,
        adjectives: selectedAdjectives,
        antiVoice,
        example
      });
      setGeneratedVoice(result);
      
      const data = await generateImprovementQuestion(brandName + " " + industry, result);
      setImprovementData(data);

      const newCount = usageCount + 1;
      setUsageCount(newCount);
      if (!isLoggedIn) {
        localStorage.setItem('brand_voice_usage_count', newCount.toString());
      }
    } catch (error: any) {
      console.error("Generation Error:", error);
      if (error.message && error.message.includes('SAFETY')) {
        setError("Konten yang dihasilkan mungkin tidak aman. Coba ubah input Anda.");
      } else if (error.message && error.message.includes('TOKEN')) {
        setError("Input terlalu panjang. Coba perpendek atau upgrade paket untuk batas lebih tinggi.");
      } else {
        setError("Terjadi kesalahan sistem. Tim kami sedang menanganinya.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (refinement: string) => {
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
    } catch (error: any) {
        console.error("Refinement Error:", error);
        if (error.message && error.message.includes('SAFETY')) {
            setError("Konten yang dihasilkan mungkin tidak aman. Coba ubah input Anda.");
        } else {
            setError("Gagal melakukan refine. Coba lagi atau ubah instruksi.");
        }
    } finally {
      setIsRefining(false);
    }
  };

  const downloadAsDoc = () => {
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

  const mainContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {renderInputForm({
            brandName, setBrandName, industry, setIndustry, audience, setAudience, 
            selectedAdjectives, toggleAdjective, customAdjective, setCustomAdjective, 
            addCustomAdjective, antiVoice, setAntiVoice, example, setExample, 
            handleGenerate, isLoading, isLimitReached, isLoggedIn
        })}
        {renderOutputArea({ generatedVoice, copied, copyToClipboard, downloadAsDoc, isLimitReached, onUpgrade, isLoggedIn, error, isLoading })}
    </div>
  );

  if (isLoggedIn) {
      return (
          <div className="space-y-8">
            {mainContent}
            <AnimatePresence>
                {generatedVoice && !error && renderRefinementSection({ improvementData, handleRefine, manualRefinement, setManualRefinement, isRefining })}
            </AnimatePresence>
          </div>
      )
  }

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
        {generatedVoice && !error && renderRefinementSection({ improvementData, handleRefine, manualRefinement, setManualRefinement, isRefining })}
      </AnimatePresence>
    </div>
  );
}

// --- Reusable Render Functions ---

const renderInputForm = ({ brandName, setBrandName, industry, setIndustry, audience, setAudience, selectedAdjectives, toggleAdjective, customAdjective, setCustomAdjective, addCustomAdjective, antiVoice, setAntiVoice, example, setExample, handleGenerate, isLoading, isLimitReached, isLoggedIn }) => (
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
        <button
            onClick={handleGenerate}
            disabled={isLoading || !brandName || !industry || !audience || selectedAdjectives.length === 0}
            className={cn(
            "w-full py-4 rounded-xl font-bold transition-all neo-shadow flex items-center justify-center gap-2",
            isLoading || !brandName || !industry || !audience || selectedAdjectives.length === 0
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

const renderOutputArea = ({ generatedVoice, copied, copyToClipboard, downloadAsDoc, isLimitReached, onUpgrade, isLoggedIn, error, isLoading }) => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass rounded-2xl p-6 sm:p-8 min-h-[600px] flex flex-col relative"
    >
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-800 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="font-display font-bold text-xl">Brand Voice Guide</h2>
        </div>
        {generatedVoice && !error && (
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

        {isLimitReached && !generatedVoice && (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-10">
            {isLoggedIn ? (
                <>
                    <Star className="w-12 h-12 text-amber-400 mb-4" />
                    <h3 className="text-2xl font-display font-bold mb-2">Limit Tercapai</h3>
                    <p className="text-zinc-400 mb-6">Upgrade akun Anda untuk membuat Brand Voice Guide tanpa batas.</p>
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

const renderRefinementSection = ({ improvementData, handleRefine, manualRefinement, setManualRefinement, isRefining }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="glass rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto relative overflow-hidden"
    >
        <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-zinc-800 rounded-lg">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="font-display font-bold text-xl">Refine Brand Voice</h2>
        </div>
        
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
                    disabled={isRefining}
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
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
                <button
                onClick={() => handleRefine('')}
                disabled={!manualRefinement.trim() || isRefining}
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

        {isRefining && (
        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
            <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/10 rounded-full shadow-2xl">
            <RefreshCcw className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="font-bold text-sm">Memperbarui Guide...</span>
            </div>
        </div>
        )}
    </motion.div>
);
