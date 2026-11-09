import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('studio', {
  isElectron: true,
  exportSlices: (files: { name: string; data: ArrayBuffer }[], suggested: string) =>
    ipcRenderer.invoke('export-slices', files, suggested) as Promise<string | null>,
  saveProject: (json: string, suggested: string) =>
    ipcRenderer.invoke('save-project', json, suggested) as Promise<string | null>,
  openProject: () => ipcRenderer.invoke('open-project') as Promise<string | null>,
  libraryList: () => ipcRenderer.invoke('library-list'),
  libraryRead: (id: string) => ipcRenderer.invoke('library-read', id) as Promise<string>,
  libraryWrite: (id: string, json: string) => ipcRenderer.invoke('library-write', id, json) as Promise<void>,
  libraryDelete: (id: string) => ipcRenderer.invoke('library-delete', id) as Promise<void>,
  templateRead: () => ipcRenderer.invoke('template-read') as Promise<string | null>,
  templateWrite: (json: string) => ipcRenderer.invoke('template-write', json) as Promise<void>,
  templateDelete: () => ipcRenderer.invoke('template-delete') as Promise<void>,
})
