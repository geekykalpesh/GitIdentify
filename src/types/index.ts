export type ProviderType = 'github' | 'gitlab' | 'bitbucket';

export interface Account {
  id: string;
  name: string;
  username: string;
  email: string;
  provider: ProviderType;
  sshKeyPath: string;
  publicKeyPath: string;
  sshHostAlias: string;
  token?: string;
  status: 'connected' | 'error' | 'unverified';
  createdAt: string;
  isDefault?: boolean;
}

export interface KeyPairInfo {
  name: string;
  privateKeyPath: string;
  publicKeyPath: string;
  type: string;
  comment?: string;
  exists: boolean;
  createdAt?: string;
}

export interface SystemStatus {
  git: { installed: boolean; version?: string };
  ssh: { installed: boolean; version?: string };
  sshDir: { exists: boolean; path: string };
  os: { platform: string; arch: string };
  sshAgent: { running: boolean; keyCount: number };
  globalGit?: { name?: string; email?: string; configPath?: string };
}

export interface Repository {
  id: string;
  name: string;
  path: string;
  currentName?: string;
  currentEmail?: string;
  remoteUrl?: string;
  hostAlias?: string;
  assignedAccountId?: string;
  hookInstalled: boolean;
  isMismatch: boolean;
  suspiciousReason?: string;
}

export interface RemoteRepository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  description?: string;
  cloneUrl: string;
  sshUrl: string;
  htmlUrl: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  category?: string;
}

export interface SecurityCheckResult {
  passed: boolean;
  issues: string[];
}
