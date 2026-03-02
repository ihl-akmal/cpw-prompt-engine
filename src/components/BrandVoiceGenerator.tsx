import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Zap, 
  Copy, 
  Check, 
  ArrowRight, 
  Lock, 
  RefreshCcw, 
  FileText,
  User,
  ShieldAlert,
  MessageSquare,
  Download,
  Plus,
  X
} from 'lucide-react';
import { generateBrandVoice, refineBrandVoice, generateImprovementQuestion, type ImprovementQuestion } from '../services/gemini';
import { cn } from '../utils/cn';

const PRESET_ADJECTIVES = [
  "Menenangkan", "Terpercaya", "Modis", "Energetik", "Minimalis", 
  "Eksklusif", "Ramah", "Inovatif", "Tradisional", "Berani", 
  "Elegan", "Cerdas", "Humoris", "Empatik", "Otoritatif"
];

const MAX_BRAND_VOICE_TRIES = 1;

export default function BrandVoiceGenerator({ onUpgrade }: { onUpgrade: () => void }) {
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
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    const bCount = localStorage.getItem('brand_voice_usage_count');
    if (bCount) setUsageCount(parseInt(bCount, 10));
  }, []);

  const toggleAdjective = (adj: string) => {
    if (selectedAdjectives.includes(adj)) {
      setSelectedAdjectives(selectedAdjectives.filter(a => a !== adj));
    } else if (selectedAdjectives.length < 3) {
      setSelectedAdjectives([...selectedAdjectives, adj]);
    }
  };

  const addCustomAdjective = () => {
    if (customAdjective.trim() && !selectedAdjectives.includes(customAdjective) && selectedAdjectives.length < 3) {
      setSelectedAdjectives([...selectedAdjectives, customAdjective.trim()]);
      setCustomAdjective('');
    }
  };

  const handleGenerate = async () => {
    if (!brandName || !industry || !audience || selectedAdjectives.length === 0) return;

    if (usageCount >= MAX_BRAND_VOICE_TRIES) {
      onUpgrade();
      return;
    }
    
    setIsLoading(true);
    setImprovementData(null);
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
      
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('brand_voice_usage_count', newCount.toString());

      const data = await generateImprovementQuestion(brandName + " " + industry, result);
      setImprovementData(data);
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
    
    setIsRefining(true);
    try {
      const refined = await refineBrandVoice(generatedVoice, finalRefinement);
      setGeneratedVoice(refined);
      setManualRefinement('');
      
      const data = await generateImprovementQuestion(brandName, refined);
      setImprovementData(data);
    } catch (error) {
      console.error(error);
      alert('Failed to refine guide.');
    } finally {
      setIsRefining(false);
    }
  };

  const downloadAsDoc = () => {
    onUpgrade();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedVoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const remainingTries = MAX_BRAND_VOICE_TRIES - usageCount;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-2xl p-6 sm:p-8 space-y-6 relative"
        >
          {remainingTries <= 0 && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-2xl z-10">
                  <Lock className="w-12 h-12 text-emerald-500 mb-4" />
                  <h3 className="text-2xl font-display font-bold mb-2">Free Limit Reached</h3>
                  <button 
                      onClick={onUpgrade}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all neo-shadow"
                  >
                      Unlock Unlimited Access
                  </button>
              </div>
          )}
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
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Tiga Kata Sifat ({selectedAdjectives.length}/3)</label>
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
                  onClick={addCustomAdjective}
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
          <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
            <div className="bg-zinc-800 text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-full">
              {remainingTries > 0 ? `${remainingTries}x Free Trial` : "Limit Reached"}
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !brandName || !industry || !audience || selectedAdjectives.length === 0}
              className={cn(
                "w-full sm:w-auto py-4 px-8 rounded-xl font-bold transition-all neo-shadow flex items-center justify-center gap-2",
                isLoading || !brandName || !industry || !audience || selectedAdjectives.length === 0
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
              )}
            >
              {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {isLoading ? "Analyzing..." : "Generate Brand Voice"}
            </button>
          </div>
        </motion.div>

        {/* Output Area */}
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
            {generatedVoice && (
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
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-emerald-400 disabled:opacity-50"
                  title="Download as GDocs (.doc) - Pro feature"
                  disabled
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-grow bg-zinc-950/50 border border-white/5 rounded-xl p-6 font-sans text-sm leading-relaxed overflow-auto max-h-[700px]">
            {generatedVoice ? (
              <div className="prose prose-invert prose-emerald max-w-none">
                {generatedVoice.split('\n').map((line, i) => {
                  if (line.startsWith('#')) return <h3 key={i} className="text-emerald-400 font-display font-bold mt-4 mb-2">{line.replace(/#/g, '')}</h3>;
                  if (line.startsWith('-')) return <li key={i} className="text-zinc-300 ml-4">{line.substring(1)}</li>;
                  return <p key={i} className="text-zinc-300 mb-2">{line}</p>;
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-20">
                <User className="w-16 h-16 mb-4 opacity-10" />
                <p>Isi formulir di sebelah kiri untuk<br />melihat kepribadian brand Anda.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Improvement Section for Brand Voice */}
      <AnimatePresence>
        {generatedVoice && remainingTries > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
        )}
      </AnimatePresence>
    </div>
  );
}
