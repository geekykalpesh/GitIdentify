import React from 'react';
import { 
  Users, 
  Key, 
  Cpu, 
  ShieldCheck, 
  Github,
  Heart,
  ExternalLink,
  Mail,
  Sparkles,
  FolderGit2
} from 'lucide-react';
import { api } from '../utils/api';

export type NavTab = 'accounts' | 'repos' | 'ssh' | 'system';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  accountCount: number;
  repoCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  accountCount,
  repoCount = 0,
}) => {
  const mainNav = [
    {
      id: 'accounts' as NavTab,
      label: 'GitHub Accounts',
      sublabel: 'Accounts & SSH aliases',
      icon: Users,
      badge: accountCount > 0 ? accountCount : undefined,
    },
    {
      id: 'repos' as NavTab,
      label: 'Local Repositories',
      sublabel: 'Drag-Drop & Identity Switcher',
      icon: FolderGit2,
      badge: repoCount > 0 ? repoCount : undefined,
    },
    {
      id: 'ssh' as NavTab,
      label: 'SSH Keys & Config',
      sublabel: 'Keypairs & ~/.ssh/config',
      icon: Key,
    },
    {
      id: 'system' as NavTab,
      label: 'System Status',
      sublabel: 'Environment & Git health',
      icon: Cpu,
    },
  ];

  return (
    <aside className="w-64 apple-glass border-r border-white/10 flex flex-col h-screen select-none shrink-0 font-sans relative z-20">
      {/* Window Controls / macOS Drag Bar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/50 shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50 shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50 shadow-sm" />
        </div>
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] font-extrabold text-teal-300 tracking-wider uppercase">
          <Sparkles className="w-2.5 h-2.5" />
          <span>v1.0 Pro</span>
        </div>
      </div>

      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center space-x-3 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 via-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/25 border border-white/20 shrink-0">
          <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-100 text-base tracking-tight leading-tight flex items-center space-x-1">
            <span>GitIdentity</span>
          </h1>
          <p className="text-[10px] text-teal-400 font-semibold tracking-wide flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>SSH Multi-Account</span>
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-widest text-slate-400/80 uppercase">
          Core Navigation
        </div>

        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 via-cyan-500/15 to-transparent text-teal-200 border border-teal-500/30 shadow-lg shadow-teal-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-teal-300 to-cyan-400 rounded-r-full shadow-md shadow-teal-400/50" />
              )}

              <div className="flex items-center space-x-3 pl-1">
                <div className={`p-2 rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                  isActive 
                    ? 'bg-teal-400/20 text-teal-300 border border-teal-400/30 shadow-inner' 
                    : 'bg-slate-800/80 text-slate-400 border border-white/5'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight tracking-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-400/80 font-medium mt-0.5">{item.sublabel}</div>
                </div>
              </div>
              
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full transition-colors ${
                  isActive ? 'bg-teal-400/30 text-teal-100 border border-teal-400/40' : 'bg-slate-800 text-slate-400 border border-white/5'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Status Badge & Author Credit */}
      <div className="p-4 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Github className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-semibold text-[11px]">SSH Auto-Router</span>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold flex items-center space-x-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ACTIVE</span>
          </span>
        </div>

        <div className="pt-2.5 border-t border-white/10 text-[11px] text-slate-400 space-y-1 font-medium">
          <div className="flex items-center space-x-1 text-slate-300 flex-wrap">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0 inline-block animate-pulse" />
            <span>by</span>
            <button
              type="button"
              onClick={() => api.openExternal('https://geekykalpesh.com')}
              className="text-teal-300 hover:text-teal-200 font-extrabold underline underline-offset-2 flex items-center space-x-0.5 transition cursor-pointer"
            >
              <span>geekykalpesh.com</span>
              <ExternalLink className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => api.openExternal('mailto:geekykalpesh@gmail.com')}
              className="text-slate-400 hover:text-teal-300 text-[10px] font-mono flex items-center space-x-1 transition cursor-pointer"
            >
              <Mail className="w-3 h-3 text-teal-400/80" />
              <span>geekykalpesh@gmail.com</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
