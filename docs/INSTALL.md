# Installation Guide

Current release strategy:
- **Windows/Linux:** prebuilt artifacts are published on GitHub Releases.
- **macOS:** local/manual build only (not attached to tag releases).

## Build from source (all platforms)

```bash
git clone https://github.com/ntsagar9/time-promodo.git
cd time-promodo
pnpm install
pnpm icons
pnpm dev
```

## macOS (optional local package)

```bash
pnpm dist
```

If you open an unsigned local `.app`, Gatekeeper may block it. For local testing only:

```bash
xattr -cr /Applications/TimerPromodo.app
```

## Windows

1. Download `TimerPromodo-Setup-*.exe` from the latest GitHub release.
2. Run installer and follow setup.

## Linux

1. Download `TimerPromodo-*.AppImage` from the latest GitHub release.
2. Make it executable and run:
   ```bash
   chmod +x TimerPromodo-*.AppImage
   ./TimerPromodo-*.AppImage
   ```

## Auto-updates

Auto-update requires published prebuilt release artifacts plus platform signing/notarization setup. Windows/Linux can use release artifacts; macOS local builds should be updated manually.

## Uninstall

- **macOS**: Drag the app from `Applications` to the Trash.
- **Windows**: Settings → Apps → Installed apps → TimerPromodo → Uninstall.
- **Linux (deb)**: `sudo dpkg -r timerpromodo`
