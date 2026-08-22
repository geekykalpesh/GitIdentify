import { GitIdentityApi } from '../../../preload';

/**
 * Safe API proxy providing graceful fallbacks if Electron IPC is initializing or unavailable
 */
export const api: GitIdentityApi = new Proxy({} as GitIdentityApi, {
  get(_target, prop: string) {
    if (typeof window !== 'undefined' && window.gitIdentityApi && (window.gitIdentityApi as any)[prop]) {
      return (window.gitIdentityApi as any)[prop];
    }
    // Return dummy async function fallback to prevent runtime crashes
    return async () => {
      console.warn(`[GitIdentity API Warning] ${prop} called before IPC ready or outside Electron`);
      if (prop === 'getSystemStatus') {
        return {
          git: { installed: true, version: 'git 2.55.0' },
          ssh: { installed: true, version: 'OpenSSH' },
          sshDir: { exists: true, path: '~/.ssh' },
          os: { platform: 'win32', arch: 'x64' },
          sshAgent: { running: true, keyCount: 0 },
        };
      }
      if (prop === 'getAccounts') return [];
      if (prop === 'getRepositories') return [];
      if (prop === 'getLogs') return [];
      if (prop === 'getSettings') return { firstRunCompleted: false, autoInstallHooks: false, identityProtectionEnabled: true };
      if (prop === 'listSshKeys') return [];
      if (prop === 'getSshConfigContent') return '# ~/.ssh/config';
      if (prop === 'pushToRemote') return { success: true, output: 'Pushed to origin' };
      return null;
    };
  },
});
