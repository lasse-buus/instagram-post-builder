import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f4f4f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
      contextIsolation: true,
    },
  })
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL)
  else win.loadFile(path.join(__dirname, '../dist/index.html'))
}

// Export: pick a folder, write each slice as PNG
ipcMain.handle('export-slices', async (_e, files: { name: string; data: ArrayBuffer }[], suggested: string) => {
  const res = await dialog.showOpenDialog({
    title: 'Choose export folder',
    properties: ['openDirectory', 'createDirectory'],
  })
  if (res.canceled || !res.filePaths[0]) return null
  const dir = path.join(res.filePaths[0], suggested)
  await mkdir(dir, { recursive: true })
  for (const f of files) await writeFile(path.join(dir, f.name), Buffer.from(f.data))
  return dir
})

ipcMain.handle('save-project', async (_e, json: string, suggested: string) => {
  const res = await dialog.showSaveDialog({
    title: 'Save post',
    defaultPath: `${suggested}.carousel.json`,
    filters: [{ name: 'Carousel post', extensions: ['json'] }],
  })
  if (res.canceled || !res.filePath) return null
  await writeFile(res.filePath, json, 'utf8')
  return res.filePath
})

ipcMain.handle('open-project', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Open post',
    properties: ['openFile'],
    filters: [{ name: 'Carousel post', extensions: ['json'] }],
  })
  if (res.canceled || !res.filePaths[0]) return null
  return readFile(res.filePaths[0], 'utf8')
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
