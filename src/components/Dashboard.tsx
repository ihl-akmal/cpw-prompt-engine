
import React, { useState, useEffect } from 'react';
import PromptEngine from './PromptEngine';
import BrandVoiceGenerator from './BrandVoiceGenerator';
import { LayoutDashboard, Mic2, ExternalLink, Crown, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { UserProfile } from '../services/firebase';

interface DashboardProps {
    userProfile: UserProfile;
    handleLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile, handleLogout }) => {
    const [currentView, setCurrentView] = useState<'prompt' | 'brand-voice'>('prompt');
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showPricing, setShowPricing] = useState(false);

    // States for Prompt Engine
    const [promptUsage, setPromptUsage] = useState(0);
    const [promptRefineUsage, setPromptRefineUsage] = useState(0);

    // States for Brand Voice
    const [brandVoiceUsage, setBrandVoiceUsage] = useState(0);
    const [brandVoiceRefineUsage, setBrandVoiceRefineUsage] = useState(0);
    const [brandVoiceDownloadUsage, setBrandVoiceDownloadUsage] = useState(0);

    // Load all user limits from localStorage on component mount
    useEffect(() => {
        setPromptUsage(parseInt(localStorage.getItem('user_prompt_engine_usage') || '0', 10));
        setPromptRefineUsage(parseInt(localStorage.getItem('user_prompt_refine_usage') || '0', 10));
        setBrandVoiceUsage(parseInt(localStorage.getItem('user_brand_voice_usage') || '0', 10));
        setBrandVoiceRefineUsage(parseInt(localStorage.getItem('user_brand_voice_refine_usage') || '0', 10));
        setBrandVoiceDownloadUsage(parseInt(localStorage.getItem('user_brand_voice_download_usage') || '0', 10));
    }, []);

    // Handlers that update state and localStorage
    const handleSetPromptUsage = (count: number) => {
        localStorage.setItem('user_prompt_engine_usage', count.toString());
        setPromptUsage(count);
    };
    const handleSetPromptRefineUsage = (count: number) => {
        localStorage.setItem('user_prompt_refine_usage', count.toString());
        setPromptRefineUsage(count);
    };
    const handleSetBrandVoiceUsage = (count: number) => {
        localStorage.setItem('user_brand_voice_usage', count.toString());
        setBrandVoiceUsage(count);
    };
    const handleSetBrandVoiceRefineUsage = (count: number) => {
        localStorage.setItem('user_brand_voice_refine_usage', count.toString());
        setBrandVoiceRefineUsage(count);
    };
    const handleSetBrandVoiceDownloadUsage = (count: number) => {
        localStorage.setItem('user_brand_voice_download_usage', count.toString());
        setBrandVoiceDownloadUsage(count);
    };


    const handleUpgrade = async () => {
        if (!userProfile) return;

        if (userProfile.name && userProfile.name.toLowerCase().includes('juri')) {
            setIsUpgrading(true);
            alert("MODE DEMO JURI: Proses pembayaran akan disimulasikan tanpa tagihan nyata. Klik OK untuk melanjutkan.");

            setTimeout(() => {
                window.location.href = `${window.location.origin}?payment=success`;
            }, 2000);
            return;
        }

        setIsUpgrading(true);
        try {
            const payload = {
                name: userProfile.name || 'valued user',
                email: userProfile.email || '',
                userId: userProfile.uid,
                origin: window.location.origin
            };

            if (!payload.email) {
                alert("Email pengguna tidak ditemukan. Tidak dapat melanjutkan pembayaran.");
                throw new Error("User email is missing.");
            }

            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal membuat link pembayaran.');
            }

            if (data.linkUrl) {
                window.location.href = data.linkUrl;
            } else {
                throw new Error("URL pembayaran tidak ditemukan.");
            }

        } catch (error) {
            console.error("Failed to create payment link:", error);
            alert(`Gagal memulai proses upgrade. Silakan coba lagi. Error: ${(error as Error).message}`);
            setIsUpgrading(false);
        }
    }

    if (showPricing) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-8"
                >
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white">Pilih Paket yang Tepat Untukmu</h2>
                        <p className="text-zinc-400 mt-2">Jadilah Pro dan buka semua fitur tanpa batas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* FREE PLAN */}
                        <div className="border border-zinc-700 rounded-xl p-8 flex flex-col">
                            <h3 className="text-2xl font-bold text-emerald-400">Gratis</h3>
                            <p className="text-zinc-400 mt-2">Untuk mencoba dan penggunaan dasar.</p>
                            <div className="text-4xl font-bold mt-6">Rp 0</div>
                            <ul className="space-y-4 mt-8 text-zinc-300 flex-grow">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>5x Prompt Engine per hari</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>3x Penggunaan Brand Voice per hari</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-zinc-500" />
                                    <span>Fitur Unduh & Refine Terbatas</span>
                                </li>
                                 <li className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-zinc-500" />
                                    <span>Dukungan Prioritas</span>
                                </li>
                            </ul>
                            <button disabled className="w-full mt-8 py-3 px-6 bg-zinc-700 text-zinc-400 font-bold rounded-lg cursor-not-allowed">
                                Paket Saat Ini
                            </button>
                        </div>

                        {/* PRO PLAN */}
                        <div className="border-2 border-emerald-500 rounded-xl p-8 flex flex-col relative neo-shadow-emerald">
                             <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                <div className="bg-emerald-500 text-zinc-950 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                    Paling Populer
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white">Pro</h3>
                            <p className="text-zinc-400 mt-2">Untuk content creator dan marketer profesional.</p>
                            <div className="text-4xl font-bold mt-6">Rp 99.000 <span className="text-lg font-normal text-zinc-400">/sekali bayar</span></div>
                            <ul className="space-y-4 mt-8 text-zinc-300 flex-grow">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>10x Prompt Engine per hari</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>5x Penggunaan Brand Voice per hari</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>Fitur Unduh & Refine Tanpa Batas</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>Dukungan Prioritas</span>
                                </li>
                            </ul>
                            <button 
                                onClick={handleUpgrade} 
                                disabled={isUpgrading}
                                className={cn("w-full mt-8 py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2", {
                                    "opacity-50 cursor-not-allowed": isUpgrading
                                })}
                            >
                                {isUpgrading ? 'Loading...' : 'Upgrade Sekarang'}
                                {!isUpgrading && <Crown className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                     <div className="text-center mt-8">
                        <button onClick={() => setShowPricing(false)} className="text-zinc-400 hover:text-white transition-colors">
                           Kembali ke Dashboard
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className='flex items-center gap-4'>
                     <img src={userProfile.photoURL || undefined} alt={userProfile.name || 'User'} className='w-12 h-12 rounded-full border-2 border-emerald-500' />
                    <div>
                        <h1 className="text-xl font-bold">Welcome, {userProfile.name}</h1>
                        {userProfile.isPro ? (
                            <p className='flex items-center gap-2 text-amber-400 text-sm'>
                                <Crown className='w-4 h-4 fill-current'/> 
                                <span className='font-bold'>Pro Plan</span>
                            </p>
                        ) : (
                            <p className='text-zinc-400 text-sm'>You are on the <span className='font-bold text-emerald-400'>Free Plan</span>. </p>
                        )}
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    {!userProfile.isPro && (
                        <button 
                            onClick={() => setShowPricing(true)} 
                            className='px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-all text-sm neo-shadow flex items-center gap-2'
                        >
                            Upgrade to Pro
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={handleLogout} className='px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors text-sm'>
                        Logout
                    </button>
                </div>
            </div>

            <div className="md:flex justify-center mb-8">
                <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 w-full md:w-auto">
                    <button
                        onClick={() => setCurrentView('prompt')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                            currentView === 'prompt' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                        )}
                    >
                        <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Prompt Engine
                    </button>
                    <button
                        onClick={() => setCurrentView('brand-voice')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                            currentView === 'brand-voice' ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                        )}
                    >
                        <Mic2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Brand Voice
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentView === 'prompt' ? (
                <motion.div
                    key="prompt-dash"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <PromptEngine 
                        onUpgrade={() => setShowPricing(true)} 
                        usageCount={promptUsage}
                        setUsageCount={handleSetPromptUsage}
                        refineUsageCount={promptRefineUsage}
                        setRefineUsageCount={handleSetPromptRefineUsage}
                        isLoggedIn={true}
                    />
                </motion.div>
                ) : (
                <motion.div
                    key="brand-voice-dash"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <BrandVoiceGenerator 
                        onUpgrade={() => setShowPricing(true)}
                        usageCount={brandVoiceUsage}
                        setUsageCount={handleSetBrandVoiceUsage}
                        refineUsageCount={brandVoiceRefineUsage}
                        setRefineUsageCount={handleSetBrandVoiceRefineUsage}
                        downloadUsageCount={brandVoiceDownloadUsage}
                        setDownloadUsageCount={handleSetBrandVoiceDownloadUsage}
                        isLoggedIn={true}
                    />
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
