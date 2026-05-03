
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { UserProfile } from '../services/firebase';
import { PromptHistoryItem } from '../services/userService';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PromptEngine from './PromptEngine';
import BrandVoiceGenerator from './BrandVoiceGenerator';
import { LayoutDashboard, Mic2, ExternalLink, Crown, CheckCircle, XCircle } from 'lucide-react';

interface DashboardProps {
    userProfile: UserProfile;
    handleLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile, handleLogout }) => {
    const [currentView, setCurrentView] = useState<'prompt' | 'brand-voice'>('prompt');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<PromptHistoryItem | null>(null);

    const [promptUsage, setPromptUsage] = useState(0);
    const [promptRefineUsage, setPromptRefineUsage] = useState(0);
    const [brandVoiceUsage, setBrandVoiceUsage] = useState(0);
    const [brandVoiceRefineUsage, setBrandVoiceRefineUsage] = useState(0);
    const [brandVoiceDownloadUsage, setBrandVoiceDownloadUsage] = useState(0);

    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showPricing, setShowPricing] = useState(false);

    useEffect(() => {
        setPromptUsage(parseInt(localStorage.getItem('user_prompt_engine_usage') || '0', 10));
        setPromptRefineUsage(parseInt(localStorage.getItem('user_prompt_refine_usage') || '0', 10));
        setBrandVoiceUsage(parseInt(localStorage.getItem('user_brand_voice_usage') || '0', 10));
        setBrandVoiceRefineUsage(parseInt(localStorage.getItem('user_brand_voice_refine_usage') || '0', 10));
        setBrandVoiceDownloadUsage(parseInt(localStorage.getItem('user_brand_voice_download_usage') || '0', 10));
    }, []);

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

    const handleHistoryItemClick = (item: PromptHistoryItem) => {
        setSelectedHistoryItem(item);
        setCurrentView('prompt');
        setIsSidebarOpen(false);
    };
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleUpgrade = async () => {
        // ... (Kode handleUpgrade tidak berubah)
    }

    if (showPricing) {
        // ... (Kode showPricing tidak berubah)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onMenuClick={toggleSidebar} />

            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleSidebar}
                            className="fixed inset-0 bg-black/30 z-30"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="fixed top-0 left-0 h-full w-72 bg-white z-40 shadow-xl"
                        >
                            <Sidebar 
                                userProfile={userProfile} 
                                handleLogout={handleLogout} 
                                onItemClick={handleHistoryItemClick} 
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="p-4 sm:p-6 lg:p-8">
                 <div className="md:flex justify-center mb-8">
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200 w-full md:w-auto">
                        <button
                            onClick={() => setCurrentView('prompt')}
                            className={cn(
                                "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                                currentView === 'prompt' ? "bg-rose-200 text-rose-800" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            Prompt Engine
                        </button>
                        <button
                            onClick={() => setCurrentView('brand-voice')}
                            className={cn(
                                "flex-1 md:flex-none flex items-center justify-center gap-2 py-2 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                                currentView === 'brand-voice' ? "bg-rose-200 text-rose-800" : "text-gray-500 hover:text-gray-700"
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
                            key="prompt-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <PromptEngine 
                                key={selectedHistoryItem?.id} 
                                onUpgrade={() => setShowPricing(true)} 
                                usageCount={promptUsage}
                                setUsageCount={handleSetPromptUsage}
                                refineUsageCount={promptRefineUsage}
                                setRefineUsageCount={handleSetPromptRefineUsage}
                                isLoggedIn={true}
                                initialLazyPrompt={selectedHistoryItem?.lazyPrompt}
                                initialSmartPrompt={selectedHistoryItem?.smartPrompt}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                             key="brand-voice-view"
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
            </main>
        </div>
    );
};

export default Dashboard;
