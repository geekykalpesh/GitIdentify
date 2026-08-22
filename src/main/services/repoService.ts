import { execFile } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Account, Repository } from '../../types';
import { hookInstaller } from './hookInstaller';
import { gitHubProvider } from './providers/githubProvider';
import { logger } from './loggerService';
import { secureStorage } from './secureStorage';
import { systemService } from './systemService';

const execFileAsync = util.promisify(execFile);

export class RepoService {
  /**
   * Helper to parse owner and repo name from any GitHub URL (HTTPS or SSH)
   */
  public parseGitHubUrl(urlStr: string): { owner: string; repo: string } | null {
    const cleanUrl = urlStr.trim();
    if (!cleanUrl) return null;

    const httpsMatch = cleanUrl.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/]+?)(\.git)?$/i);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }

    const sshMatch = cleanUrl.match(/^git@[^:]+:([^/]+)\/([^/]+?)(\.git)?$/i);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    return null;
  }

  /**
   * Auto-scans common developer directories on PC to automatically detect & configure repositories without manual user addition
   */
  public async autoScanSystemRepositories(): Promise<Repository[]> {
    logger.info('Auto-scanning system directories for Git repositories...', 'RepoService');
    const accounts = secureStorage.getAccounts();
    if (accounts.length === 0) return secureStorage.getRepositories();

    const homeDir = os.homedir();
    const commonScanDirs = [
      path.join(homeDir, 'Desktop'),
      path.join(homeDir, 'Documents'),
      path.join(homeDir, 'Projects'),
      path.join(homeDir, 'source', 'repos'),
      'C:\\Projects',
      'C:\\Repos',
    ].filter((d) => fs.existsSync(d));

    const detectedRepoPaths = new Set<string>();

    // Also include previously tracked repos
    const saved = secureStorage.getRepositories();
    saved.forEach((r) => detectedRepoPaths.add(r.path));

    for (const parentDir of commonScanDirs) {
      try {
        const entries = fs.readdirSync(parentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const subPath = path.join(parentDir, entry.name);
            if (fs.existsSync(path.join(subPath, '.git'))) {
              detectedRepoPaths.add(subPath);
            }
          }
        }
      } catch (e) {}
    }

    const updatedRepos: Repository[] = [];
    for (const repoPath of Array.from(detectedRepoPaths)) {
      try {
        const repo = await this.inspectRepo(repoPath, accounts);
        secureStorage.saveRepository(repo);
        updatedRepos.push(repo);
      } catch (e) {}
    }

    logger.info(`Auto-scanned ${updatedRepos.length} repository folders on system.`, 'RepoService');
    return updatedRepos;
  }

  /**
   * Reads Git repository details and AUTOMATICALLY derives user.name and user.email from the SSH host alias alone!
   */
  public async inspectRepo(repoPath: string, accounts: Account[]): Promise<Repository> {
    if (!fs.existsSync(path.join(repoPath, '.git'))) {
      throw new Error(`Directory is not a Git repository: ${repoPath}`);
    }

    const repoName = path.basename(repoPath);
    let userEmail = '';
    let userName = '';
    let remoteUrl = '';

    try {
      const { stdout: emailOut } = await execFileAsync('git', ['config', 'user.email'], { cwd: repoPath }).catch(() => ({ stdout: '' }));
      userEmail = emailOut.trim();
    } catch (e) {}

    try {
      const { stdout: nameOut } = await execFileAsync('git', ['config', 'user.name'], { cwd: repoPath }).catch(() => ({ stdout: '' }));
      userName = nameOut.trim();
    } catch (e) {}

    try {
      const { stdout: remoteOut } = await execFileAsync('git', ['config', '--get', 'remote.origin.url'], { cwd: repoPath }).catch(() => ({ stdout: '' }));
      remoteUrl = remoteOut.trim();
    } catch (e) {}

    let hostAlias: string | undefined;
    const sshMatch = remoteUrl.match(/^git@([^:]+):/);
    if (sshMatch) {
      hostAlias = sshMatch[1];
    }

    const parsedUrl = this.parseGitHubUrl(remoteUrl);
    
    // 1. PRIMARY MATCHING BY SSH ALIAS: As requested, if remote URL uses an SSH alias (e.g. github-kirti vs github-geekykalpesh), match account directly from alias!
    let assignedAccount: Account | undefined;
    if (hostAlias) {
      assignedAccount = accounts.find((a) => a.sshHostAlias === hostAlias);
    }

    // 2. SECONDARY MATCHING: If no alias match, match by remote URL owner
    if (!assignedAccount && parsedUrl && parsedUrl.owner) {
      const ownerLower = parsedUrl.owner.toLowerCase();
      assignedAccount = accounts.find((a) => a.username.toLowerCase() === ownerLower || a.id.toLowerCase() === ownerLower);
    }

    // 3. TERTIARY MATCHING: Match by email if already configured
    if (!assignedAccount && userEmail) {
      assignedAccount = accounts.find((a) => a.email && a.email.toLowerCase() === userEmail.toLowerCase());
    }

    // 4. AUTOMATIC IDENTITY DERIVATION: Automatically update local user.name and user.email to match the account derived from the alias!
    if (assignedAccount) {
      if (parsedUrl) {
        const targetRemoteUrl = gitHubProvider.generateRemoteUrl(assignedAccount.sshHostAlias, parsedUrl.owner, parsedUrl.repo);
        if (remoteUrl !== targetRemoteUrl) {
          try {
            await execFileAsync('git', ['config', 'remote.origin.url', targetRemoteUrl], { cwd: repoPath });
            logger.info(`Auto-transformed remote URL for '${repoName}' to '${targetRemoteUrl}'`, 'RepoService');
            remoteUrl = targetRemoteUrl;
            hostAlias = assignedAccount.sshHostAlias;
          } catch (err: any) {}
        }
      }

      // Auto-set local user.name & user.email directly in .git/config so user NEVER has to manually run git config!
      if (userEmail.toLowerCase() !== assignedAccount.email.toLowerCase() || userName !== assignedAccount.username) {
        try {
          await execFileAsync('git', ['config', 'user.name', assignedAccount.username], { cwd: repoPath });
          await execFileAsync('git', ['config', 'user.email', assignedAccount.email], { cwd: repoPath });
          userName = assignedAccount.username;
          userEmail = assignedAccount.email;
          logger.info(`Auto-derived & updated local identity for '${repoName}' to ${assignedAccount.username} (${assignedAccount.email}) from SSH alias '${assignedAccount.sshHostAlias}'`, 'RepoService');
        } catch (e) {}
      }

      // Auto-install pre-commit hook to guarantee future commits in terminal auto-sync identity
      try {
        if (!hookInstaller.isHookInstalled(repoPath)) {
          hookInstaller.installHook(repoPath, assignedAccount);
        }
      } catch (e) {}
    }

    // Mismatch detection
    let isMismatch = false;
    let suspiciousReason: string | undefined;

    if (assignedAccount) {
      if (userEmail && userEmail.toLowerCase() !== assignedAccount.email.toLowerCase()) {
        isMismatch = true;
        suspiciousReason = `Configured commit email '${userEmail}' does not match account '${assignedAccount.username}' email '${assignedAccount.email}'.`;
      } else if (hostAlias && hostAlias !== assignedAccount.sshHostAlias) {
        isMismatch = true;
        suspiciousReason = `Remote host '${hostAlias}' does not match account host alias '${assignedAccount.sshHostAlias}'.`;
      }
    } else if (hostAlias && hostAlias.startsWith('github-')) {
      isMismatch = true;
      suspiciousReason = `Remote uses host alias '${hostAlias}' which is not assigned to any active account in GitIdentity.`;
    }

    const hookInstalled = hookInstaller.isHookInstalled(repoPath);

    return {
      id: Math.random().toString(36).substring(2, 11),
      name: repoName,
      path: repoPath,
      currentName: userName,
      currentEmail: userEmail,
      remoteUrl,
      hostAlias,
      assignedAccountId: assignedAccount?.id,
      hookInstalled,
      isMismatch,
      suspiciousReason,
    };
  }

  /**
   * Replaces or sets origin remote URL for an existing local repository and sets account identity
   */
  public async setRepoRemoteUrl(repoPath: string, account: Account, rawUrl: string): Promise<Repository> {
    const parsed = this.parseGitHubUrl(rawUrl);
    if (!parsed) {
      throw new Error(`Invalid GitHub repository URL: ${rawUrl}`);
    }

    const transformedUrl = gitHubProvider.generateRemoteUrl(account.sshHostAlias, parsed.owner, parsed.repo);
    logger.info(`Setting remote URL for ${repoPath} to ${transformedUrl}`, 'RepoService');

    await execFileAsync('git', ['remote', 'remove', 'origin'], { cwd: repoPath }).catch(() => {});
    await execFileAsync('git', ['remote', 'add', 'origin', transformedUrl], { cwd: repoPath });
    await execFileAsync('git', ['config', 'user.name', account.username], { cwd: repoPath });
    await execFileAsync('git', ['config', 'user.email', account.email], { cwd: repoPath });

    hookInstaller.installHook(repoPath, account);

    const updated = await this.inspectRepo(repoPath, secureStorage.getAccounts());
    secureStorage.saveRepository(updated);
    return updated;
  }

  /**
   * Creates a new folder, initializes a new Git repository, configures identity, and sets remote URL
   */
  public async initNewRepoWithRemote(destinationDir: string, folderName: string, account: Account, rawUrl: string): Promise<Repository> {
    const parsed = this.parseGitHubUrl(rawUrl);
    if (!parsed) {
      throw new Error(`Invalid GitHub repository URL: ${rawUrl}`);
    }

    const repoFolder = path.join(destinationDir, folderName || parsed.repo);
    if (!fs.existsSync(repoFolder)) {
      fs.mkdirSync(repoFolder, { recursive: true });
    }

    logger.info(`Initializing new repository at ${repoFolder}...`, 'RepoService');

    await execFileAsync('git', ['init'], { cwd: repoFolder });
    return await this.setRepoRemoteUrl(repoFolder, account, rawUrl);
  }

  /**
   * Pushes local commits to remote origin repository while enforcing identity & re-authoring unpushed commits if needed
   */
  public async pushToRemote(repoPath: string, branchName: string = 'main'): Promise<{ success: boolean; output: string }> {
    logger.info(`Pushing repository at ${repoPath} to origin...`, 'RepoService');

    const accounts = secureStorage.getAccounts();
    const repoInfo = await this.inspectRepo(repoPath, accounts);

    const activeAccount = accounts.find((a) => a.id === repoInfo.assignedAccountId);

    if (activeAccount) {
      // Enforce user.name and user.email in local repo config right before pushing
      await execFileAsync('git', ['config', 'user.name', activeAccount.username], { cwd: repoPath }).catch(() => {});
      await execFileAsync('git', ['config', 'user.email', activeAccount.email], { cwd: repoPath }).catch(() => {});

      // Check HEAD commit author email. If HEAD commit has wrong author email, auto-amend commit author
      try {
        const { stdout: commitEmailOut } = await execFileAsync('git', ['log', '-1', '--format=%ae'], { cwd: repoPath });
        const commitEmail = commitEmailOut.trim();

        if (commitEmail && commitEmail.toLowerCase() !== activeAccount.email.toLowerCase()) {
          logger.info(`Re-authoring HEAD commit from '${commitEmail}' to '${activeAccount.email}'...`, 'RepoService');
          await execFileAsync('git', [
            'commit',
            '--amend',
            '--no-edit',
            `--author=${activeAccount.username} <${activeAccount.email}>`
          ], { cwd: repoPath });
        }
      } catch (e) {}
    }

    try {
      const { stdout: branchOut } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoPath }).catch(() => ({ stdout: branchName }));
      const activeBranch = branchOut.trim() || branchName;

      const { stdout, stderr } = await execFileAsync('git', ['push', '-u', 'origin', activeBranch], { cwd: repoPath });
      const combined = `${stdout}\n${stderr}`.trim();

      logger.info(`Push result for ${repoPath}: ${combined}`, 'RepoService');
      return { success: true, output: combined || `Successfully pushed to origin/${activeBranch}` };
    } catch (err: any) {
      const errorMsg = err.stderr || err.stdout || err.message || 'Push failed';
      logger.error(`Push failed for ${repoPath}: ${errorMsg}`, 'RepoService');
      return { success: false, output: errorMsg };
    }
  }

  /**
   * Switches repository identity to target account automatically updating remote URL, user.name, and user.email
   */
  public async switchAccountIdentity(repoPath: string, account: Account): Promise<Repository> {
    logger.info(`Switching repository identity at '${repoPath}' to account '${account.username}' (${account.sshHostAlias})`, 'RepoService');

    await execFileAsync('git', ['config', 'user.name', account.username], { cwd: repoPath });
    await execFileAsync('git', ['config', 'user.email', account.email], { cwd: repoPath });

    try {
      const { stdout: currentRemote } = await execFileAsync('git', ['config', '--get', 'remote.origin.url'], { cwd: repoPath });
      const trimmedRemote = currentRemote.trim();

      if (trimmedRemote) {
        const parsed = this.parseGitHubUrl(trimmedRemote);
        if (parsed) {
          const newRemoteUrl = gitHubProvider.generateRemoteUrl(account.sshHostAlias, parsed.owner, parsed.repo);
          await execFileAsync('git', ['config', 'remote.origin.url', newRemoteUrl], { cwd: repoPath });
          logger.info(`Transformed remote URL to: ${newRemoteUrl}`, 'RepoService');
        }
      }
    } catch (e: any) {
      logger.warn(`Could not transform remote URL for repo at ${repoPath}: ${e.message}`, 'RepoService');
    }

    hookInstaller.installHook(repoPath, account);

    const updated = await this.inspectRepo(repoPath, secureStorage.getAccounts());
    secureStorage.saveRepository(updated);
    return updated;
  }

  /**
   * Clone repository using account-specific SSH host alias
   */
  public async cloneRepo(account: Account, owner: string, repo: string, destinationDir: string): Promise<string> {
    const remoteUrl = gitHubProvider.generateRemoteUrl(account.sshHostAlias, owner, repo);
    const targetFolder = path.join(destinationDir, repo);

    logger.info(`Cloning ${remoteUrl} into ${targetFolder}...`, 'RepoService');

    try {
      await execFileAsync('git', ['clone', remoteUrl, targetFolder]);
      await execFileAsync('git', ['config', 'user.name', account.username], { cwd: targetFolder });
      await execFileAsync('git', ['config', 'user.email', account.email], { cwd: targetFolder });

      hookInstaller.installHook(targetFolder, account);

      const inspected = await this.inspectRepo(targetFolder, secureStorage.getAccounts());
      secureStorage.saveRepository(inspected);
      return targetFolder;
    } catch (err: any) {
      logger.error(`Clone failed: ${err.message}`, 'RepoService');
      throw err;
    }
  }
}

export const repoService = new RepoService();
