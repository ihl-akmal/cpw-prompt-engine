
import React, { useState, useEffect } from 'react';
import { getPromptHistory, type PromptHistoryItem } from '../services/userService';
import { UserProfile } from '../services/firebase';
import { Crown, LogOut, MessageSquare } from 'lucide-react';

interface SidebarProps {
  userProfile: UserProfile;
  handleLogout: () => void;
  onItemClick: (item: PromptHistoryItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userProfile, handleLogout, onItemClick }) => {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const items = await getPromptHistory();
      setHistory(items);
      setIsLoading(false);
    };

    fetchHistory();
  }, []);

  const truncateTitle = (title: string) => {
    if (title.length > 35) {
      return title.substring(0, 35) + '...';
    }
    return title;
  }

  return (
    <div className="h-full flex flex-col p-4 bg-white">
      {/* User Profile Section */}
      <div className="flex items-center gap-3 mb-4">
        <img src={userProfile.photoURL || undefined} alt={userProfile.name || 'User'} className='w-10 h-10 rounded-full border-2 border-rose-200' />
        <div>
            <h2 className="font-bold text-gray-800">Welcome, {userProfile.name}</h2>
            {userProfile.isPro ? (
                <p className='flex items-center gap-1.5 text-amber-600 text-xs font-semibold'>
                    <Crown className='w-4 h-4 fill-current'/> 
                    <span>Pro Plan</span>
                </p>
            ) : (
                <p className='text-gray-500 text-xs font-medium'>Free Plan</p>
            )}
        </div>
      </div>
      
      {/* Logout Button */}
      <button 
        onClick={handleLogout} 
        className='w-full text-left mb-6 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm flex items-center gap-2'
      >
          <LogOut className="w-4 h-4"/>
          Logout
      </button>

      {/* History Section */}
      <div className="flex-grow overflow-y-auto">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Recent</h3>
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-gray-200 rounded-md w-full"></div>
              <div className="h-8 bg-gray-200 rounded-md w-full"></div>
              <div className="h-8 bg-gray-200 rounded-md w-full"></div>
          </div>
        ) : history.length > 0 ? (
          <ul>
            {history.map((item) => (
              <li key={item.id} className="mb-1">
                <button 
                  onClick={() => onItemClick(item)}
                  className="text-left w-full text-sm text-gray-600 font-medium hover:bg-rose-50 rounded-md p-2 transition-colors flex items-center gap-3"
                >
                  <MessageSquare className='w-4 h-4 text-gray-400 flex-shrink-0' />
                  <span className='flex-grow'>{truncateTitle(item.lazyPrompt)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 p-2">No history yet.</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
