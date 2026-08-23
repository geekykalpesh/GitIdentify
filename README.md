# 🛡️ GitIdentity — Multi-Account SSH & Repository Identity Manager

[![Version](https://img.shields.io/badge/version-1.0.1-teal.svg?style=for-the-badge)](https://github.com/geekykalpesh/GitIdentify/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg?style=for-the-badge)](https://github.com/geekykalpesh/GitIdentify)
[![License](https://img.shields.io/badge/license-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Made%20by-GeekyKalpesh-rose.svg?style=for-the-badge)](https://geekykalpesh.com)

> **The ultimate cross-platform Desktop Application & Daemon for managing multiple GitHub accounts on Windows, macOS, and Linux with 100% account isolation and SSH key routing.**

---

## 🌟 Overview

If you work with **multiple GitHub accounts** (e.g., Personal & Work accounts, client & freelance profiles) on a single computer, you have likely encountered these frustrating problems:

- ❌ Pushing code to GitHub using the **wrong account identity** or **wrong SSH key**.
- ❌ Running `git commit` in terminal and seeing:
  `*** Please tell me who you are. Run git config --global user.email "you@example.com"`
- ❌ Having to manually type `git config user.name` and `git config user.email` every single time you switch project folders.
- ❌ Accidentally leaking your personal email on work repositories or vice versa.

**GitIdentity solves all of this automatically with zero manual effort!**

Once you add your accounts to GitIdentity **one time**, GitIdentity configures native Git `includeIf` identity routing, manages your `~/.ssh/config` host aliases, auto-starts the native OpenSSH Agent, and ensures **every `git commit` and `git push` uses the correct identity and SSH key automatically.**

---

## ✨ Key Features & Highlights

### 🔑 1. Multi-Account SSH Keypair Auto-Generation
- Automatically generates secure **ED25519** SSH keypairs (`~/.ssh/id_ed25519_<alias>`).
- Auto-loads keys into the native OpenSSH Agent (`ssh-add`).
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
- The exact second you run `git remote add origin git@github-personal:username/repo.git` in PowerShell, Terminal, or VSCode, Git **natively and instantly** sets:
  - `user.name` ➔ `"Your Personal Name"`
  - `user.email` ➔ `"your.personal@example.com"`
- **No manual `git config` typing required ever again!**

### 🎨 4. Apple Pro macOS Tahoe UI & Splash Screen
- Built with an ultra-sleek **Apple Glassmorphism UI**, custom macOS traffic light controls, terminal boxes, and an instant non-flickering splash loading screen.

### 🚀 5. Boot Auto-Start & Silent System Tray Daemon
- Automatically registers in system boot startup.
- On restart, GitIdentity launches silently in the background (`--hidden`).
- Minimizes to the **System Tray** when closed so it continues running in the background silently.

---

## 💻 Download & Installation

Download the compiled installer for your operating system from the [Latest Releases Page](https://github.com/geekykalpesh/GitIdentify/releases):

| Operating System | Output File | Type |
| :--- | :--- | :--- |
| **Windows** | `GitIdentity-Windows-Installer-1.0.1.exe` | Standard Windows Setup Wizard |
| **Windows Portable** | `GitIdentity-Windows-Portable-1.0.1.exe` | Portable Executable (No installation required) |
| **macOS** | `GitIdentity-macOS-Installer-1.0.1.dmg` | macOS Disk Image Installer |
| **Linux (Ubuntu/Debian)** | `GitIdentity-Linux-Installer-1.0.1.deb` | Debian / Ubuntu Package |
| **Linux Portable** | `GitIdentity-Linux-Portable-1.0.1.AppImage` | Universal Linux Portable Binary |

---

## 🛠️ Build from Source

### Prerequisites
- Node.js (v18+)
- Git installed on your system
- npm / npx

### Setup Commands
```bash
# 1. Clone Repository
git clone https://github.com/geekykalpesh/GitIdentify.git
cd GitIdentify

# 2. Install Dependencies
npm install

# 3. Run Development App
npm run dev

# 4. Build Production Executables
npm run dist:win      # Build Windows Executables
npm run dist:mac      # Build macOS Executables
npm run dist:linux    # Build Linux Executables
```

---

## 🔍 Recommended GitHub Topic Tags for SEO

To help developers discover this repository on GitHub Search, add these topics under **Repository Settings ➔ Topics**:

`git-identity` • `ssh-manager` • `github-accounts` • `multi-account-git` • `git-profile-switcher` • `electron` • `developer-tools` • `ssh-key-management` • `cross-platform` • `ssh-alias`

---

## 📜 License & Credits

Distributed under the **MIT License**. Free for commercial and personal use.

Made with ❤️ by **[geekykalpesh.com](https://geekykalpesh.com)**  
📧 Contact: **[geekykalpesh@gmail.com](mailto:geekykalpesh@gmail.com)**
