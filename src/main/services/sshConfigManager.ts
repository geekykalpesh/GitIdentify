import fs from 'fs';
import path from 'path';
import os from 'os';
import { Account } from '../../types';
import { logger } from './loggerService';

export const BEGIN_BLOCK = '# --- BEGIN GITIDENTITY MANAGED BLOCK ---';
export const END_BLOCK = '# --- END GITIDENTITY MANAGED BLOCK ---';

export const BEGIN_GITCONFIG_BLOCK = '# --- BEGIN GITIDENTITY MANAGED INCLUDES ---';
export const END_GITCONFIG_BLOCK = '# --- END GITIDENTITY MANAGED INCLUDES ---';

export interface SSHHostConfig {
  alias: string;
  hostName: string;
  user: string;
  identityFile: string;
  identitiesOnly: boolean;
}

export class SSHConfigManager {
  private sshDir: string;
  private configFile: string;
  private backupFile: string;
  private globalGitConfig: string;

  constructor() {
    this.sshDir = path.join(os.homedir(), '.ssh');
    this.configFile = path.join(this.sshDir, 'config');
    this.backupFile = path.join(this.sshDir, 'config.gitidentity.backup');
    this.globalGitConfig = path.join(os.homedir(), '.gitconfig');
  }

  public getSSHDir(): string {
    return this.sshDir;
  }

  public getConfigFile(): string {
    return this.configFile;
  }

  public getBackupFile(): string {
    return this.backupFile;
  }

  /**
   * Ensures ~/.ssh directory exists with proper permissions
   */
  public ensureSSHDirExists(): void {
    if (!fs.existsSync(this.sshDir)) {
      fs.mkdirSync(this.sshDir, { recursive: true, mode: 0o700 });
      logger.info(`Created SSH directory at ${this.sshDir}`, 'SSHConfigManager');
    }
  }

  /**
   * Creates backup of ~/.ssh/config to ~/.ssh/config.gitidentity.backup
   */
  public createBackup(): string | null {
    this.ensureSSHDirExists();
    if (fs.existsSync(this.configFile)) {
      try {
        fs.copyFileSync(this.configFile, this.backupFile);
        logger.info(`Backup created at ${this.backupFile}`, 'SSHConfigManager');
        return this.backupFile;
      } catch (err: any) {
        logger.error(`Failed to create SSH config backup: ${err.message}`, 'SSHConfigManager');
        throw err;
      }
    }
    return null;
  }

  /**
   * Reads full ~/.ssh/config content
   */
  public readConfig(): string {
    this.ensureSSHDirExists();
    if (!fs.existsSync(this.configFile)) {
      return '';
    }
    return fs.readFileSync(this.configFile, 'utf-8');
  }

  /**
   * Generates formatted SSH managed block content from accounts
   */
  public generateManagedBlock(accounts: Account[]): string {
    const lines: string[] = [];
    lines.push(BEGIN_BLOCK);
    lines.push('# Managed automatically by GitIdentity. Do not edit content within these markers.');
    lines.push('');

    accounts.forEach((acc) => {
      if (!acc.sshHostAlias || !acc.sshKeyPath) return;

      const normalizedKeyPath = acc.sshKeyPath.replace(/\\/g, '/');
      const hostName = acc.provider === 'github' ? 'github.com' :
                       acc.provider === 'gitlab' ? 'gitlab.com' :
                       acc.provider === 'bitbucket' ? 'bitbucket.org' : 'github.com';

      lines.push(`Host ${acc.sshHostAlias}`);
      lines.push(`  HostName ${hostName}`);
      lines.push(`  User git`);
      lines.push(`  IdentityFile ${normalizedKeyPath}`);
      lines.push(`  IdentitiesOnly yes`);
      lines.push('');
    });

    lines.push(END_BLOCK);
    return lines.join('\n');
  }

