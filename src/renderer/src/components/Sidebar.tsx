import React from 'react';
import { 
  Users, 
  Key, 
  Cpu, 
  ShieldCheck, 
  Github
} from 'lucide-react';

export type NavTab = 'accounts' | 'ssh' | 'system';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  accountCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  accountCount,
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
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen select-none shrink-0 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 via-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-100 text-lg tracking-tight leading-tight">GitIdentity</h1>
            <p className="text-[11px] text-teal-400 font-semibold tracking-wide">SSH Multi-Account</p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
          Menu
        </div>

        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800/80 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{item.sublabel}</div>
                </div>
              </div>
              
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                  isActive ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Status Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Github className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-semibold text-[11px]">SSH Auto-Router</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-extrabold">
            ACTIVE
          </span>
        </div>
      </div>
    </aside>
  );
};
