# 🍅 TimerPromodo

> A beautiful, production-grade Pomodoro timer for macOS, Windows and Linux.  
> Built with Electron, React, TypeScript and a lot of ☕.
> If you find it useful — [⭐ star the repo](https://github.com/ntsagar9/time-promodo) or [☕ buy me a coffee](https://buymeacoffee.com/ntsagar)!

<p align="center">
  <!-- Replace with real screenshots after UI polish -->
  <img src="docs/screenshots/dark-timer.png" width="380" alt="TimerPromodo dark theme" />
  <img src="docs/screenshots/light-analytics.png" width="380" alt="Analytics panel" />
</p>

<p align="center">
  <a href="https://github.com/ntsagar9/time-promodo/releases/latest">
    <img src="https://img.shields.io/github/v/release/ntsagar9/time-promodo?style=flat-square&color=E54B4B" alt="Latest Release" />
  </a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=flat-square" alt="Platforms" />
  <img src="https://img.shields.io/badge/built%20with-Electron-47848F?style=flat-square&logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/github/license/ntsagar9/time-promodo?style=flat-square" alt="License" />
  <a href="https://buymeacoffee.com/ntsagar" target="_blank">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support%20the%20project-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
  </a>
</p>

---

## ✨ Features

- 🍅 **Classic Pomodoro cycles** — Work → Short Break → Long Break, fully configurable
- ⚙️ **Presets** — 6 built-in presets + unlimited custom presets
- 🖥️ **Background running** — timer keeps ticking when the window is hidden or minimised
- 🔔 **Native OS notifications** — no browser permission prompts
- 📊 **Analytics** — daily/weekly charts, streak calendar, focus score
- ✅ **Task panel** — link tasks to sessions, track estimated vs actual pomodoros
- 🎨 **Themes** — System / Dark / Light / AMOLED + 6 accent colours
- 🔄 **Auto-update** — silent background updates via GitHub Releases
- 💥 **Crash reporting** — local log files, crash dump detection on relaunch
- 🖱️ **System tray** — live countdown in tooltip, start/pause without opening window
- 🪄 **Mini timer window** — floating always-on-top compact view
- ⌨️ **Global shortcuts** — control timer without focusing the app
- 🌐 **Fullscreen overlay** — optional end-of-session takeover screen

## 🍅 Pomodoro Defaults

TimerPromodo supports custom durations, so you may see values like **35:00**, **45:00**, or **55:00** depending on the selected preset.

If you want the classic Pomodoro rhythm, use:
- **Work:** 25 minutes
- **Short break:** 5 minutes
- **Long break:** 15–30 minutes after 4 sessions

## 📥 Download

| Platform | Installer |
|----------|-----------|
| macOS (Apple Silicon + Intel) | [Download .dmg](https://github.com/ntsagar9/time-promodo/releases/latest) |
| Windows (x64) | [Download .exe](https://github.com/ntsagar9/time-promodo/releases/latest) |
| Linux | [Download .AppImage](https://github.com/ntsagar9/time-promodo/releases/latest) |

> Auto-updates are built in — you only need to download once.

## 🚀 Development Setup

### Prerequisites

- Node.js 24+
- pnpm 10+

```bash
# 1. Clone
git clone https://github.com/ntsagar9/time-promodo.git
cd time-promodo

# 2. Install dependencies
pnpm install

# 3. Generate app icons
pnpm icons

# 4. Start in development mode
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Electron in dev mode with HMR |
| `pnpm typecheck` | Run TypeScript strict check |
| `pnpm lint` | Run ESLint |
| `pnpm build:app` | Build production app (`out/`) |
| `pnpm dist` | Build + package installers for the current platform |

### App Icons (All Platforms)

TimerPromodo includes platform-specific icons in `assets/`:

- `assets/icon.icns` for macOS app/dock icon
- `assets/icon.ico` for Windows executable/taskbar icon
- `assets/linux/icons` for Linux desktop/app launcher icons
- `assets/tray/*` for tray/status icons

`electron-builder.yml` is configured to use these files directly for release builds.

## 🏗️ Architecture

```
electron/main/      → Main process: timer engine, IPC, tray, notifications, updater
electron/preload/   → Secure contextBridge (no nodeIntegration)
src/                → Renderer: React UI, Zustand stores, hooks
```

The timer runs exclusively in the main process via `setInterval` so it never throttles when the window is hidden (Chromium throttles timers in background tabs). All renderer↔main communication uses typed IPC channels defined in `src/types/ipc.ts`.

## 🤝 Contributing

This project is maintained by **Sagar NT**. Contributions are welcome via **Pull Requests only**. Please:

1. Fork this repository (do not push directly to `main`)
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes with clear, atomic commits
4. Ensure `pnpm typecheck` and `pnpm lint` pass with zero errors
5. Open a Pull Request against `main` with a clear description of what changed and why
6. Wait for review — all PRs require approval before merge

Please do **not**:

- Push directly to `main` or `develop`
- Open PRs for typo-only changes without context
- Add new dependencies without discussing in an Issue first

Bug reports & feature requests: [open an Issue](https://github.com/ntsagar9/time-promodo/issues).

## 👤 About the Developer

Hi! I'm **Sagar NT**, a software engineer building thoughtful desktop tools.

- 🐙 GitHub: [@ntsagar9](https://github.com/ntsagar9)
- 💼 This repo: [time-promodo](https://github.com/ntsagar9/time-promodo)

_Add your portfolio site and LinkedIn when you publish._

## ☕ Support This Project

TimerPromodo is free and open source. If it saves you time or helps you focus, consider buying me a coffee — it helps me keep improving it!

<a href="https://buymeacoffee.com/ntsagar" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="160" />
</a>

You can also support via:
- ⭐ **Star this repo** — it helps more people find the project
- 🐛 **Report bugs** — [open an issue](https://github.com/ntsagar9/time-promodo/issues)
- 🔀 **Contribute** — see [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT © Sagar NT

Built with ❤️ as a portfolio project. If you find it useful, leave a ⭐!

## 🚢 Release & Deployment

Releases are published via the **Release** GitHub Actions workflow (manual trigger):

1. Create and push a tag (example `v1.0.0`):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. Open **Actions → Release → Run workflow**
3. Enter the same tag in the `tag` input (example: `v1.0.0`)

The workflow builds cross-platform artifacts (macOS `.dmg`, Windows `.exe`, Linux `.AppImage`) and uploads them to that GitHub Release.
Before tagging, ensure PR checks pass (`pnpm lint`, `pnpm typecheck`, `pnpm build:app`) on the GitHub Actions matrix.

## Building for distribution (macOS)

For public releases outside the App Store you need an **Apple Developer** identity, **code signing**, and **notarization**. Local ad-hoc testing may require `xattr -cr /Applications/TimerPromodo.app` after copy. See `docs/INSTALL.md` for end-user install steps.
