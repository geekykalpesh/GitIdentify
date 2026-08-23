import React, { useState } from 'react';
import { SystemStatus } from '../../types';
import { api } from '../utils/api';
import { CheckCircle2, XCircle, Terminal, Key, Folder, Cpu, RefreshCw, AlertTriangle, ShieldCheck, Sparkles, Lock } from 'lucide-react';

interface SystemStatusCardProps {
  status: SystemStatus | null;
  loading: boolean;
  onRefresh: () => void;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ status, loading, onRefresh }) => {
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  if (loading || !status) {
    return (
      <div className="glass-card p-6 rounded-xl flex items-center justify-center space-x-3 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
        <span>Detecting system status...</span>
      </div>
    );
  }

  const handleCleanGlobalIdentity = async () => {
    setCleaning(true);
    setCleanResult(null);
    try {
      await api.unsetGlobalGitIdentity();
      setCleanResult('Successfully removed global user.name/email and enabled user.useConfigOnly=true!');
      onRefresh();
    } catch (err: any) {
      setCleanResult(`Cleanup error: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const items = [
    {
      title: 'Git Version Control',
      installed: status.git.installed,
      details: status.git.version || 'Not installed / not in PATH',
      icon: Terminal,
    },
    {
      title: 'OpenSSH Client',
      installed: status.ssh.installed,
      details: status.ssh.version || 'Not installed / not in PATH',
      icon: Key,
    },
    {
      title: 'SSH Directory (~/.ssh)',
      installed: status.sshDir.exists,
      details: status.sshDir.path,
      icon: Folder,
    },
    {
      title: 'SSH Agent',
      installed: status.sshAgent.running,
      details: status.sshAgent.running
        ? `Running (${status.sshAgent.keyCount} key(s) loaded)`
        : 'Not running or no identities',
      icon: Cpu,
    },
  ];

  const globalEmail = status.globalGit?.email;
  const globalName = status.globalGit?.name;

  return (
    <div className="space-y-6">
      {/* Apple Pro Header Banner */}
      <div className="apple-glass p-6 rounded-3xl border border-white/10 space-y-3 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-indigo-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-teal-500/25 border border-white/20">
              <Cpu className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">System Health & Security Status</h2>
              <p className="text-xs text-slate-400/90 font-medium mt-0.5">Automatic inspection of Git executable, OpenSSH, and global Git identity config</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="apple-button-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Re-scan System</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="apple-glass-card p-5 rounded-3xl flex items-start space-x-4">
              <div className={`p-3 rounded-2xl border ${item.installed ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-100 tracking-tight">{item.title}</h3>
                  {item.installed ? (
                    <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-extrabold shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-extrabold shadow-sm">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Missing</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1.5 font-mono truncate bg-slate-950/60 px-3 py-1 rounded-xl border border-white/5">{item.details}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Identity Safeguard Card */}
      <div className={`apple-glass p-6 rounded-3xl space-y-4 border ${
        globalEmail ? 'border-amber-500/40 bg-amber-950/20' : 'border-emerald-500/30 bg-emerald-950/15'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border border-white/20 shadow-lg ${
              globalEmail ? 'bg-amber-500/25 text-amber-300' : 'bg-emerald-500/25 text-emerald-300'
            }`}>
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 tracking-tight">Global Identity Safeguard (~/.gitconfig)</h3>
              <p className="text-xs text-slate-400 font-medium">Enforce strict per-repository identity and prevent global fallback email leaks</p>
            </div>
          </div>

          <button
            onClick={handleCleanGlobalIdentity}
            disabled={cleaning}
            className="apple-button-primary flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-extrabold shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${cleaning ? 'animate-spin' : ''}`} />
            <span>{cleaning ? 'Cleaning...' : 'Remove Global Fallback & Enforce Local'}</span>
          </button>
        </div>

        {cleanResult && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs font-mono text-emerald-300 shadow-inner">
            {cleanResult}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-950/90 p-4 rounded-2xl border border-white/10 shadow-inner">
          <div>
            <span className="text-slate-400">Global user.email: </span>
            {globalEmail ? (
              <span className="text-amber-300 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                {globalEmail} (Fallback Active)
              </span>
            ) : (
              <span className="text-emerald-300 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                Unset (Clean & Protected)
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400">Global user.name: </span>
            {globalName ? (
              <span className="text-slate-200 font-bold">{globalName}</span>
            ) : (
              <span className="text-emerald-300 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                Unset (Clean)
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-2xl text-xs text-slate-300 space-y-1.5 border border-white/5">
          <div className="font-extrabold text-teal-300 flex items-center space-x-2 tracking-tight">
            <Lock className="w-4 h-4 text-teal-400" />
            <span>How This Feature Safeguards Your GitHub Accounts:</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Removing global fallbacks and enabling <code className="text-teal-300 font-mono font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">user.useConfigOnly=true</code> guarantees that Git will NEVER default to a wrong account email. Every repository managed by GitIdentity will use strictly isolated local configuration.
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="apple-glass p-5 rounded-3xl border border-white/10 flex items-center justify-between shadow-xl">
        <div className="text-xs text-slate-300 font-medium">
          <span className="font-bold text-slate-100">OS Environment: </span>
          <span className="font-mono text-teal-300 font-bold">{status.os.platform} ({status.os.arch})</span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Managed Block: <span className="font-mono text-slate-200 font-bold bg-white/5 px-2 py-1 rounded-xl border border-white/10">~/.ssh/config</span>
        </div>
      </div>
    </div>
  );
};
