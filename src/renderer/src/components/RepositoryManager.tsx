import React, { useState } from 'react';
import { Repository, Account } from '../../types';
import { api } from '../utils/api';
import { 
  FolderGit2, 
  FolderPlus, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  ExternalLink,
  Trash2,
  Lock,
  LockOpen,
  UploadCloud,
  Link as LinkIcon,
  Folder,
  Sparkles,
  UserCheck,
  ArrowRightLeft
} from 'lucide-react';

interface RepositoryManagerProps {
  repositories: Repository[];
  accounts: Account[];
  onRefresh: () => void;
}

export const RepositoryManager: React.FC<RepositoryManagerProps> = ({
  repositories,
  accounts,
  onRefresh,
}) => {
  const [switchingPath, setSwitchingPath] = useState<string | null>(null);
  const [pushingPath, setPushingPath] = useState<string | null>(null);
  const [pushResults, setPushResults] = useState<Record<string, { success: boolean; output: string }>>({});

  // Remote URL Quick Setup Modal state
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'create-folder' | 'existing-repo'>('create-folder');
  const [pastedUrl, setPastedUrl] = useState('https://github.com/krishnalmahajan687-hash/first.git');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [destDir, setDestDir] = useState('C:\\Projects');
  const [folderName, setFolderName] = useState('first');
  const [targetRepoPath, setTargetRepoPath] = useState<string>(repositories[0]?.path || '');
  const [processing, setProcessing] = useState(false);

  // Auto-extract folder name when pasted URL changes
  const handleUrlChange = (urlStr: string) => {
    setPastedUrl(urlStr);
    const match = urlStr.match(/\/([^/]+?)(\.git)?$/);
    if (match && match[1]) {
      setFolderName(match[1]);
    }
  };

  const handleAddRepository = async () => {
    try {
      const folderPath = await api.openDirectoryDialog();
      if (!folderPath) return;

      await api.inspectRepo(folderPath);
      onRefresh();
    } catch (err: any) {
      alert(`Error scanning repository: ${err.message}`);
    }
  };

  const handleSelectParentDir = async () => {
    const folder = await api.openDirectoryDialog();
    if (folder) setDestDir(folder);
  };

  const handleSwitchIdentity = async (repoPath: string, accountId: string) => {
    const targetAccount = accounts.find((a) => a.id === accountId);
    if (!targetAccount) return;

    setSwitchingPath(repoPath);
    try {
      await api.switchAccountIdentity(repoPath, targetAccount);
      onRefresh();
    } catch (err: any) {
      alert(`Identity switch failed: ${err.message}`);
    } finally {
      setSwitchingPath(null);
    }
  };

  const handlePushCode = async (repo: Repository) => {
    setPushingPath(repo.path);
    try {
      const result = await api.pushToRemote(repo.path);
      setPushResults((prev) => ({ ...prev, [repo.path]: result }));
      if (result.success) {
        onRefresh();
      }
    } catch (err: any) {
      setPushResults((prev) => ({ ...prev, [repo.path]: { success: false, output: err.message } }));
    } finally {
      setPushingPath(null);
    }
  };

  const handleToggleHook = async (repo: Repository) => {
    if (!repo.assignedAccountId) {
      alert('Please assign an account identity to this repository first before installing Git protection hooks.');
      return;
    }

    const account = accounts.find((a) => a.id === repo.assignedAccountId);
    if (!account) return;

    try {
      if (repo.hookInstalled) {
        await api.removeHook(repo.path);
      } else {
        await api.installHook(repo.path, account);
      }
      onRefresh();
    } catch (err: any) {
      alert(`Hook toggle failed: ${err.message}`);
    }
  };

  const handleRemoveRepo = async (repoPath: string) => {
    await api.removeSavedRepo(repoPath);
    onRefresh();
  };

  const handleOpenFolder = (repoPath: string) => {
    api.openPath(repoPath);
  };

  const handleExecuteRemoteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account || !pastedUrl) {
      alert('Please select a GitHub account and enter a valid repository URL.');
      return;
    }

    setProcessing(true);
    try {
      if (activeTab === 'create-folder') {
        const newRepo = await api.initNewRepoWithRemote(destDir, folderName, account, pastedUrl);
        if (newRepo) {
          alert(`Created new project folder '${folderName}' with custom SSH remote: ${newRepo.remoteUrl}`);
        }
      } else {
        if (!targetRepoPath) {
          alert('Please select or specify a target local repository folder.');
          return;
        }
        const updated = await api.setRepoRemoteUrl(targetRepoPath, account, pastedUrl);
        if (updated) {
          alert(`Updated remote URL for '${updated.name}' to: ${updated.remoteUrl}`);
        }
      }
      setShowRemoteModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Setup failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);
  let parsedOwnerRepo = '';
  if (pastedUrl) {
    const match = pastedUrl.match(/\/([^/]+)\/([^/]+?)(\.git)?$/);
    if (match) parsedOwnerRepo = `${match[1]}/${match[2]}`;
  }

  const generatedSshUrl = activeAccount && parsedOwnerRepo
    ? `git@${activeAccount.sshHostAlias}:${parsedOwnerRepo}.git`
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Local Repositories</h2>
          <p className="text-xs text-slate-400">Scan folders, switch push identities in 1-click, set remotes, and push code safely</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRemoteModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-teal-500/20"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Paste Remote / Setup Repo</span>
          </button>
          <button
            onClick={handleAddRepository}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <FolderPlus className="w-4 h-4 text-teal-400" />
            <span>Add Folder</span>
          </button>
        </div>
      </div>

      {/* Repositories List */}
      {repositories.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center space-y-4 border-dashed">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">No Repositories Tracked</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Paste a repository URL to create a new folder & remote, or add an existing local folder to manage SSH remotes.
            </p>
          </div>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowRemoteModal(true)}
              className="px-4 py-2 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold"
            >
              Paste Remote URL
            </button>
            <button
              onClick={handleAddRepository}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700"
            >
              Select Local Folder
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {repositories.map((repo) => {
            const assignedAcc = accounts.find((a) => a.id === repo.assignedAccountId);
            const isSwitching = switchingPath === repo.path;
            const isPushing = pushingPath === repo.path;
            const pushResult = pushResults[repo.path];

            return (
              <div
                key={repo.id}
                className={`glass-card p-5 rounded-2xl space-y-4 border ${
                  repo.isMismatch ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
                }`}
              >
                {/* Top Row: Repo Title & Path */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      repo.isMismatch ? 'bg-amber-500/10 text-amber-400' : 'bg-teal-500/10 text-teal-400'
                    }`}>
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-100">{repo.name}</h3>
                        <button
                          onClick={() => handleOpenFolder(repo.path)}
                          className="text-slate-500 hover:text-slate-300"
                          title="Open in File Explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate max-w-md">{repo.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Push Code Button */}
                    <button
                      onClick={() => handlePushCode(repo)}
                      disabled={isPushing}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition shadow-md"
                      title="Push commits to origin remote using assigned SSH account"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                      <span>{isPushing ? 'Pushing...' : 'Push Code'}</span>
                    </button>

                    {/* Hook Status */}
                    <button
                      onClick={() => handleToggleHook(repo)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        repo.hookInstalled
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Toggle pre-commit identity check hook"
                    >
                      {repo.hookInstalled ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <LockOpen className="w-3.5 h-3.5" />}
                      <span>{repo.hookInstalled ? 'Hook Active' : 'Hook (Optional)'}</span>
                    </button>

                    <button
                      onClick={() => handleRemoveRepo(repo.path)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                      title="Untrack Repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Explicit Active Account Banner */}
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  assignedAcc
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center space-x-2">
                    <UserCheck className={`w-4 h-4 ${assignedAcc ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="font-bold">Active Push Account: </span>
                      {assignedAcc ? (
                        <span className="font-mono text-slate-100 font-bold">
                          {assignedAcc.name} (@{assignedAcc.username}) &lt;{assignedAcc.email}&gt;
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">No GitHub account assigned yet</span>
                      )}
                    </div>
                  </div>

                  {assignedAcc && (
                    <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono font-bold">
                      Host: {assignedAcc.sshHostAlias}
                    </div>
                  )}
                </div>

                {/* Identity Protection Warning Banner */}
                {repo.isMismatch && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Suspicious Identity Combination Detected!</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {repo.suspiciousReason}
                    </p>
                    <div className="bg-amber-950/40 p-2 rounded border border-amber-500/20 font-mono text-[11px] text-amber-200">
                      <div>Configured Email: <span className="text-slate-100">{repo.currentEmail || '(None)'}</span></div>
                      <div>Remote URL: <span className="text-teal-300">{repo.remoteUrl || '(None)'}</span></div>
                    </div>
                  </div>
                )}

                {/* Push Output Status Banner */}
                {pushResult && (
                  <div className={`p-3 rounded-xl border text-xs font-mono whitespace-pre-wrap ${
                    pushResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/30 text-red-300'
                  }`}>
                    <div className="font-bold flex items-center space-x-1 mb-1">
                      {pushResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                      <span>{pushResult.success ? 'Push Succeeded:' : 'Push Error:'}</span>
                    </div>
                    <div>{pushResult.output}</div>
                  </div>
                )}

                {/* Configuration & 1-Click Identity Switcher Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                      <span>Switch Account Identity to Push From:</span>
                      {isSwitching && <span className="text-teal-400 font-mono text-[10px] animate-pulse">Switching...</span>}
                    </label>
                    <select
                      value={repo.assignedAccountId || ''}
                      onChange={(e) => handleSwitchIdentity(repo.path, e.target.value)}
                      disabled={isSwitching}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-teal-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">-- Switch Account Identity --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (@{acc.username} / {acc.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Git user.name:</span>
                      <span className="text-slate-200">{repo.currentName || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Git user.email:</span>
                      <span className="text-slate-200">{repo.currentEmail || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span>Remote URL:</span>
                      <span className="text-teal-300 truncate max-w-[200px]" title={repo.remoteUrl}>{repo.remoteUrl || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paste Remote URL / Quick Setup Modal */}
      {showRemoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl space-y-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-bold text-slate-100">Setup Remote Repository</h3>
              </div>
              <button
                onClick={() => setShowRemoteModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('create-folder')}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === 'create-folder'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create New Folder & Init Repo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('existing-repo')}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === 'existing-repo'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Replace Remote in Existing Repo
              </button>
            </div>

            <form onSubmit={handleExecuteRemoteSetup} className="space-y-4">
              {/* Account Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Account SSH Identity *</label>
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

              {/* Paste GitHub URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Paste Remote GitHub URL *</label>
                <input
                  type="text"
                  required
                  value={pastedUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://github.com/krishnalmahajan687-hash/first.git"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Tab 1: Create New Folder Fields */}
              {activeTab === 'create-folder' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">New Folder Name</label>
                      <input
                        type="text"
                        required
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="first"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Directory</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          value={destDir}
                          onChange={(e) => setDestDir(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSelectParentDir}
                          className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs"
                        >
                          <Folder className="w-3.5 h-3.5 text-teal-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Replace Remote in Existing Repo */}
              {activeTab === 'existing-repo' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Tracked Local Repository *</label>
                  <select
                    value={targetRepoPath}
                    onChange={(e) => setTargetRepoPath(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Choose Repository Folder --</option>
                    {repositories.map((r) => (
                      <option key={r.id} value={r.path}>
                        {r.name} ({r.path})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transformed SSH URL Preview */}
              {generatedSshUrl && activeAccount && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">
                    Code will push from account: {activeAccount.name} (@{activeAccount.username})
                  </div>
                  <div className="text-xs font-mono text-teal-300 break-all select-all">{generatedSshUrl}</div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRemoteModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg"
                >
                  {processing ? 'Processing...' : activeTab === 'create-folder' ? 'Create Folder & Add Remote' : 'Replace Old Remote URL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
