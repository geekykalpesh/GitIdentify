import { describe, it, expect } from 'vitest';
import { gitHubProvider } from '../src/main/services/providers/githubProvider';

describe('GitHubProvider & GitProvider Abstraction', () => {
  it('should return correct provider name', () => {
    expect(gitHubProvider.getName()).toBe('GitHub');
  });

  it('should generate account-specific SSH remote URL', () => {
    const remoteUrl = gitHubProvider.generateRemoteUrl('github-geekykalpesh', 'owner', 'repository');
    expect(remoteUrl).toBe('git@github-geekykalpesh:owner/repository.git');
  });

  it('should sanitize .git extension in repo parameter if supplied', () => {
    const remoteUrl = gitHubProvider.generateRemoteUrl('github-geekykalpesh', 'my-org', 'my-repo.git');
    expect(remoteUrl).toBe('git@github-geekykalpesh:my-org/my-repo.git');
  });
});
