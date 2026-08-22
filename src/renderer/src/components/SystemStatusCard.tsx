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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">System Environment Status</h2>
          <p className="text-xs text-slate-400">Automatic detection of Git, OpenSSH, and global Git identity configuration</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-scan System</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card glass-card-hover p-4 rounded-xl flex items-start space-x-4">
              <div className={`p-2.5 rounded-lg ${item.installed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                  {item.installed ? (
                    <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ready</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-400 text-xs font-bold">
                      <XCircle className="w-4 h-4" />
                      <span>Missing</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono truncate">{item.details}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Identity Safeguard Card */}
      <div className={`glass-card p-6 rounded-2xl space-y-4 border ${
        globalEmail ? 'border-amber-500/40 bg-amber-950/10' : 'border-emerald-500/30 bg-emerald-950/10'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              globalEmail ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Global Git Identity Protection (~/.gitconfig)</h3>
              <p className="text-xs text-slate-400">Enforce strict per-repository identity and remove global fallback leaks</p>
            </div>
          </div>

          <button
            onClick={handleCleanGlobalIdentity}
            disabled={cleaning}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${cleaning ? 'animate-spin' : ''}`} />
            <span>{cleaning ? 'Cleaning...' : 'Remove Global Fallback & Enforce Local'}</span>
          </button>
        </div>

        {cleanResult && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300">
            {cleanResult}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500">Global user.email: </span>
            {globalEmail ? (
              <span className="text-amber-300 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                {globalEmail} (Fallback Active)
              </span>
            ) : (
              <span className="text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                Unset (Clean)
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-500">Global user.name: </span>
            {globalName ? (
              <span className="text-slate-200 font-bold">{globalName}</span>
            ) : (
              <span className="text-emerald-400 font-bold">Unset (Clean)</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-300 space-y-1">
          <div className="font-bold text-teal-300 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>How This Feature Safeguards Your GitHub Accounts:</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Removing global fallbacks and enabling <code className="text-teal-300">user.useConfigOnly=true</code> guarantees that Git will NEVER default to a wrong account email. Every repository managed by GitIdentity will use strictly isolated local configuration.
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="glass-card p-4 rounded-xl border-l-4 border-l-teal-500 flex items-center justify-between">
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-slate-100">OS Environment: </span>
          <span className="font-mono text-teal-400">{status.os.platform} ({status.os.arch})</span>
        </div>
        <div className="text-xs text-slate-400">
          GitIdentity Managed Block: <span className="font-mono text-slate-200">~/.ssh/config</span>
        </div>
      </div>
    </div>
  );
};
