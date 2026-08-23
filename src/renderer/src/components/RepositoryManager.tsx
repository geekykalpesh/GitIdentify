import React, { useState } from 'react';
import { Repository, Account } from '../../types';
import { api } from '../utils/api';
import { FileUpload } from './ui/file-upload';
import { 
  FolderGit2, 
  FolderPlus, 
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
  ArrowRightLeft,
  Search,
  X,
  Edit3,
  MinusCircle,
  Upload
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Custom Identity Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);

  // Remote URL Quick Setup Modal state
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'create-folder' | 'existing-repo'>('create-folder');
  const [pastedUrl, setPastedUrl] = useState('https://github.com/krishnalmahajan687-hash/first.git');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [destDir, setDestDir] = useState('C:\\Projects');
  const [folderName, setFolderName] = useState('first');
  const [targetRepoPath, setTargetRepoPath] = useState<string>(repositories[0]?.path || '');
  const [processing, setProcessing] = useState(false);

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    let scannedCount = 0;
    for (const file of files) {
      const folderPath = (file as any).path;
      if (folderPath) {
        try {
          await api.inspectRepo(folderPath);
          scannedCount++;
        } catch (err: any) {
          showFeedback(`Could not inspect '${file.name}': ${err.message || 'Not a Git repository'}`);
        }
      }
    }

    if (scannedCount > 0) {
      showFeedback(`Successfully inspected & tracked ${scannedCount} repository folder(s)!`);
      onRefresh();
    }
  };

  const handleAddRepository = async () => {
    try {
      const folderPath = await api.openDirectoryDialog();
      if (!folderPath) return;

      await api.inspectRepo(folderPath);
      showFeedback(`Added repository folder: ${folderPath}`);
      onRefresh();
    } catch (err: any) {
      showFeedback(`Error scanning repository: ${err.message}`);
    }
  };

  const handleSelectParentDir = async () => {
    const folder = await api.openDirectoryDialog();
    if (folder) setDestDir(folder);
  };

  const handleUrlChange = (urlStr: string) => {
    setPastedUrl(urlStr);
    const match = urlStr.match(/\/([^/]+?)(\.git)?$/);
    if (match && match[1]) {
      setFolderName(match[1]);
    }
  };

  const handleSwitchIdentity = async (repoPath: string, accountId: string) => {
    const targetAccount = accounts.find((a) => a.id === accountId);
    if (!targetAccount) return;

    setSwitchingPath(repoPath);
    try {
      await api.switchAccountIdentity(repoPath, targetAccount);
      showFeedback(`Identity switched to ${targetAccount.name} (@${targetAccount.username})`);
      onRefresh();
    } catch (err: any) {
      showFeedback(`Identity switch failed: ${err.message}`);
    } finally {
      setSwitchingPath(null);
    }
  };

  const handleUnsetIdentity = async (repo: Repository) => {
    if (confirm(`Unset local user.name and user.email for '${repo.name}'? Git will default to global settings.`)) {
      try {
        await api.unsetLocalIdentity(repo.path);
        showFeedback(`Unset local identity for '${repo.name}'.`);
        onRefresh();
      } catch (err: any) {
        showFeedback(`Failed to unset identity: ${err.message}`);
      }
    }
  };

  const handleOpenEditModal = (repo: Repository) => {
    setEditingRepo(repo);
    setCustomName(repo.currentName || '');
    setCustomEmail(repo.currentEmail || '');
    setShowEditModal(true);
  };

  const handleSaveCustomIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepo) return;

    setSavingCustom(true);
    try {
      await api.setCustomLocalIdentity(editingRepo.path, customName, customEmail);
      showFeedback(`Updated custom Git identity for '${editingRepo.name}'.`);
      setShowEditModal(false);
      onRefresh();
    } catch (err: any) {
      showFeedback(`Failed to save custom identity: ${err.message}`);
    } finally {
      setSavingCustom(false);
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
      showFeedback('Please assign an account identity to this repository first before installing Git protection hooks.');
      return;
    }

    const account = accounts.find((a) => a.id === repo.assignedAccountId);
    if (!account) return;

    try {
      if (repo.hookInstalled) {
        await api.removeHook(repo.path);
        showFeedback(`Removed pre-commit hook from '${repo.name}'.`);
      } else {
        await api.installHook(repo.path, account);
        showFeedback(`Installed pre-commit hook in '${repo.name}'.`);
      }
      onRefresh();
    } catch (err: any) {
      showFeedback(`Hook toggle failed: ${err.message}`);
    }
  };

  const handleRemoveRepo = async (repoPath: string) => {
    await api.removeSavedRepo(repoPath);
    showFeedback(`Untracked repository folder.`);
    onRefresh();
  };

  const handleOpenFolder = (repoPath: string) => {
    api.openPath(repoPath);
  };

  const handleExecuteRemoteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account || !pastedUrl) {
      showFeedback('Please select a GitHub account and enter a valid repository URL.');
      return;
    }

    setProcessing(true);
    try {
      if (activeTab === 'create-folder') {
        const newRepo = await api.initNewRepoWithRemote(destDir, folderName, account, pastedUrl);
        if (newRepo) {
          showFeedback(`Created new project folder '${folderName}' with SSH remote: ${newRepo.remoteUrl}`);
        }
      } else {
        if (!targetRepoPath) {
          showFeedback('Please select a target local repository folder.');
          return;
        }
        const updated = await api.setRepoRemoteUrl(targetRepoPath, account, pastedUrl);
        if (updated) {
          showFeedback(`Updated remote URL for '${updated.name}' to: ${updated.remoteUrl}`);
        }
      }
      setShowRemoteModal(false);
      onRefresh();
    } catch (err: any) {
      showFeedback(`Setup failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Filtered repositories based on search query
  const filteredRepos = repositories.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = r.name.toLowerCase().includes(q);
    const matchPath = r.path.toLowerCase().includes(q);
    const matchAuthor = (r.currentName || '').toLowerCase().includes(q);
    const matchEmail = (r.currentEmail || '').toLowerCase().includes(q);
    const matchUrl = (r.remoteUrl || '').toLowerCase().includes(q);
    return matchName || matchPath || matchAuthor || matchEmail || matchUrl;
  });

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
    <div 
      className="space-y-5 relative min-h-[80vh]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full-Window Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 border-4 border-dashed border-teal-400/80 rounded-3xl animate-in fade-in duration-150 pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/40 shadow-2xl shadow-teal-500/30 mb-4 animate-bounce">
            <Upload className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Drop Git Repository Folder Here</h2>
          <p className="text-xs text-teal-300 font-bold uppercase tracking-widest mt-1">
            GitIdentity will automatically inspect & route identity
          </p>
        </div>
      )}

      {/* Top Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-3.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories by folder name, path, author, or email..."
            className="w-full pl-10 pr-9 py-2 bg-slate-950/90 border border-white/10 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowRemoteModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-md cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Setup Remote Repo</span>
          </button>

          <button
            onClick={handleAddRepository}
            className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-teal-400 stroke-[2.5]" />
            <span>Add Folder</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {statusFeedback && (
        <div className="p-3 bg-teal-950/60 border border-teal-500/40 rounded-2xl text-xs font-mono text-teal-300 flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-300 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
          <button onClick={() => setStatusFeedback(null)} className="text-slate-400 hover:text-white text-xs p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Aceternity / Shadcn File Upload Component */}
      <FileUpload onChange={async (files) => {
        let scannedCount = 0;
        for (const file of files) {
          const folderPath = (file as any).path;
          if (folderPath) {
            try {
              await api.inspectRepo(folderPath);
              scannedCount++;
            } catch (err: any) {
              showFeedback(`Could not inspect '${file.name}': ${err.message || 'Not a Git repository'}`);
            }
          }
        }
        if (scannedCount > 0) {
          showFeedback(`Successfully inspected & tracked ${scannedCount} repository folder(s)!`);
          onRefresh();
        }
      }} />

      {/* Repositories List */}
      {filteredRepos.length === 0 ? (
        <div className="apple-glass p-12 rounded-3xl text-center space-y-4 border-dashed border-slate-700/60">
          <div className="w-14 h-14 rounded-3xl bg-teal-500/15 text-teal-300 flex items-center justify-center mx-auto border border-teal-500/30 shadow-xl shadow-teal-500/10">
            <FolderGit2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-200 tracking-tight">
              {searchQuery ? `No Repositories Match "${searchQuery}"` : 'No Repositories Tracked Yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed font-medium">
              {searchQuery 
                ? 'Try clearing your search query or drag a new folder onto the app.' 
                : 'Drag and drop any Git project folder directly onto this window, or click below to select a folder manually.'}
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="apple-button-secondary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Clear Search Filter
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowRemoteModal(true)}
                  className="apple-button-primary px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Paste Remote URL
                </button>
                <button
                  onClick={handleAddRepository}
                  className="apple-button-secondary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Browse Local Folder
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRepos.map((repo) => {
            const assignedAcc = accounts.find((a) => a.id === repo.assignedAccountId);
            const isSwitching = switchingPath === repo.path;
            const isPushing = pushingPath === repo.path;
            const pushResult = pushResults[repo.path];

            return (
              <div
                key={repo.id}
                className={`apple-glass p-5 rounded-3xl space-y-4 border transition-all ${
                  repo.isMismatch ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/10 bg-slate-950/40'
                }`}
              >
                {/* Top Row: Repo Title & Path */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border border-white/10 shadow-md shrink-0 ${
                      repo.isMismatch ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-300'
                    }`}>
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-slate-100 tracking-tight truncate">{repo.name}</h3>
                        <button
                          onClick={() => handleOpenFolder(repo.path)}
                          className="text-slate-400 hover:text-teal-300 cursor-pointer p-0.5"
                          title="Open in OS File Explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate select-all">{repo.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Push Code Button */}
                    <button
                      onClick={() => handlePushCode(repo)}
                      disabled={isPushing}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black transition shadow-md cursor-pointer flex items-center space-x-1.5"
                      title="Push commits to origin remote using assigned SSH account"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 stroke-[2.5] ${isPushing ? 'animate-bounce' : ''}`} />
                      <span>{isPushing ? 'Pushing...' : 'Push Code'}</span>
                    </button>

                    {/* Hook Status */}
                    <button
                      onClick={() => handleToggleHook(repo)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        repo.hookInstalled
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                      }`}
                      title="Toggle pre-commit identity check hook"
                    >
                      {repo.hookInstalled ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <LockOpen className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{repo.hookInstalled ? 'Hook Active' : 'Hook (Optional)'}</span>
                    </button>

                    <button
                      onClick={() => handleRemoveRepo(repo.path)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-500/20"
                      title="Untrack Repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Active Push Account Badge Bar */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs shadow-inner ${
                  assignedAcc
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/80 border-white/5 text-slate-400'
                }`}>
                  <div className="flex items-center space-x-2.5 min-w-0 truncate">
                    <UserCheck className={`w-4 h-4 shrink-0 ${assignedAcc ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="truncate">
                      <span className="font-extrabold text-slate-200">Active Identity: </span>
                      {assignedAcc ? (
                        <span className="font-mono text-slate-100 font-bold select-all">
                          {assignedAcc.name} (@{assignedAcc.username}) &lt;{assignedAcc.email}&gt;
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">No GitHub account assigned yet</span>
                      )}
                    </div>
                  </div>

                  {assignedAcc && (
                    <div className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-mono font-extrabold shrink-0 shadow-sm">
                      Host: {assignedAcc.sshHostAlias}
                    </div>
                  )}
                </div>

                {/* Identity Protection Warning Banner */}
                {repo.isMismatch && (
                  <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl space-y-2 text-xs shadow-inner">
                    <div className="flex items-center space-x-2 text-amber-300 font-extrabold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Suspicious Identity Combination Detected!</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed font-medium">
                      {repo.suspiciousReason}
                    </p>
                    <div className="bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/30 font-mono text-[11px] text-amber-200 space-y-0.5">
                      <div>Configured Email: <span className="text-slate-100 font-bold">{repo.currentEmail || '(None)'}</span></div>
                      <div>Remote URL: <span className="text-teal-300 font-bold">{repo.remoteUrl || '(None)'}</span></div>
                    </div>
                  </div>
                )}

                {/* Push Output Status Banner */}
                {pushResult && (
                  <div className={`p-3 rounded-2xl border text-xs font-mono whitespace-pre-wrap shadow-inner ${
                    pushResult.success
                      ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/50 border-red-500/30 text-red-300'
                  }`}>
                    <div className="font-extrabold flex items-center space-x-1.5 mb-1">
                      {pushResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                      <span>{pushResult.success ? 'Push Succeeded:' : 'Push Error:'}</span>
                    </div>
                    <div>{pushResult.output}</div>
                  </div>
                )}

                {/* Grid: Identity Switcher & Local Config Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs">
                  {/* Account Selector Dropdown */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
                          <span>Switch Account Profile:</span>
                        </span>
                        {isSwitching && <span className="text-teal-400 font-mono text-[10px] animate-pulse">Switching...</span>}
                      </label>
                      <select
                        value={repo.assignedAccountId || ''}
                        onChange={(e) => handleSwitchIdentity(repo.path, e.target.value)}
                        disabled={isSwitching}
                        className="w-full px-3 py-2 bg-slate-950/90 border border-white/10 rounded-xl text-xs font-extrabold text-teal-300 focus:outline-none focus:border-teal-400 cursor-pointer shadow-inner"
                      >
                        <option value="">-- Select GitHub Account Profile --</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (@{acc.username} / {acc.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Config Details & Action Buttons */}
                  <div className="space-y-2">
                    <div className="space-y-1 text-[11px] font-mono bg-slate-950/80 p-2.5 rounded-xl border border-white/10 shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">user.name:</span>
                        <span className="text-slate-200 font-bold">{repo.currentName || <em className="text-amber-400/80 font-normal">Unset</em>}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">user.email:</span>
                        <span className="text-slate-200 font-bold">{repo.currentEmail || <em className="text-amber-400/80 font-normal">Unset</em>}</span>
                      </div>
                      <div className="flex justify-between items-center truncate pt-0.5 border-t border-white/5">
                        <span className="text-slate-400 font-semibold">Remote:</span>
                        <span className="text-teal-300 truncate max-w-[200px] font-bold" title={repo.remoteUrl}>
                          {repo.remoteUrl || 'Not set'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(repo)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1 cursor-pointer transition"
                        title="Manually set local user.name and user.email"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal-300" />
                        <span>Edit Custom Config</span>
                      </button>

                      <button
                        onClick={() => handleUnsetIdentity(repo)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-white/10 rounded-xl text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition"
                        title="Unset local user.name and user.email from .git/config"
                      >
                        <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unset Identity</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Custom Identity Modal */}
      {showEditModal && editingRepo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="apple-glass-modal w-full max-w-md p-6 rounded-3xl space-y-4 border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <Edit3 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 tracking-tight">Edit Local Git Config</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Repository: {editingRepo.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomIdentity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Git user.name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Git user.email</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-400 shadow-inner"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="apple-button-secondary flex-1 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="apple-button-primary flex-1 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {savingCustom ? 'Saving...' : 'Save Local Identity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paste Remote URL / Quick Setup Modal */}
      {showRemoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="apple-glass-modal w-full max-w-lg p-6 rounded-3xl space-y-5 border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <LinkIcon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-100 tracking-tight">Setup Remote Repository</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRemoteModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/10 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab('create-folder')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
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
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Account SSH Identity *</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 font-extrabold focus:outline-none focus:border-teal-400 cursor-pointer shadow-inner"
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Paste Remote GitHub URL *</label>
                <input
                  type="text"
                  required
                  value={pastedUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://github.com/krishnalmahajan687-hash/first.git"
                  className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-400 shadow-inner"
                />
              </div>

              {/* Tab 1: Create New Folder Fields */}
              {activeTab === 'create-folder' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">New Folder Name</label>
                      <input
                        type="text"
                        required
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="first"
                        className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-400 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Parent Directory</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          value={destDir}
                          onChange={(e) => setDestDir(e.target.value)}
                          className="w-full px-3 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 font-mono focus:outline-none shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={handleSelectParentDir}
                          className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs cursor-pointer border border-white/10 shrink-0"
                        >
                          <Folder className="w-4 h-4 text-teal-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Replace Remote in Existing Repo */}
              {activeTab === 'existing-repo' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Select Tracked Local Repository *</label>
                  <select
                    value={targetRepoPath}
                    onChange={(e) => setTargetRepoPath(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-teal-400 cursor-pointer shadow-inner font-extrabold"
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
                <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-white/10 space-y-1 shadow-inner">
                  <div className="text-[10px] uppercase font-extrabold text-emerald-400">
                    Code will push from account: {activeAccount.name} (@{activeAccount.username})
                  </div>
                  <div className="text-xs font-mono text-teal-300 break-all select-all font-bold">{generatedSshUrl}</div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRemoteModal(false)}
                  className="apple-button-secondary flex-1 py-3 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="apple-button-primary flex-1 py-3 rounded-2xl text-xs font-extrabold cursor-pointer shadow-lg shadow-teal-500/20"
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
