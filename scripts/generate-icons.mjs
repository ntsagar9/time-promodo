import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import sharp from 'sharp'
import toIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const assets = join(root, 'assets')

async function main() {
  const existing = [
    join(assets, 'icon.png'),
    join(assets, 'icon.ico'),
    join(assets, 'tray', 'trayIcon.png'),
    join(assets, 'tray', 'trayIconActive.png')
  ]
  if (existing.every((p) => existsSync(p))) {
    console.log('Using existing app icons in assets/ (skip placeholder generation)')
    return
  }

  await mkdir(join(assets, 'tray'), { recursive: true })
  const base = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 220, g: 70, b: 70, alpha: 1 }
    }
  })
    .png()
    .toBuffer()

  const gray = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 120, g: 130, b: 150, alpha: 1 }
    }
  })
    .png()
    .toBuffer()

  await writeFile(join(assets, 'icon.png'), base)
  await writeFile(join(assets, 'tray', 'trayIconActive.png'), base)
  await writeFile(join(assets, 'tray', 'trayIcon.png'), gray)

  const ico = await toIco([await sharp(base).resize(256, 256).png().toBuffer()])
  await writeFile(join(assets, 'icon.ico'), ico)

  console.log('Generated placeholder icons under assets/')
}

await main().catch((err) => {
  console.warn('Icon generation skipped:', err)
})
