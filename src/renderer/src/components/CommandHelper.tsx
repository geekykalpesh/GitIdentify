import { Account } from '../../types';
import { Terminal, Copy, Check, Sparkles, Code, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';

interface CommandHelperProps {
  accounts: Account[];
}

export const CommandHelper: React.FC<CommandHelperProps> = ({ accounts }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [repoPath, setRepoPath] = useState('username/repository.git');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);

  const cleanPath = repoPath.replace(/^https?:\/\/github\.com\//, '').replace(/^git@github\.com:/, '');
  const hostAlias = activeAccount ? activeAccount.sshHostAlias : 'github-account';
  const email = activeAccount ? activeAccount.email : 'email@example.com';
  const username = activeAccount ? activeAccount.username : 'username';

  const remoteUrl = `git@${hostAlias}:${cleanPath}`;
  const setRemoteCmd = `git remote set-url origin ${remoteUrl}`;
  const addRemoteCmd = `git remote add origin ${remoteUrl}`;
  const setIdentityCmd = `git config user.name "${username}" && git config user.email "${email}"`;
  const fullSetupCmd = `git remote set-url origin ${remoteUrl} && git config user.name "${username}" && git config user.email "${email}"`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Manual Git Setup Helper</h2>
        <p className="text-xs text-slate-400">Copy pre-formatted SSH remote and identity commands to run directly in your terminal</p>
      </div>

      {/* Account & Repo Input Controls */}
      <div className="glass-card p-6 rounded-2xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Account Identity</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none focus:border-teal-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (@{acc.username}) — Host Alias: {acc.sshHostAlias}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Repository (owner/repo.git or URL)</label>
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="username/repository.git"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Transformed Remote URL Card */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Account SSH Remote Address:
            </span>
            <button
              onClick={() => handleCopy(remoteUrl, 'remoteUrl')}
              className="px-2.5 py-1 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 rounded text-xs font-bold flex items-center space-x-1"
            >
              {copiedCmd === 'remoteUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'remoteUrl' ? 'Copied' : 'Copy SSH URL'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-teal-300 break-all select-all">{remoteUrl}</div>
        </div>
      </div>

      {/* Terminal Commands List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-teal-400" />
          <span>Copy Terminal Commands</span>
        </h3>

        {/* Command 1: Full Setup */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200">Full Setup (Set Remote & User Config)</span>
              <p className="text-[11px] text-slate-400">Updates remote origin URL, git user.name, and git user.email in one command</p>
            </div>
            <button
              onClick={() => handleCopy(fullSetupCmd, 'fullSetup')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700"
            >
              {copiedCmd === 'fullSetup' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'fullSetup' ? 'Copied!' : 'Copy Command'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-teal-300 overflow-x-auto border border-slate-800/80">
            {fullSetupCmd}
          </pre>
        </div>

        {/* Command 2: Set Remote URL */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200">Set Remote URL Only</span>
              <p className="text-[11px] text-slate-400">Replaces existing origin remote URL with account SSH host</p>
            </div>
            <button
              onClick={() => handleCopy(setRemoteCmd, 'setRemote')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700"
            >
              {copiedCmd === 'setRemote' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'setRemote' ? 'Copied!' : 'Copy Command'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80">
            {setRemoteCmd}
          </pre>
        </div>

        {/* Command 3: Add Remote URL */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200">Add Remote URL (New Local Repo)</span>
              <p className="text-[11px] text-slate-400">Adds origin remote URL for freshly initialized repository</p>
            </div>
            <button
              onClick={() => handleCopy(addRemoteCmd, 'addRemote')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700"
            >
              {copiedCmd === 'addRemote' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'addRemote' ? 'Copied!' : 'Copy Command'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80">
            {addRemoteCmd}
          </pre>
        </div>

        {/* Command 4: Set Git Author Identity */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200">Set Local Git Author Name & Email</span>
              <p className="text-[11px] text-slate-400">Configures repository local user.name and user.email</p>
            </div>
            <button
              onClick={() => handleCopy(setIdentityCmd, 'setIdentity')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700"
            >
              {copiedCmd === 'setIdentity' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'setIdentity' ? 'Copied!' : 'Copy Command'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80">
            {setIdentityCmd}
          </pre>
        </div>
      </div>
    </div>
  );
};
