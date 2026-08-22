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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">GitHub Repositories & API</h2>
          <p className="text-xs text-slate-400 font-mono">Automatic transformed remote URL: git@github-account:owner/repo.git</p>
        </div>
        
        {activeAccount?.token && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-semibold border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Remote Repo</span>
          </button>
        )}
      </div>

      {/* Main Clone Box */}
      <div className="glass-card p-6 rounded-2xl space-y-5">
        {/* Account Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Account:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-200 focus:outline-none focus:border-teal-500"
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
          <label className="block text-xs font-semibold text-slate-400 mb-1">Repository:</label>
          {activeAccount?.token ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="[ Search repositories... ]"
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              {loadingRepos ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Fetching repositories from GitHub API...</span>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {filteredRepos.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">No repositories found.</div>
                  ) : (
                    filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition ${
                          selectedRepo?.id === repo.id
                            ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30'
                            : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Github className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{repo.fullName}</span>
                        </div>
                        {repo.private && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-400 rounded">Private</span>
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
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
              <input
                type="text"
                value={customRepoName}
                onChange={(e) => setCustomRepoName(e.target.value)}
                placeholder="Repository Name (e.g. my-project)"
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}
        </div>

        {/* Destination Path */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Destination:</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={destinationDir}
              onChange={(e) => setDestinationDir(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleSelectFolder}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1"
            >
              <Folder className="w-4 h-4 text-teal-400" />
              <span>Browse</span>
            </button>
          </div>
        </div>

        {/* Dynamic Clone URL Preview */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Application Automatically Uses:
          </div>
          <div className="font-mono text-xs text-teal-300 break-all select-all">
            {generatedUrl}
          </div>
        </div>

        {/* Clone Action Button */}
        <button
          onClick={handleClone}
          disabled={cloning}
          className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl transition shadow-lg flex items-center justify-center space-x-2 text-sm"
        >
          <Download className="w-4 h-4" />
          <span>{cloning ? 'Cloning Repository...' : '[Clone]'}</span>
        </button>
      </div>

      {/* Create Remote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl space-y-5 border border-slate-800">
            <h3 className="text-lg font-bold text-slate-100">Create GitHub Repository</h3>
            <form onSubmit={handleCreateRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Repository Name *</label>
                <input
                  type="text"
                  required
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="my-awesome-repo"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="privateCheck"
                  checked={newRepoPrivate}
                  onChange={(e) => setNewRepoPrivate(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-teal-500"
                />
                <label htmlFor="privateCheck" className="text-xs text-slate-300 font-medium">Private Repository</label>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold"
                >
                  {creating ? 'Creating...' : 'Create Repo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
