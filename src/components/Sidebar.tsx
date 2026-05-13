import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  AlertTriangle, 
  Settings, 
  HelpCircle, 
  BookOpen,
  LogOut,
  PlusCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Screen } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export default function Sidebar({ activeScreen, setScreen }: SidebarProps) {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === 'jagdishsolunke02@gmail.com' || profile?.role === 'admin';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'flagged', label: 'Flagged Events', icon: AlertTriangle },
    { id: 'setup', label: 'Exam Setup', icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldAlert });
  }

  const handleSignOut = async () => {
    try {
      const { auth } = await import('../services/firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container border-r-4 border-black shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col py-6 px-4 gap-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary border-2 border-black rounded-lg flex items-center justify-center overflow-hidden">
             <ShieldCheck className="text-on-secondary" size={24} />
          </div>
          <h1 className="font-headline text-2xl font-black text-secondary tracking-tighter">ProctorEdge</h1>
        </div>
        <p className="text-[10px] font-bold text-on-surface-variant italic uppercase tracking-wider">Integrity, without intrusion</p>
      </div>

      <button 
        onClick={() => setScreen('setup')}
        className="bg-secondary text-on-secondary border-3 border-black brutal-shadow px-4 py-3 font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <PlusCircle size={20} />
        New Session
      </button>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeScreen === item.id 
                ? 'bg-secondary text-on-secondary border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                : 'text-on-surface-variant hover:text-on-surface hover:translate-x-1'
            }`}
          >
            <item.icon size={20} />
            <span className="font-bold text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <button 
          onClick={() => setScreen('support')}
          className={`flex items-center gap-3 px-4 py-3 hover:translate-x-1 transition-transform w-full text-left ${activeScreen === 'support' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <HelpCircle size={20} />
          <span className="font-bold text-sm">Support</span>
        </button>
        <button 
          onClick={() => setScreen('documentation')}
          className={`flex items-center gap-3 px-4 py-3 hover:translate-x-1 transition-transform w-full text-left ${activeScreen === 'documentation' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <BookOpen size={20} />
          <span className="font-bold text-sm">Documentation</span>
        </button>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 text-on-surface-variant hover:text-error px-4 py-3 w-full hover:translate-x-1 transition-transform mt-4 border-t border-outline-variant pt-4"
        >
          <LogOut size={20} />
          <span className="font-bold text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
