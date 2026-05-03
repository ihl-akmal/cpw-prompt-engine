
import React from 'react';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-gray-100">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
            <img src="/lightning.png" alt="logo" className="w-7 h-7" />
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-display text-gray-800">promptthink</span>
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-1 rounded-md">Beta Version</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
