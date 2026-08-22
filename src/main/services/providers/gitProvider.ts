import { Account, RemoteRepository } from '../../../types';

export interface ProviderConnectionResult {
  success: boolean;
  message: string;
  user?: {
    username: string;
    email?: string;
    avatarUrl?: string;
  };
}

export interface GitProvider {
  getName(): string;
  testConnection(account: Account): Promise<ProviderConnectionResult>;
  getRepositories(account: Account): Promise<RemoteRepository[]>;
  generateRemoteUrl(accountHost: string, owner: string, repo: string): string;
  createRepository?(account: Account, repoName: string, isPrivate: boolean): Promise<RemoteRepository>;
}
