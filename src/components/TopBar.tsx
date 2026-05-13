import React from 'react';
import { Search, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

interface TopBarProps {
  title: string;
  onOpenSettings?: () => void;
}

export default function TopBar({ title, onOpenSettings }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="flex justify-between items-center h-20 px-8 w-full sticky top-0 z-40 bg-surface border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-3xl font-extrabold text-secondary italic tracking-tight">{title}</h2>
        <div className="hidden lg:flex items-center bg-surface-container-low border-2 border-black px-3 py-1 rounded-full gap-2">
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
          <span className="font-data text-[10px] uppercase tracking-tighter">Updating Real-time...</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block text-on-surface">
          <input 
            type="text" 
            className="bg-surface-container-low border-2 border-black px-4 py-2 w-64 text-sm focus:ring-0 focus:border-secondary outline-none rounded-none" 
            placeholder="Search data points..." 
          />
          <Search size={18} className="absolute right-3 top-2.5 text-on-surface-variant" />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => alert('No priority notifications at this time.')}
            className="p-2 text-on-surface-variant hover:bg-secondary hover:text-on-secondary transition-all border-2 border-transparent hover:border-black rounded-lg"
          >
            <Bell size={20} />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 text-on-surface-variant hover:bg-secondary hover:text-on-secondary transition-all border-2 border-transparent hover:border-black rounded-lg"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-on-surface-variant hover:bg-error hover:text-on-error transition-all border-2 border-transparent hover:border-black rounded-lg"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
          
          <div className="h-10 w-10 border-2 border-black rounded-full overflow-hidden ml-2 bg-primary-container">
            <img 
              src={user?.photoURL || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"} 
              alt={user?.displayName || "User"} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
