import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { Account, Repository } from '../../types';
import { logger } from './loggerService';

interface StorageData {
  accounts: Account[];
  repositories: Repository[];
  settings: {
    firstRunCompleted: boolean;
    autoInstallHooks: boolean;
    identityProtectionEnabled: boolean;
  };
}

export class SecureStorage {
  private filePath: string;
  private encryptionKey: Buffer;

  constructor() {
    const dataDir = path.join(os.homedir(), '.gitidentity');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'store.enc');
    
    // Derive encryption key bound to user/machine hardware
    const secret = `${os.hostname()}-${os.userInfo().username}-gitidentity-v1`;
    this.encryptionKey = crypto.createHash('sha256').update(secret).digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted payload');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public readData(): StorageData {
    const defaultData: StorageData = {
      accounts: [],
      repositories: [],
      settings: {
        firstRunCompleted: false,
        autoInstallHooks: false,
        identityProtectionEnabled: true,
      },
    };

    if (!fs.existsSync(this.filePath)) {
      return defaultData;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const decryptedJson = this.decrypt(raw);
      const parsed = JSON.parse(decryptedJson);
      return { ...defaultData, ...parsed };
    } catch (err: any) {
      logger.error(`Failed to read encrypted storage: ${err.message}`, 'SecureStorage');
      return defaultData;
    }
  }

  public writeData(data: StorageData): void {
    try {
      const json = JSON.stringify(data, null, 2);
      const encrypted = this.encrypt(json);
      fs.writeFileSync(this.filePath, encrypted, 'utf-8');
    } catch (err: any) {
      logger.error(`Failed to write encrypted storage: ${err.message}`, 'SecureStorage');
    }
  }

  // Account operations
  public getAccounts(): Account[] {
    return this.readData().accounts;
  }

  public saveAccount(account: Account): void {
    const data = this.readData();
    const existingIndex = data.accounts.findIndex((a) => a.id === account.id);
    if (existingIndex >= 0) {
      data.accounts[existingIndex] = account;
    } else {
      data.accounts.push(account);
    }
    this.writeData(data);
    logger.info(`Account saved: ${account.username} (${account.sshHostAlias})`, 'SecureStorage');
  }

  public deleteAccount(accountId: string): void {
    const data = this.readData();
    data.accounts = data.accounts.filter((a) => a.id !== accountId);
    this.writeData(data);
    logger.info(`Account deleted: ${accountId}`, 'SecureStorage');
  }

  // Repositories operations
  public getRepositories(): Repository[] {
    return this.readData().repositories;
  }

  public saveRepository(repo: Repository): void {
    const data = this.readData();
    const idx = data.repositories.findIndex((r) => r.path === repo.path);
    if (idx >= 0) {
      data.repositories[idx] = repo;
    } else {
      data.repositories.push(repo);
    }
    this.writeData(data);
  }

  public removeRepository(repoPath: string): void {
    const data = this.readData();
    data.repositories = data.repositories.filter((r) => r.path !== repoPath);
    this.writeData(data);
  }

  // Settings
  public getSettings() {
    return this.readData().settings;
  }

  public updateSettings(partial: Partial<StorageData['settings']>) {
    const data = this.readData();
    data.settings = { ...data.settings, ...partial };
    this.writeData(data);
  }
}

export const secureStorage = new SecureStorage();
