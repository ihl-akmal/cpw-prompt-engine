import React from 'react';
import type { User } from 'firebase/auth';

interface DashboardProps {
  user: User;
  handleLogout: () => void;
}

export default function Dashboard({ user, handleLogout }: DashboardProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold">Dashboard</h1>
          <p className="text-zinc-400">Selamat datang, {user.displayName || 'Pengguna'}!</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-display font-bold mb-4">Riwayat Penggunaan</h2>
          <p className="text-zinc-400">Riwayat penggunaan Anda akan ditampilkan di sini.</p>
          {/* Placeholder for history items */}
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-display font-bold mb-4">Upgrade to Pro</h2>
          <p className="text-zinc-400">Informasi dan proses pembayaran untuk upgrade akun ke versi Pro.</p>
          <button className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all w-full">
            Lihat Opsi Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}