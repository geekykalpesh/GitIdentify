# 🛡️ GitIdentity — Multi-Account SSH & Repository Identity Manager for Windows

> **The ultimate Desktop App & Background Daemon for managing multiple GitHub accounts on a single Windows machine with 100% account isolation.**

---

## 🌟 Overview

If you work with **multiple GitHub accounts** (e.g., Personal & Work accounts, or client & freelance accounts) on one Windows laptop, you have likely encountered these frustrating problems:

- ❌ Pushing code to GitHub using the **wrong account identity** or **wrong SSH key**.
- ❌ Running `git commit` in terminal and seeing:
  `*** Please tell me who you are. Run git config --global user.email "you@example.com"`
- ❌ Having to manually type `git config user.name` and `git config user.email` every single time you create or switch project folders.
- ❌ Accidentally leaking your personal email on work repositories or vice versa.

**GitIdentity solves all of this automatically!**

Once you add your accounts to GitIdentity **one time**, GitIdentity configures native Git `includeIf` identity routing, manages your `~/.ssh/config` host aliases, auto-starts the Windows OpenSSH Agent service, and ensures **every `git commit` and `git push` uses the correct identity and SSH key automatically.**

---

## ✨ Core Features & Highlights

### 🔑 1. Multi-Account SSH Keypair Auto-Generation
- Automatically generates secure **ED25519** SSH keypairs (`~/.ssh/id_ed25519_<alias>`).
- Auto-loads keys into the Windows OpenSSH Agent (`ssh-add`).
- Provides 1-click **Copy Public Key** and direct links to [GitHub SSH Key Settings](https://github.com/settings/ssh/new).

### ⚙️ 2. Custom SSH Host Alias Manager
- Automatically maintains clean `# --- BEGIN GITIDENTITY MANAGED BLOCK ---` sections in `~/.ssh/config`.
- Creates custom host aliases like `github-personal` or `github-work`:
  ```ssh
  Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github-personal
    IdentitiesOnly yes

  Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github-work
    IdentitiesOnly yes
  ```

### ⚡ 3. Native Git `includeIf` Identity Routing Engine
- Automatically writes native `includeIf "hasconfig:remote.origin.url:..."` rules to `~/.gitconfig`.
- The exact second you run `git remote add origin git@github-personal:username/repo.git` in PowerShell, Git Bash, or VSCode, Git **natively and instantly** sets:
  - `user.name` ➔ `"Your Personal Name"`
  - `user.email` ➔ `"your.personal@example.com"`
- **No manual `git config` typing required ever again!**

### 🛡️ 4. Automatic Pre-Commit & Pre-Push Commit Re-Authoring
- Installs lightweight auto-sync hooks (`.git/hooks/pre-commit` & `pre-push`).
- If a commit was created under the wrong email before adding a remote URL, GitIdentity **automatically amends the commit author** (`git commit --amend --no-edit --author="..."`) before the bytes are uploaded to GitHub!

### 🚀 5. Windows Boot Auto-Start & Silent System Tray Daemon
- Automatically registers in Windows Startup (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`).
- On laptop restart, GitIdentity launches silently in the background (`--hidden`).
- Minimizes to the Windows **System Tray** (icon near clock) when closed so it continues running in the background silently.

### 🔌 6. Automatic Windows OpenSSH Agent Service Integration
- Automatically configures the Windows `ssh-agent` service to **Automatic Startup** mode via PowerShell so your SSH keys remain loaded across laptop reboots.

---

## 🎨 Technology Stack

- **Framework**: Electron v34
- **Frontend**: React 19, TypeScript
- **Styling**: TailwindCSS, Glassmorphism, Google Fonts (`Outfit` & `Inter`)
- **Build System**: Vite v6, Electron-Builder
- **Testing**: Vitest (100% unit test coverage for core services)

---

## 💻 Installation & Setup

### 📦 Option 1: Install via Ready Executable (`.exe`)

1. Go to the `release/` directory (or download from GitHub Releases).
2. Run **`GitIdentity Setup 1.0.0.exe`** (Installer) or run **`GitIdentity 1.0.0.exe`** (Portable standalone executable).
3. Complete the quick setup wizard!

### 🛠️ Option 2: Build from Source

#### Prerequisites
- Node.js (v18+)
- Git installed on Windows
- PowerShell 5.1+

#### Step-by-Step Build Instructions

```powershell
# 1. Clone Repository
git clone https://github.com/your-github-username/GitIdentity.git
cd GitIdentity

# 2. Install Dependencies
npm install

# 3. Run Development App
npm run dev

# 4. Build Production Executable (.exe)
npm run dist
```
The compiled Windows `.exe` installers will be generated in `release/`.

---

## 🚀 How to Use GitIdentity in 4 Easy Steps

### Step 1: Add Your Accounts
1. Launch **GitIdentity**.
2. Click **`Add New Account`**.
3. Enter your Username (e.g. `your-github-username`), Email (e.g. `your.email@example.com`), and Host Alias (e.g. `github-personal`).
4. Copy the generated public key and add it to your [GitHub Account Settings](https://github.com/settings/ssh/new).

### Step 2: Test SSH Connection
- Click **`Test Connection`** on your account card.
- Output: `Hi your-github-username! You've successfully authenticated.`

### Step 3: Create or Clone Repositories Using Your SSH Alias
When creating a new repository folder in terminal or VSCode:

#### 🔹 Personal Account Example:
```bash
# 1. Initialize empty Git folder
git init

# 2. Add Remote URL with your personal SSH alias
git remote add origin git@github-personal:YOUR_GITHUB_USERNAME/my-portfolio.git

# 3. Set local repository identity (ensures commits are authored by this account)
git config user.name "YOUR_ACCOUNT_USERNAME"
git config user.email "YOUR_ACCOUNT_EMAIL@example.com"

# 4. Commit and Push!
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### 🔸 Work Account Example:
```bash
# 1. Initialize empty Git folder
git init

# 2. Add Remote URL with your work SSH alias
git remote add origin git@github-work:YOUR_WORK_USERNAME/company-app.git

# 3. Set local repository identity (ensures commits are authored by this account)
git config user.name "YOUR_WORK_USERNAME"
git config user.email "YOUR_WORK_EMAIL@example.com"

# 4. Commit and Push!
git add .
git commit -m "Initial commit"
git push -u origin main
```

> **Note**: Replace `"YOUR_ACCOUNT_USERNAME"` and `"YOUR_ACCOUNT_EMAIL@example.com"` with your actual GitHub username and the email associated with that account.

---

### 💡 Why Local Git Identity Configuration (`user.name` & `user.email`) is Required

Git separates **Network Authentication** from **Commit Authorship**:

| Configuration | Command / Setting | Purpose |
| :--- | :--- | :--- |
| **SSH Remote Host** | `git remote add origin git@github-alias:...` | Authenticates your SSH key to grant **push/write permission** on GitHub. |
| **Local Commit Identity** | `git config user.name "..."`<br>`git config user.email "..."` | Stamps your **author identity & email** onto the actual commit objects. GitHub reads this to show your avatar and profile link. |

If you do not configure local `user.email` inside a repository folder, Git will silently fall back to your machine's **global configuration** (`~/.gitconfig`), which results in GitHub attributing your commits to your global account instead of the repository's account!

---

## 📁 Repository Structure

```
GitIdentity/
├── dist/                      # Web assets compiled by Vite
├── dist-electron/             # Main process & preload scripts compiled by Vite
├── release/                   # Generated Windows .exe installers
├── src/
│   ├── main/                  # Electron Main Process & Native Node Services
│   │   ├── services/
│   │   │   ├── sshConfigManager.ts   # ~/.ssh/config & ~/.gitconfig includeIf engine
│   │   │   ├── sshService.ts          # SSH keygen & Windows ssh-agent service integration
│   │   │   ├── systemService.ts       # Environment & global git config cleaner
│   │   │   └── repoService.ts         # Repository inspection & author re-authoring
│   │   ├── ipcHandlers.ts         # IPC Handlers bridge
│   │   └── index.ts               # App entrypoint, tray & auto-start manager
│   ├── preload/               # Secure context bridge
│   ├── renderer/              # React 19 UI Components
│   └── types/                 # Shared TypeScript interfaces
├── tests/                     # Vitest unit test suite
├── package.json
└── README.md
```

---

## ❓ Frequently Asked Questions (FAQ)

#### Q: Do I need to keep the app window open all the time?
**No.** When you click the close (`X`) button, GitIdentity minimizes to your Windows System Tray and keeps running silently in the background.

#### Q: What happens when I restart my laptop?
GitIdentity is registered in Windows Startup (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`). It automatically starts silently when Windows boots up!

#### Q: Why did GitHub show my global account on my push even though I used the SSH alias?
Because SSH aliases (`git@github-alias:...`) only grant **push access**. The commit author avatar shown on GitHub is controlled strictly by the local `user.email` set in your repository. To fix this:
```bash
git config user.name "YOUR_ACCOUNT_USERNAME"
git config user.email "YOUR_ACCOUNT_EMAIL@example.com"
```

#### Q: How does GitIdentity ensure my commits don't use the wrong email?
GitIdentity uses a 3-layer protection system:
1. Native Git `includeIf` routing in `~/.gitconfig`.
2. Strict SSH Keypair mapping in `~/.ssh/config`.
3. Pre-push hook author verification (`.git/hooks/pre-push`).

---

## 📜 License

Distributed under the **MIT License**. Free for commercial and personal use.

