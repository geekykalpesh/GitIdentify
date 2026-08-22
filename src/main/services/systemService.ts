import { execFile } from 'child_process';
import util from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SystemStatus, Account } from '../../types';
import { sshConfigManager } from './sshConfigManager';
import { sshService } from './sshService';
import { logger } from './loggerService';

const execFileAsync = util.promisify(execFile);

export class SystemService {
  public async getSystemStatus(): Promise<SystemStatus> {
    logger.info('Performing system status detection...', 'SystemService');

    // 1. Detect Git
    let gitInstalled = false;
    let gitVersion: string | undefined;
    try {
      const { stdout } = await execFileAsync('git', ['--version']);
      gitInstalled = true;
      gitVersion = stdout.trim();
    } catch (e) {
      gitInstalled = false;
    }

    // 2. Detect SSH
    let sshInstalled = false;
    let sshVersion: string | undefined;
    try {
      const { stdout, stderr } = await execFileAsync('ssh', ['-V']);
      sshInstalled = true;
      sshVersion = (stderr || stdout).trim();
    } catch (e) {
      sshInstalled = false;
    }

    // 3. Detect SSH Directory
    const sshDir = sshConfigManager.getSSHDir();
    const sshDirExists = fs.existsSync(sshDir);

    // 4. Detect SSH Agent
    const agentInfo = await sshService.checkSSHAgent();

    // 5. Detect Global Git Config (~/.gitconfig)
    let globalName: string | undefined;
    let globalEmail: string | undefined;
    try {
      const { stdout: gName } = await execFileAsync('git', ['config', '--global', 'user.name']).catch(() => ({ stdout: '' }));
      globalName = gName.trim() || undefined;
    } catch (e) {}

    try {
      const { stdout: gEmail } = await execFileAsync('git', ['config', '--global', 'user.email']).catch(() => ({ stdout: '' }));
      globalEmail = gEmail.trim() || undefined;
    } catch (e) {}

    const status: SystemStatus = {
      git: { installed: gitInstalled, version: gitVersion },
      ssh: { installed: sshInstalled, version: sshVersion },
      sshDir: { exists: sshDirExists, path: sshDir },
      os: { platform: process.platform, arch: process.arch },
      sshAgent: { running: agentInfo.running, keyCount: agentInfo.keyCount },
      globalGit: {
        name: globalName,
        email: globalEmail,
        configPath: `${os.homedir()}/.gitconfig`,
      },
    };

    logger.info(`System detection result: Git=${gitInstalled}, SSH=${sshInstalled}, GlobalEmail=${globalEmail}`, 'SystemService');
    return status;
  }

  /**
   * Sets default global user.name & user.email to primary account so git commit anywhere on PC never fails
   */
  public async setDefaultGlobalIdentity(account: Account): Promise<boolean> {
    logger.info(`Setting global git identity to primary account '${account.username}' <${account.email}>...`, 'SystemService');
    try {
      await execFileAsync('git', ['config', '--global', 'user.name', account.username]);
      await execFileAsync('git', ['config', '--global', 'user.email', account.email]);
      await execFileAsync('git', ['config', '--global', '--unset', 'user.useConfigOnly']).catch(() => {});
      return true;
    } catch (err: any) {
      logger.error(`Failed setting default global identity: ${err.message}`, 'SystemService');
      return false;
    }
  }

  /**
   * Cleans global git config (~/.gitconfig)
   */
  public async cleanGlobalGitConfig(): Promise<boolean> {
    logger.info('Cleaning global git config (~/.gitconfig)...', 'SystemService');
    try {
      await execFileAsync('git', ['config', '--global', '--unset', 'user.useConfigOnly']).catch(() => {});
      return true;
    } catch (err: any) {
      return false;
    }
  }

  /**
   * Unsets global user.email & user.name
   */
  public async unsetGlobalGitIdentity(): Promise<boolean> {
    return this.cleanGlobalGitConfig();
  }
}

export const systemService = new SystemService();
