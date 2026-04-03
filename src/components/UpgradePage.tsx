
import React from 'react';
import { Crown, CheckCircle, XCircle } from 'lucide-react';

interface UpgradePageProps {
    onLogin: () => void;
}

const UpgradePage: React.FC<UpgradePageProps> = ({ onLogin }) => {
    const handleUpgradeClick = () => {
        onLogin();
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Pilih Paket yang Tepat Untukmu</h2>
                <p className="text-gray-500 mt-2">Buka semua fitur tanpa batas dan tingkatkan produktivitas Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* FREE PLAN */}
                <div className="border border-gray-200 rounded-xl p-8 flex flex-col bg-white shadow-sm">
                    <h3 className="text-2xl font-bold text-rose-600">Gratis</h3>
                    <p className="text-gray-500 mt-2">Untuk mencoba dan penggunaan dasar.</p>
                    <div className="text-4xl font-bold text-gray-800 mt-6">Rp 0</div>
                    <ul className="space-y-4 mt-8 text-gray-700 flex-grow">
                        <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-rose-500" /><span>5 Penggunaan Prompt Engine</span></li>
                        <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-rose-500" /><span>5 Penggunaan Brand Voice</span></li>
                        <li className="flex items-center gap-3"><XCircle className="w-5 h-5 text-gray-400" /><span>Akses Fitur Pro Mendatang</span></li>
                        <li className="flex items-center gap-3"><XCircle className="w-5 h-5 text-gray-400" /><span>Dukungan Prioritas</span></li>
                    </ul>
                    <button disabled className="w-full mt-8 py-3 px-6 bg-gray-200 text-gray-400 font-bold rounded-lg cursor-not-allowed">
                        Termasuk
                    </button>
                </div>

                {/* PRO PLAN */}
                <div className="border-2 border-rose-500 rounded-xl p-8 flex flex-col relative bg-white shadow-lg">
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"><div className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Paling Populer</div></div>
                    <h3 className="text-2xl font-bold text-gray-800">Pro</h3>
                    <p className="text-gray-500 mt-2">Untuk content creator dan marketer profesional.</p>
                    <div className="text-4xl font-bold text-gray-800 mt-6">Rp 99.000 <span className="text-lg font-normal text-gray-500">/bulan</span></div>
                    <ul className="space-y-4 mt-8 text-gray-700 flex-grow">
                        <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-rose-500" />
                            <span>10x Prompt Engine per hari</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-rose-500" />
                            <span>5x Penggunaan Brand Voice per hari</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-rose-500" />
                            <span>Fitur Unduh & Refine Tanpa Batas</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-rose-500" />
                            <span>Dukungan Prioritas</span>
                        </li>
                    </ul>
                    <button 
                        onClick={handleUpgradeClick} 
                        className="w-full mt-8 py-3 px-6 bg-rose-200 hover:bg-rose-300 text-rose-800 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        Select Plan
                        <Crown className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradePage;
