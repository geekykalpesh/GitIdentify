import { GitProvider, ProviderConnectionResult } from './gitProvider';
import { Account, RemoteRepository } from '../../../types';
import { sshService } from '../sshService';
import { logger } from '../loggerService';

export class GitHubProvider implements GitProvider {
  public getName(): string {
    return 'GitHub';
  }

  /**
   * Generates SSH remote URL using account custom host alias
   * Example output: git@github-geekykalpesh:owner/repository.git
   */
  public generateRemoteUrl(accountHost: string, owner: string, repo: string): string {
    const cleanOwner = owner.trim();
    const cleanRepo = repo.replace(/\.git$/, '').trim();
    const host = accountHost.trim();
    return `git@${host}:${cleanOwner}/${cleanRepo}.git`;
  }

  /**
   * Tests SSH connection to GitHub host alias & validates token if provided
   */
  public async testConnection(account: Account): Promise<ProviderConnectionResult> {
    logger.info(`Testing GitHub connection for account ${account.username} (${account.sshHostAlias})`, 'GitHubProvider');

    // 1. SSH Test
    const sshResult = await sshService.testSSHConnection(account.sshHostAlias);
    if (!sshResult.success) {
      return {
        success: false,
        message: `SSH Connection failed: ${sshResult.message}`,
      };
    }

    // 2. Token Test (if token is available)
    if (account.token) {
      try {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `token ${account.token}`,
            'User-Agent': 'GitIdentity-Desktop-App',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            message: `Successfully authenticated via SSH & GitHub API as @${data.login}`,
            user: {
              username: data.login,
              email: data.email,
              avatarUrl: data.avatar_url,
            },
          };
        }
      } catch (err: any) {
        logger.warn(`GitHub API test warning: ${err.message}. SSH connection remains valid.`, 'GitHubProvider');
      }
    }

    return {
      success: true,
      message: `Successfully connected via SSH as ${sshResult.username || account.username}`,
      user: {
        username: sshResult.username || account.username,
        email: account.email,
      },
    };
  }

  /**
   * Fetch user repositories from GitHub REST API
   */
  public async getRepositories(account: Account): Promise<RemoteRepository[]> {
    if (!account.token) {
      logger.warn(`No GitHub OAuth token provided for account ${account.username}`, 'GitHubProvider');
      return [];
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          Authorization: `token ${account.token}`,
          'User-Agent': 'GitIdentity-Desktop-App',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned HTTP ${response.status}`);
      }

      const repos = await response.json();
      return repos.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        description: r.description,
        cloneUrl: r.clone_url,
        sshUrl: this.generateRemoteUrl(account.sshHostAlias, r.owner.login, r.name),
        htmlUrl: r.html_url,
      }));
    } catch (err: any) {
      logger.error(`Failed to fetch GitHub repositories for ${account.username}: ${err.message}`, 'GitHubProvider');
      throw err;
    }
  }

  /**
   * Create a new repository on GitHub
   */
  public async createRepository(account: Account, repoName: string, isPrivate: boolean): Promise<RemoteRepository> {
    if (!account.token) {
      throw new Error('GitHub token is required to create a repository on GitHub');
    }

    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `token ${account.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GitIdentity-Desktop-App',
        },
        body: JSON.stringify({
          name: repoName,
          private: isPrivate,
          auto_init: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const r = await response.json();
      return {
        id: String(r.id),
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        description: r.description,
        cloneUrl: r.clone_url,
        sshUrl: this.generateRemoteUrl(account.sshHostAlias, r.owner.login, r.name),
        htmlUrl: r.html_url,
      };
    } catch (err: any) {
      logger.error(`Failed to create repository ${repoName}: ${err.message}`, 'GitHubProvider');
      throw err;
    }
  }
}

export const gitHubProvider = new GitHubProvider();
