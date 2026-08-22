import fs from 'fs';
import path from 'path';
import { Account } from '../../types';
import { logger } from './loggerService';

export class HookInstaller {
  /**
   * Generates auto-syncing shell script for pre-commit & pre-push Git hooks
   */
  private generateHookScript(expectedEmail: string, expectedAccountName: string, hostAlias: string): string {
    return `#!/bin/sh
# --- BEGIN GITIDENTITY AUTO-SYNC HOOK ---
# Managed automatically by GitIdentity Desktop App.

EXPECTED_EMAIL="${expectedEmail}"
EXPECTED_NAME="${expectedAccountName}"
EXPECTED_HOST="${hostAlias}"

CURRENT_EMAIL=$(git config user.email)
CURRENT_NAME=$(git config user.name)

# 1. Auto-fix local user config before commit/push is recorded
if [ "$CURRENT_EMAIL" != "$EXPECTED_EMAIL" ] || [ "$CURRENT_NAME" != "$EXPECTED_NAME" ]; then
    echo "[GitIdentity] Auto-configuring local repository user.name to '$EXPECTED_NAME' and user.email to '$EXPECTED_EMAIL'..."
    git config user.name "$EXPECTED_NAME"
    git config user.email "$EXPECTED_EMAIL"
fi

# 2. Check HEAD commit author email. If commit author email does not match expected account, auto-reauthor commit!
LAST_COMMIT_EMAIL=$(git log -1 --format='%ae' 2>/dev/null)
if [ -n "$LAST_COMMIT_EMAIL" ] && [ "$LAST_COMMIT_EMAIL" != "$EXPECTED_EMAIL" ]; then
    echo "[GitIdentity] Re-authoring HEAD commit from '$LAST_COMMIT_EMAIL' to '$EXPECTED_NAME <$EXPECTED_EMAIL>'..."
    git commit --amend --no-edit --author="$EXPECTED_NAME <$EXPECTED_EMAIL>" 2>/dev/null
fi

exit 0
# --- END GITIDENTITY HOOK ---
`;
  }

  /**
   * Installs pre-commit and pre-push hooks into a local Git repository
   */
  public installHook(repoPath: string, account: Account): void {
    const gitHooksDir = path.join(repoPath, '.git', 'hooks');
    if (!fs.existsSync(gitHooksDir)) {
      fs.mkdirSync(gitHooksDir, { recursive: true });
    }

    const scriptContent = this.generateHookScript(account.email, account.username, account.sshHostAlias);

    const preCommitPath = path.join(gitHooksDir, 'pre-commit');
    const prePushPath = path.join(gitHooksDir, 'pre-push');

    // Write hooks
    fs.writeFileSync(preCommitPath, scriptContent, { encoding: 'utf-8', mode: 0o755 });
    fs.writeFileSync(prePushPath, scriptContent, { encoding: 'utf-8', mode: 0o755 });

    // Save .gitidentity config file inside repo for reference
    const metaPath = path.join(repoPath, '.git', 'gitidentity.json');
    fs.writeFileSync(metaPath, JSON.stringify({
      accountId: account.id,
      username: account.username,
      email: account.email,
      sshHostAlias: account.sshHostAlias,
      installedAt: new Date().toISOString()
    }, null, 2));

    logger.info(`GitIdentity auto-sync hook installed in ${repoPath} for ${account.username}`, 'HookInstaller');
  }

  /**
   * Removes GitIdentity hooks from repository
   */
  public removeHook(repoPath: string): void {
    const gitHooksDir = path.join(repoPath, '.git', 'hooks');
    const preCommitPath = path.join(gitHooksDir, 'pre-commit');
    const prePushPath = path.join(gitHooksDir, 'pre-push');
    const metaPath = path.join(repoPath, '.git', 'gitidentity.json');

    if (fs.existsSync(preCommitPath)) fs.unlinkSync(preCommitPath);
    if (fs.existsSync(prePushPath)) fs.unlinkSync(prePushPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);

    logger.info(`GitIdentity hook removed from ${repoPath}`, 'HookInstaller');
  }

  /**
   * Checks if GitIdentity hook is installed in repo
   */
  public isHookInstalled(repoPath: string): boolean {
    const metaPath = path.join(repoPath, '.git', 'gitidentity.json');
    const preCommitPath = path.join(repoPath, '.git', 'hooks', 'pre-commit');
    return fs.existsSync(metaPath) && fs.existsSync(preCommitPath);
  }
}

export const hookInstaller = new HookInstaller();
