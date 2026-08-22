import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { SystemStatusCard } from './components/SystemStatusCard';
import { AccountManager } from './components/AccountManager';
import { SshKeyManager } from './components/SshKeyManager';
import { SystemStatus, Account } from './types';
import { api } from './utils/api';

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
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accountCount={accounts.length}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto p-8">
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
  );
};

export default App;
