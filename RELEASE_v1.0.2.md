# 🛡️ Release Notes — GitIdentity v1.0.2

`GitIdentity v1.0.2 — Rendering & Component Fix Release 🚀`

---

<h1 align="center">GitIdentity v1.0.2</h1>

<p align="center">
  <b>Multi-Account SSH & Repository Identity Manager for GitHub</b><br>
  <i>Managed SSH Key Routing & Native Git IncludeIf Identity Switcher</i>
</p>

---

## 🌟 What's New in v1.0.2

### 1. 🐛 Icon Reference Fix in Account Manager
- Fixed a missing component import (`ExternalLink`) in `AccountManager.tsx` that caused rendering errors in the GitHub Account Manager tab.
- Re-verified all component icon dependencies across the application.

### 2. 🛡️ Global React Error Boundary Protection
- Added a top-level `ErrorBoundary` component in `main.tsx`.
- Ensures any unexpected React component error renders a clean fallback screen with a 1-click **Reload Application** button instead of breaking to a blank window.

---

## 📦 Multi-Platform Release Assets

| Operating System | Installer / Binary Name | Type |
| :--- | :--- | :--- |
| **Windows** | `GitIdentity-Windows-Installer-1.0.2.exe` | Standard Windows Setup Wizard |
| **Windows Portable** | `GitIdentity-Windows-Portable-1.0.2.exe` | Portable Executable (No installation required) |
| **macOS** | `GitIdentity-macOS-Installer-1.0.2.dmg` | macOS Disk Image Installer |
| **macOS Portable** | `GitIdentity-macOS-Portable-1.0.2.zip` | Standalone Zipped `.app` Package |
| **Linux (Debian/Ubuntu)** | `GitIdentity-Linux-Installer-1.0.2.deb` | Debian / Ubuntu Package |
| **Linux Portable** | `GitIdentity-Linux-Portable-1.0.2.AppImage` | Universal Linux Portable Binary |

---

Made with ❤️ by [GeekyKalpesh](https://geekykalpesh.com)
