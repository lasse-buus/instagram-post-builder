import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('studio', {
  isElectron: true,
  exportSlices: (files: { name: string; data: ArrayBuffer }[], suggested: string) =>
    ipcRenderer.invoke('export-slices', files, suggested) as Promise<string | null>,
  saveProject: (json: string, suggested: string) =>
    ipcRenderer.invoke('save-project', json, suggested) as Promise<string | null>,
  openProject: () => ipcRenderer.invoke('open-project') as Promise<string | null>,
})
