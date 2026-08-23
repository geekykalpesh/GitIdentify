import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { SystemStatusCard } from './components/SystemStatusCard';
import { AccountManager } from './components/AccountManager';
import { SshKeyManager } from './components/SshKeyManager';
import { SystemStatus, Account } from './types';
import { api } from './utils/api';
import { ShieldCheck, RefreshCw, Sparkles, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('accounts');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Load system status & accounts on app launch
  const loadInitialData = async () => {
    setLoadingStatus(true);
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);

      const accs = await api.getAccounts();
      setAccounts(accs || []);
    } catch (e) {
      console.error('App init error:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshAccounts = async () => {
    try {
      const accs = await api.getAccounts();
      setAccounts(accs || []);
    } catch (e) {}
  };

  const refreshSystem = async () => {
    setLoadingStatus(true);
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (e) {}
    setLoadingStatus(false);
  };

  return (
    <div className="flex h-screen bg-[#080B12] text-slate-100 overflow-hidden font-sans relative selection:bg-teal-500/30 selection:text-teal-200">
      {/* Ambient Apple Pro Atmosphere Glow Effects */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-glow-pulse" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 left-64 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accountCount={accounts.length}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Apple Pro Top Navigation Header Toolbar */}
        <header className="h-14 border-b border-white/10 px-8 flex items-center justify-between apple-glass bg-slate-950/40 backdrop-blur-2xl shrink-0 select-none">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">
              {activeTab === 'accounts' && 'GitHub Accounts & Identity Cards'}
              {activeTab === 'ssh' && 'SSH Keypairs & Config Manager'}
              {activeTab === 'system' && 'System Health & Security Status'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-[11px] text-slate-200">
                {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} Active
              </span>
            </div>

            <button
              onClick={() => {
                refreshAccounts();
                refreshSystem();
              }}
              disabled={loadingStatus}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-white/10 transition cursor-pointer flex items-center space-x-1.5 text-xs font-semibold"
              title="Refresh Identity Router State"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar">
          {activeTab === 'accounts' && (
            <AccountManager
              accounts={accounts}
              onAccountsChange={refreshAccounts}
            />
          )}

          {activeTab === 'ssh' && <SshKeyManager />}

          {activeTab === 'system' && (
            <SystemStatusCard
              status={systemStatus}
              loading={loadingStatus}
              onRefresh={refreshSystem}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
