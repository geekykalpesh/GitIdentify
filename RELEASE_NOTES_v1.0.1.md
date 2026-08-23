# 🚀 GitIdentity v1.0.1 — Apple Pro Desktop Release

We are excited to announce **GitIdentity v1.0.1**! This major release brings a complete **Apple Pro macOS Tahoe UI overhaul**, an instant **Splash Loading Screen**, **Code Signing security configuration**, and **Multi-Platform Installer packages** for Windows, macOS, and Linux.

---

## 🌟 What's New in v1.0.1

### 🎨 1. Apple Pro macOS Tahoe Visual Overhaul
- **Specular Glass Panels**: Translucent backdrop blur design system (`.apple-glass`, `.apple-glass-card`) with specular borders (`border-white/10`) and ambient glow highlights.
- **macOS Window Dots**: Added red, yellow, and green traffic light window controls to the sidebar and macOS terminal command boxes.
- **Glossy Action Controls**: Upgraded buttons with specular reflections, active state left pill bars, and interactive hover states.

---

### ⚡ 2. Instant Apple Pro Splash Loading Screen
- Added an instant, zero-flicker HTML splash screen that renders the exact microsecond Chromium opens.
- Features the **GitIdentity Shield Badge**, *"Loading Identity Vault..."* progress spinner, and author credit footer (*Made with ❤️ by geekykalpesh.com*).
- Electron main process window configuration (`show: false`, `ready-to-show`) ensures smooth, seamless transitions into the active user interface.

---

### 🛡️ 3. Windows Code Signing & Security
- Integrated PowerShell certificate generator (`npm run cert:generate`) to build signed executables.
- Added explicit SHA256 signing hash configuration and publisher metadata (`Publisher: GeekyKalpesh`).

---

### 📦 4. Multi-Platform Executable Packages & Clear Naming
Updated `package.json` to generate explicit, self-explanatory filenames for all operating systems:

- **Windows Installer**: `GitIdentity-Windows-Installer-1.0.1.exe`
- **Windows Portable**: `GitIdentity-Windows-Portable-1.0.1.exe`
- **macOS Installer**: `GitIdentity-macOS-Installer-1.0.1.dmg`
- **macOS Zip**: `GitIdentity-macOS-Portable-1.0.1.zip`
- **Linux Package**: `GitIdentity-Linux-Installer-1.0.1.deb`
- **Linux Portable**: `GitIdentity-Linux-Portable-1.0.1.AppImage`

---

### 🛠️ 5. Automated GitHub Actions Multi-Platform CI
- Added `.github/workflows/build.yml` to automatically build and attach `.exe`, `.dmg`, and `.AppImage` binaries to GitHub releases whenever a release tag (`v1.0.1`) is pushed.

---

## 🔗 Author Credits & Support

Made with ❤️ by **[geekykalpesh.com](https://geekykalpesh.com)**  
📧 Contact: **[geekykalpesh@gmail.com](mailto:geekykalpesh@gmail.com)**
