import { describe, it, expect } from 'vitest';
import { SSHConfigManager, BEGIN_BLOCK, END_BLOCK } from '../src/main/services/sshConfigManager';
import { Account } from '../src/types';

describe('SSHConfigManager — Managed Block Strategy', () => {
  const manager = new SSHConfigManager();

  const mockAccounts: Account[] = [
    {
      id: 'geekykalpesh',
      name: 'Personal Account',
      username: 'geekykalpesh',
      email: 'personal@gmail.com',
      provider: 'github',
      sshKeyPath: 'C:/Users/test/.ssh/id_ed25519_github_geekykalpesh',
      publicKeyPath: 'C:/Users/test/.ssh/id_ed25519_github_geekykalpesh.pub',
      sshHostAlias: 'github-geekykalpesh',
      status: 'connected',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'work-user',
      name: 'Work Account',
      username: 'workuser',
      email: 'work@company.com',
      provider: 'github',
      sshKeyPath: 'C:/Users/test/.ssh/id_ed25519_github_workuser',
      publicKeyPath: 'C:/Users/test/.ssh/id_ed25519_github_workuser.pub',
      sshHostAlias: 'github-workuser',
      status: 'connected',
      createdAt: new Date().toISOString(),
    },
  ];

  it('should generate managed block delimited by BEGIN and END markers', () => {
    const block = manager.generateManagedBlock(mockAccounts);
    expect(block).toContain(BEGIN_BLOCK);
    expect(block).toContain(END_BLOCK);
    expect(block).toContain('Host github-geekykalpesh');
    expect(block).toContain('HostName github.com');
    expect(block).toContain('IdentityFile C:/Users/test/.ssh/id_ed25519_github_geekykalpesh');
    expect(block).toContain('Host github-workuser');
  });
});
