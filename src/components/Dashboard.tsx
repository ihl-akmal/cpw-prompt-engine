
import React, { useState } from 'react';
import PromptEngine from './PromptEngine';
import BrandVoiceGenerator from './BrandVoiceGenerator';
import { LayoutDashboard, Mic2, ExternalLink, Crown } from 'lucide-react';
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
    
    const [promptUsage, setPromptUsage] = useState(0);
    const [brandVoiceUsage, setBrandVoiceUsage] = useState(0);
    const [refineUsage, setRefineUsage] = useState(0);

    const handleUpgrade = async () => {
        if (!userProfile) return;

        // --- JURY/DEMO MODE ---
        // Jika nama pengguna mengandung kata "juri", kita simulasikan pembayaran.
        if (userProfile.name && userProfile.name.toLowerCase().includes('juri')) {
            setIsUpgrading(true);
            alert("MODE DEMO JURI: Proses pembayaran akan disimulasikan tanpa tagihan nyata. Klik OK untuk melanjutkan.");

            setTimeout(() => {
                // Langsung arahkan ke halaman sukses, seolah-olah pembayaran berhasil.
                window.location.href = `${window.location.origin}?payment=success`;
            }, 2000); // Tunggu 2 detik untuk efek simulasi
            return; // Hentikan eksekusi kode di bawah
        }

        // --- REAL PAYMENT MODE ---
        setIsUpgrading(true);
        try {
            const payload = {
                name: userProfile.name || 'valued user',
                email: userProfile.email || '',
                userId: userProfile.uid
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
            setIsUpgrading(false); // Penting: set upgrading ke false jika terjadi error
        }
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
                            onClick={handleUpgrade} 
                            disabled={isUpgrading}
                            className={cn('px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-all text-sm neo-shadow flex items-center gap-2', {
                                'opacity-50 cursor-not-allowed': isUpgrading
                            })}
                        >
                            {isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
                            {!isUpgrading && <ExternalLink className="w-4 h-4" />}
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
                        onUpgrade={handleUpgrade} 
                        usageCount={promptUsage}
                        setUsageCount={setPromptUsage}
                        refineUsageCount={refineUsage}
                        setRefineUsageCount={setRefineUsage}
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
                        onUpgrade={handleUpgrade} 
                        usageCount={brandVoiceUsage}
                        setUsageCount={setBrandVoiceUsage}
                        isLoggedIn={true}
                    />
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
