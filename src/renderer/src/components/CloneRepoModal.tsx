import React, { useState, useEffect } from 'react';
import { Account, RemoteRepository } from '../../types';
import { api } from '../utils/api';
import { Download, Folder, RefreshCw, Search, Plus, ExternalLink, Github } from 'lucide-react';

interface CloneRepoModalProps {
  accounts: Account[];
  onCloneComplete: () => void;
}

export const CloneRepoModal: React.FC<CloneRepoModalProps> = ({ accounts, onCloneComplete }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [remoteRepos, setRemoteRepos] = useState<RemoteRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<RemoteRepository | null>(null);
  
  const [customRepoName, setCustomRepoName] = useState('');
  const [customOwner, setCustomOwner] = useState('');

  const [destinationDir, setDestinationDir] = useState('D:\\Projects');
  const [cloning, setCloning] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    if (!activeAccount) return;
    if (activeAccount.token) {
      setLoadingRepos(true);
      api.fetchRemoteList(activeAccount)
        .then((repos) => {
          setRemoteRepos(repos || []);
          setLoadingRepos(false);
        })
        .catch(() => setLoadingRepos(false));
    } else {
      setRemoteRepos([]);
    }
  }, [selectedAccountId]);

  const handleSelectFolder = async () => {
    const folder = await api.openDirectoryDialog();
    if (folder) setDestinationDir(folder);
  };

  const handleClone = async () => {
    if (!activeAccount) return;
    let owner = selectedRepo ? selectedRepo.fullName.split('/')[0] : customOwner;
    let repoName = selectedRepo ? selectedRepo.name : customRepoName;

    if (!owner || !repoName) {
      alert('Please select or specify a repository owner and repository name.');
      return;
    }

    setCloning(true);
    try {
      await api.cloneRepo(activeAccount, owner, repoName, destinationDir);
      alert(`Repository ${repoName} cloned successfully!`);
      onCloneComplete();
    } catch (err: any) {
      alert(`Clone failed: ${err.message}`);
    } finally {
      setCloning(false);
    }
  };

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount || !newRepoName) return;

    setCreating(true);
    try {
      const created = await api.createRemoteRepo(activeAccount, newRepoName, newRepoPrivate);
      if (created) {
        alert(`Created repository ${created.fullName} on GitHub!`);
        setShowCreateModal(false);
        setNewRepoName('');
        const repos = await api.fetchRemoteList(activeAccount);
        setRemoteRepos(repos || []);
        setSelectedRepo(created);
      }
    } catch (err: any) {
      alert(`Create repository failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const filteredRepos = remoteRepos.filter((r) =>
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatedUrl = activeAccount
    ? `git@${activeAccount.sshHostAlias}:${selectedRepo ? selectedRepo.fullName : `${customOwner || 'owner'}/${customRepoName || 'repository'}`}.git`
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="apple-glass p-6 rounded-3xl border border-white/10 space-y-3 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-indigo-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/25 border border-white/20">
              <Download className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Clone & Remote Manager</h2>
              <p className="text-xs text-slate-400/90 font-medium mt-0.5">Automated git clone with pre-configured SSH host alias identity routing</p>
            </div>
          </div>
          
          {activeAccount?.token && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="apple-button-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Remote Repo</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Clone Box */}
      <div className="apple-glass p-7 rounded-3xl space-y-5 border border-white/10 shadow-xl">
        {/* Account Selector */}
        <div>
          <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Target Account Profile:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs font-extrabold text-slate-100 focus:outline-none focus:border-teal-400 shadow-inner"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.username} ({acc.name}) — Alias: {acc.sshHostAlias}
              </option>
            ))}
          </select>
        </div>

        {/* Repository Search & List */}
        <div>
          <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Repository Selection:</label>
          {activeAccount?.token ? (
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search GitHub repositories..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-teal-400 shadow-inner font-medium"
                />
              </div>

              {loadingRepos ? (
                <div className="p-5 text-center text-xs text-slate-400 flex items-center justify-center space-x-2 bg-slate-950/60 rounded-2xl border border-white/5 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Fetching repositories from GitHub API...</span>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 bg-slate-950/90 p-2.5 rounded-2xl border border-white/10 shadow-inner">
                  {filteredRepos.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 font-medium">No repositories found.</div>
                  ) : (
                    filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition cursor-pointer ${
                          selectedRepo?.id === repo.id
                            ? 'bg-teal-500/20 text-teal-200 font-bold border border-teal-500/40 shadow-sm'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Github className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{repo.fullName}</span>
                        </div>
                        {repo.private && (
                          <span className="px-2 py-0.5 text-[9px] bg-slate-800 text-slate-300 rounded-full font-bold border border-white/10">Private</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={customOwner}
                onChange={(e) => setCustomOwner(e.target.value)}
                placeholder="Owner (e.g. geekykalpesh)"
                className="px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-teal-400 shadow-inner font-medium"
              />
              <input
                type="text"
                value={customRepoName}
                onChange={(e) => setCustomRepoName(e.target.value)}
                placeholder="Repository Name (e.g. my-project)"
                className="px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-teal-400 shadow-inner font-medium"
              />
            </div>
          )}
        </div>

        {/* Destination Path */}
        <div>
          <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Destination Directory:</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={destinationDir}
              onChange={(e) => setDestinationDir(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-teal-400 shadow-inner"
            />
            <button
              onClick={handleSelectFolder}
              className="apple-button-secondary px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer"
            >
              <Folder className="w-4 h-4 text-teal-400" />
              <span>Browse</span>
            </button>
          </div>
        </div>

        {/* Dynamic Clone URL Preview */}
        <div className="p-4 bg-slate-950/90 rounded-2xl border border-white/10 space-y-1.5 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
            Application Transformed SSH Remote URL:
          </div>
          <div className="font-mono text-xs text-teal-300 break-all select-all font-bold">
            {generatedUrl}
          </div>
        </div>

        {/* Clone Action Button */}
        <button
          onClick={handleClone}
          disabled={cloning}
          className="apple-button-primary w-full py-3.5 rounded-2xl font-extrabold transition shadow-lg flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>{cloning ? 'Cloning Repository...' : 'Clone Repository'}</span>
        </button>
      </div>

      {/* Create Remote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="apple-glass-modal w-full max-w-md p-7 rounded-3xl space-y-5 border border-white/15 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-100 tracking-tight">Create GitHub Repository</h3>
            <form onSubmit={handleCreateRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1.5">Repository Name *</label>
                <input
                  type="text"
                  required
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="my-awesome-repo"
                  className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-400 shadow-inner"
                />
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="privateCheck"
                  checked={newRepoPrivate}
                  onChange={(e) => setNewRepoPrivate(e.target.checked)}
                  className="rounded-lg bg-slate-950 border-white/10 text-teal-400 w-4 h-4"
                />
                <label htmlFor="privateCheck" className="text-xs text-slate-300 font-semibold cursor-pointer select-none">Private Repository</label>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="apple-button-secondary flex-1 py-3 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="apple-button-primary flex-1 py-3 rounded-2xl text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
