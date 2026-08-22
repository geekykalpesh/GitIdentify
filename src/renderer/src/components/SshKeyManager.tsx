import React, { useState, useEffect } from 'react';
import { Key, Copy, Plus, FileCode, Check, ShieldCheck, RefreshCw, Cpu, Trash2, Calendar, Clock } from 'lucide-react';
import { api } from '../utils/api';
import { KeyPairInfo } from '../../types';

export const SshKeyManager: React.FC = () => {
  const [keys, setKeys] = useState<KeyPairInfo[]>([]);
  const [sshConfigContent, setSshConfigContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPubKey, setSelectedPubKey] = useState<string | null>(null);
  const [pubKeyText, setPubKeyText] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const keyList = await api.listSshKeys();
      setKeys(keyList || []);
      const config = await api.getSshConfigContent();
      setSshConfigContent(config || '');
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleReadPubKey = async (pubPath: string) => {
    try {
      const text = await api.readPublicKey(pubPath);
      setPubKeyText(text || '');
      setSelectedPubKey(pubPath);
    } catch (err: any) {
      alert(`Could not read public key: ${err.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pubKeyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToAgent = async (privPath: string) => {
    const success = await api.addKeyToAgent(privPath);
    if (success) {
      alert(`Key added to SSH Agent successfully!`);
    } else {
      alert(`Failed to add key to SSH Agent. Ensure ssh-agent service is running.`);
    }
    loadData();
  };

  const handleDeleteKey = async (privPath: string, keyName: string) => {
    if (confirm(`Are you sure you want to permanently delete the SSH keypair '${keyName}' from ~/.ssh?`)) {
      try {
        await api.deleteSshKey(privPath);
        if (selectedPubKey && selectedPubKey.includes(keyName)) {
          setSelectedPubKey(null);
          setPubKeyText('');
        }
        loadData();
      } catch (err: any) {
        alert(`Failed to delete SSH key: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">SSH Keys & Managed Config</h2>
          <p className="text-xs text-slate-400">View generated keys, creation timestamps, SSH agent status, and inspect ~/.ssh/config</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Keys Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
          <Key className="w-4 h-4 text-teal-400" />
          <span>Detected SSH Keypairs</span>
        </h3>

        {keys.length === 0 ? (
          <div className="glass-card p-6 rounded-xl text-center text-xs text-slate-400">
            No SSH keys found in ~/.ssh directory.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keys.map((k, idx) => {
              const formattedCreated = formatDate(k.createdAt);

              return (
                <div key={idx} className="glass-card glass-card-hover p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200 font-mono">{k.name}</h4>
                        <p className="text-[11px] text-teal-400 font-mono mt-0.5">{k.type}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                          ED25519
                        </span>
                        <button
                          onClick={() => handleDeleteKey(k.privateKeyPath, k.name)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title="Delete SSH Keypair"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {k.comment && (
                      <p className="text-xs text-slate-400 truncate mt-1">Comment: {k.comment}</p>
                    )}

                    {/* Creation Date & Time Badge */}
                    {formattedCreated && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Created: <strong className="text-slate-300 font-semibold">{formattedCreated}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleReadPubKey(k.publicKeyPath)}
                      className="flex items-center space-x-1 text-teal-300 hover:text-teal-200 font-medium cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>View Public Key</span>
                    </button>

                    <button
                      onClick={() => handleAddToAgent(k.privateKeyPath)}
                      className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>ssh-add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Public Key Display Modal/Box */}
      {selectedPubKey && (
        <div className="glass-card p-5 rounded-2xl space-y-3 border-teal-500/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-teal-300 font-mono">Public Key: {selectedPubKey}</h4>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-teal-500 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <textarea
            readOnly
            value={pubKeyText}
            rows={3}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-teal-200 focus:outline-none resize-none select-all"
          />
        </div>
      )}

      {/* Managed SSH Config Viewer */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>Managed SSH Config (~/.ssh/config)</span>
        </h3>

        <div className="glass-card p-4 rounded-2xl space-y-2">
          <p className="text-xs text-slate-400">
            GitIdentity automatically maintains account host aliases within marked boundaries. Non-managed lines are preserved intact.
          </p>
          <pre className="w-full p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-60">
            {sshConfigContent || '# ~/.ssh/config is empty or not created yet.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