  /**
   * Automatically configures Git includeIf rules in ~/.gitconfig
   * strictly mapping each SSH alias & username to its dedicated identity
   */
  public syncGitConfigIncludes(accounts: Account[]): void {
    logger.info('Syncing Git includeIf rules in ~/.gitconfig...', 'SSHConfigManager');
    const homeDir = os.homedir();

    if (accounts.length === 0) return;

    // 1. Create account-specific gitconfig files
    accounts.forEach((acc) => {
      if (!acc.sshHostAlias || !acc.email || !acc.username) return;
      const accountGitConfigPath = path.join(homeDir, `.gitconfig-${acc.sshHostAlias}`);
      const content = `[user]\n    name = ${acc.username}\n    email = ${acc.email}\n`;
      fs.writeFileSync(accountGitConfigPath, content, 'utf-8');
    });

    // 2. Build includeIf blocks for ~/.gitconfig
    const lines: string[] = [];
    lines.push(BEGIN_GITCONFIG_BLOCK);
    lines.push('# Native Git identity routing managed automatically by GitIdentity.');
    lines.push('');

    accounts.forEach((acc) => {
      if (!acc.sshHostAlias || !acc.username) return;
      const subConfigPath = path.join(homeDir, `.gitconfig-${acc.sshHostAlias}`).replace(/\\/g, '/');
      
      lines.push(`[includeIf "hasconfig:remote.origin.url:git@${acc.sshHostAlias}:*"]`);
      lines.push(`    path = ${subConfigPath}`);
      lines.push(`[includeIf "hasconfig:remote.origin.url:*${acc.username}*"]`);
      lines.push(`    path = ${subConfigPath}`);
      lines.push('');
    });

    lines.push(END_GITCONFIG_BLOCK);
    const managedGitConfigBlock = lines.join('\n');

    // 3. Update ~/.gitconfig managed section safely
    let currentGitConfig = '';
    if (fs.existsSync(this.globalGitConfig)) {
      currentGitConfig = fs.readFileSync(this.globalGitConfig, 'utf-8');
    }

    let newGitConfig = '';
    const beginIdx = currentGitConfig.indexOf(BEGIN_GITCONFIG_BLOCK);
    const endIdx = currentGitConfig.indexOf(END_GITCONFIG_BLOCK);

    if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
      const before = currentGitConfig.substring(0, beginIdx).trimEnd();
      const after = currentGitConfig.substring(endIdx + END_GITCONFIG_BLOCK.length).trimStart();
      newGitConfig = [before, managedGitConfigBlock, after].filter(Boolean).join('\n\n');
    } else {
      const trimmedCurrent = currentGitConfig.trim();
      newGitConfig = trimmedCurrent ? `${trimmedCurrent}\n\n${managedGitConfigBlock}\n` : `${managedGitConfigBlock}\n`;
    }

    fs.writeFileSync(this.globalGitConfig, newGitConfig, 'utf-8');
    logger.info(`Git includeIf rules synced for ${accounts.length} accounts in ~/.gitconfig`, 'SSHConfigManager');
  }

  /**
   * Updates SSH config and Git includeIf rules safely
   */
  public syncAccounts(accounts: Account[]): void {
    this.ensureSSHDirExists();

    // 1. Create backup before modifying
    this.createBackup();

    const currentConfig = this.readConfig();
    const managedBlock = this.generateManagedBlock(accounts);

    let newConfig = '';
    const beginIndex = currentConfig.indexOf(BEGIN_BLOCK);
    const endIndex = currentConfig.indexOf(END_BLOCK);

    if (beginIndex !== -1 && endIndex !== -1 && endIndex > beginIndex) {
      // Replace existing managed block
      const before = currentConfig.substring(0, beginIndex).trimEnd();
      const after = currentConfig.substring(endIndex + END_BLOCK.length).trimStart();
      
      newConfig = [before, managedBlock, after].filter(Boolean).join('\n\n');
    } else {
      // Append managed block to existing config
      const trimmedCurrent = currentConfig.trim();
      newConfig = trimmedCurrent ? `${trimmedCurrent}\n\n${managedBlock}\n` : `${managedBlock}\n`;
    }

    // Write updated config safely
    fs.writeFileSync(this.configFile, newConfig, { encoding: 'utf-8', mode: 0o600 });
    logger.info(`SSH config synced successfully for ${accounts.length} accounts`, 'SSHConfigManager');

    // 2. Sync Git includeIf native routing rules
    this.syncGitConfigIncludes(accounts);
  }

  /**
   * Parse current managed block hosts from config file
   */
  public parseManagedHosts(): SSHHostConfig[] {
    const config = this.readConfig();
    const beginIndex = config.indexOf(BEGIN_BLOCK);
    const endIndex = config.indexOf(END_BLOCK);

    if (beginIndex === -1 || endIndex === -1 || endIndex <= beginIndex) {
      return [];
    }

    const blockText = config.substring(beginIndex + BEGIN_BLOCK.length, endIndex);
    const hosts: SSHHostConfig[] = [];
    let currentHost: Partial<SSHHostConfig> | null = null;

    const lines = blockText.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...vals] = trimmed.split(/\s+/);
      const val = vals.join(' ');

      if (key.toLowerCase() === 'host') {
        if (currentHost && currentHost.alias) {
          hosts.push(currentHost as SSHHostConfig);
        }
        currentHost = { alias: val, hostName: 'github.com', user: 'git', identityFile: '', identitiesOnly: true };
      } else if (currentHost) {
        if (key.toLowerCase() === 'hostname') currentHost.hostName = val;
        if (key.toLowerCase() === 'user') currentHost.user = val;
        if (key.toLowerCase() === 'identityfile') currentHost.identityFile = val;
        if (key.toLowerCase() === 'identitiesonly') currentHost.identitiesOnly = val.toLowerCase() === 'yes';
      }
    }

    if (currentHost && currentHost.alias) {
      hosts.push(currentHost as SSHHostConfig);
    }

    return hosts;
  }
}

export const sshConfigManager = new SSHConfigManager();
