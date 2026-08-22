import React, { useState, useEffect } from 'react';
import { Account } from '../../types';
import { api } from '../utils/api';
import { Users, Plus, CheckCircle2, AlertCircle, Trash2, Key, RefreshCw, Github, ShieldAlert, X, Copy, Check, Terminal, Clock, Sparkles, HelpCircle } from 'lucide-react';

interface AccountManagerProps {
  accounts: Account[];
  onAccountsChange: () => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, onAccountsChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [sshHostAlias, setSshHostAlias] = useState('');
  const [repoName, setRepoName] = useState('first');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<Record<string, boolean>>({});

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleUsernameChange = (newVal: string) => {
    setUsername(newVal);
    const sanitized = newVal.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!sshHostAlias || sshHostAlias.startsWith('github-')) {
      setSshHostAlias(sanitized ? `github-${sanitized}` : '');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const rawAlias = sshHostAlias.trim();
  const formattedAlias = rawAlias
    ? rawAlias.startsWith('github-') ? rawAlias : `github-${rawAlias}`
    : (username.trim() ? `github-${username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')}` : 'github-alias');

  const previewUser = username.trim() || 'username';
  const cleanRepo = (repoName.trim() || 'repository').replace(/\.git$/, '');
  const previewCommand = `git remote add origin git@${formattedAlias}:${previewUser}/${cleanRepo}.git`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedCmd((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();
    const finalAlias = formattedAlias;

    if (!trimmedUser || !trimmedEmail) {
      setModalError('Please enter both GitHub Username and Git Commit Email.');
      return;
    }

    setSaving(true);
    try {
      const sanitizedUser = trimmedUser.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      
      let keyPaths = { privateKeyPath: '', publicKeyPath: '' };
      try {
        keyPaths = await api.generateSshKey(finalAlias, trimmedEmail);
      } catch (keyErr: any) {
        console.warn('SSH key generation note:', keyErr.message);
      }

      const newAcc: Account = {
        id: sanitizedUser,
        name: name.trim() || `${trimmedUser} (${finalAlias})`,
        username: trimmedUser,
        email: trimmedEmail,
        provider: 'github',
        sshKeyPath: keyPaths?.privateKeyPath || `~/.ssh/id_ed25519_${finalAlias}`,
        publicKeyPath: keyPaths?.publicKeyPath || `~/.ssh/id_ed25519_${finalAlias}.pub`,
        sshHostAlias: finalAlias,
        token: token.trim() || undefined,
        status: 'unverified',
        createdAt: new Date().toISOString(),
      };

      await api.saveAccount(newAcc);
      if (keyPaths && keyPaths.privateKeyPath) {
        await api.addKeyToAgent(keyPaths.privateKeyPath);
      }

      setShowAddModal(false);
      setName('');
      setUsername('');
      setEmail('');
      setSshHostAlias('');
      setToken('');
      onAccountsChange();
    } catch (err: any) {
      setModalError(`Failed to save account: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this account configuration?')) {
      await api.deleteAccount(id);
      onAccountsChange();
    }
  };

  const handleTest = async (account: Account) => {
    setTestingId(account.id);
    const res = await api.testConnection(account);
    if (res) {
      setTestResults((prev) => ({ ...prev, [account.id]: res }));
      if (res.success && account.status !== 'connected') {
        account.status = 'connected';
        await api.saveAccount(account);
        onAccountsChange();
      }
    }
    setTestingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Beginner Friendly Hero Header */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-teal-400 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">GitHub Accounts</h2>
              <p className="text-xs text-slate-400">Add your GitHub accounts once. GitIdentity automatically routes your SSH keys & commit identity!</p>
            </div>
          </div>

          <button
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Account</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2 text-xs text-slate-300 font-medium">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <span><strong>Beginner Tip:</strong> Use the generated SSH URL alias (e.g., <code className="text-teal-300 font-mono">git@github-kirti:user/repo.git</code>) when adding remotes. Everything else is automatic!</span>
        </div>
      </div>

      {/* Account Grid */}
      {accounts.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center space-y-4 border-dashed border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No GitHub Accounts Added Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Click the button below to add your Personal or Work GitHub account. We will generate your SSH key automatically!
            </p>
          </div>
          <button
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-teal-500 text-slate-950 hover:bg-teal-400 rounded-xl text-xs font-extrabold shadow-lg cursor-pointer"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {accounts.map((acc) => {
            const result = testResults[acc.id];
            const isTesting = testingId === acc.id;
            const sampleCmd = `git remote add origin git@${acc.sshHostAlias}:${acc.username}/repository.git`;
            const formattedCreated = formatDate(acc.createdAt);
            const isCopied = copiedCmd[acc.id];

            return (
              <div key={acc.id} className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col justify-between space-y-5 border border-slate-800">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-teal-400 font-bold">
                        <Github className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100">{acc.name}</h3>
                        <p className="text-xs text-teal-400 font-mono font-bold">@{acc.username}</p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                      acc.status === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {acc.status === 'connected' ? '✓ SSH Connected' : 'Unverified'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Commit Email:</span>
                      <span className="font-mono text-slate-200 font-bold select-all">{acc.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">SSH Host Alias:</span>
                      <span className="font-mono text-teal-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 select-all font-bold">
                        {acc.sshHostAlias}
                      </span>
                    </div>
                    {formattedCreated && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="text-slate-500 flex items-center space-x-1 font-medium">
                          <Clock className="w-3 h-3 text-teal-400" />
                          <span>Created & Saved:</span>
                        </span>
                        <span className="font-mono text-slate-300 font-semibold">{formattedCreated}</span>
                      </div>
                    )}
                  </div>

                  {/* Beginner Friendly Git Remote Add Command Box */}
                  <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800/90 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span>Git Remote Command URL:</span>
                      <button
                        onClick={() => handleCopy(sampleCmd, acc.id)}
                        className="px-2.5 py-0.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Command'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-teal-300 break-all select-all font-bold p-2 bg-slate-900 rounded-lg border border-slate-800">
                      {sampleCmd}
                    </div>
                  </div>
                </div>

                {result && (
                  <div className={`p-3 rounded-xl text-xs font-mono border ${
                    result.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/30 text-red-300'
                  }`}>
                    {result.message}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleTest(acc)}
                    disabled={isTesting}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing SSH...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition cursor-pointer"
                    title="Delete Account Configuration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl space-y-5 border border-slate-800 relative z-50 pointer-events-auto max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Add GitHub Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account Display Name (e.g. Personal / Work)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Personal GitHub"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-text font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">GitHub Username *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="e.g. mahajankirti515"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500 cursor-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Custom Host Alias *</label>
                  <input
                    type="text"
                    required
                    value={sshHostAlias}
                    onChange={(e) => setSshHostAlias(e.target.value)}
                    placeholder="github-kirti"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-teal-300 font-mono font-bold focus:outline-none focus:border-teal-500 cursor-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sample Repo Name</label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="first"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500 cursor-text"
                  />
                </div>
              </div>

              {/* Live Git Remote Command Preview */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Terminal className="w-3.5 h-3.5 text-teal-400" />
                    <span>Exact Remote Command You Will Use:</span>
                  </span>
                </div>
                <div className="font-mono text-xs text-teal-300 break-all select-all font-bold p-2 bg-slate-900 rounded-lg border border-slate-800">
                  {previewCommand}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Git Commit Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500 cursor-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Personal Access Token (Optional)</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500 cursor-text"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50 shadow-lg shadow-teal-500/20"
                >
                  {saving ? 'Saving...' : 'Save Account & Setup Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
