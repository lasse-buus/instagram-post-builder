import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from 'electron'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type PostSummary, summarize } from '../src/types'

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

// People library: one JSON file per post. In development it lives in the project folder (people/,
// git-ignored); the packaged app can't write inside its bundle, so it uses the user data folder.
const libraryDir = () => (app.isPackaged ? path.join(app.getPath('userData'), 'people') : path.join(app.getAppPath(), 'people'))

/** Post ids come from the renderer — only allow plain names so they can't escape the library folder. */
function postFile(id: string) {
  if (!/^[\w-]{1,64}$/.test(id)) throw new Error(`Invalid post id: ${id}`)
  return path.join(libraryDir(), `${id}.json`)
}

const thumb = (src?: string) => {
  if (!src) return undefined
  const img = nativeImage.createFromDataURL(src)
  return img.isEmpty() ? undefined : `data:image/jpeg;base64,${img.resize({ width: 320 }).toJPEG(80).toString('base64')}`
}

ipcMain.handle('library-list', async (): Promise<PostSummary[]> => {
  await mkdir(libraryDir(), { recursive: true })
  const out: PostSummary[] = []
  for (const name of await readdir(libraryDir())) {
    if (!name.endsWith('.json')) continue
    try {
      const s = summarize(JSON.parse(await readFile(path.join(libraryDir(), name), 'utf8')))
      out.push({ ...s, then: thumb(s.then), now: thumb(s.now) })
    } catch (e) {
      console.warn(`Skipping unreadable post ${name}:`, e)
    }
  }
  return out
})

ipcMain.handle('library-read', (_e, id: string) => readFile(postFile(id), 'utf8'))

// Write to a temp file and rename, so a crash mid-autosave never leaves a half-written post.
ipcMain.handle('library-write', async (_e, id: string, json: string) => {
  const file = postFile(id)
  await mkdir(libraryDir(), { recursive: true })
  await writeFile(`${file}.tmp`, json, 'utf8')
  await rename(`${file}.tmp`, file)
})

// Deleting moves the file to the Trash so it can be recovered.
ipcMain.handle('library-delete', (_e, id: string) => shell.trashItem(postFile(id)))

// Single-file documents kept beside people/: the person template (layout only, no photos) and the
// account profile (may hold an uploaded photo, so account.json is git-ignored).
const DOCS = ['person-template', 'account'] as const
function docFile(name: string) {
  if (!(DOCS as readonly string[]).includes(name)) throw new Error(`Unknown document: ${name}`)
  return path.join(path.dirname(libraryDir()), `${name}.json`)
}

ipcMain.handle('doc-read', async (_e, name: string) => {
  try {
    return await readFile(docFile(name), 'utf8')
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw e
  }
})

ipcMain.handle('doc-write', async (_e, name: string, json: string) => {
  const file = docFile(name)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(`${file}.tmp`, json, 'utf8')
  await rename(`${file}.tmp`, file)
})

ipcMain.handle('doc-delete', (_e, name: string) => rm(docFile(name), { force: true }))

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
