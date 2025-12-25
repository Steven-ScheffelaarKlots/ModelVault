import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Directory operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
  
  // Model operations
  getModels: () => ipcRenderer.invoke('get-models'),
  getModel: (modelId: number) => ipcRenderer.invoke('get-model', modelId),
  createModel: (data: any) => ipcRenderer.invoke('create-model', data),
  updateModel: (modelId: number, data: any) => ipcRenderer.invoke('update-model', modelId, data),
  deleteModel: (modelId: number) => ipcRenderer.invoke('delete-model', modelId),
  
  // File operations
  getModelFiles: (modelId: number) => ipcRenderer.invoke('get-model-files', modelId),
  readSTLFile: (filePath: string) => ipcRenderer.invoke('read-stl-file', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  
  // Metadata operations
  updateMetadata: (modelId: number, metadata: any) => ipcRenderer.invoke('update-metadata', modelId, metadata),
  addTag: (modelId: number, tagName: string) => ipcRenderer.invoke('add-tag', modelId, tagName),
  removeTag: (modelId: number, tagId: number) => ipcRenderer.invoke('remove-tag', modelId, tagId),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  
  // Grouping operations
  groupFiles: (fileIds: number[], modelName: string) => ipcRenderer.invoke('group-files', fileIds, modelName),
  ungroupModel: (modelId: number) => ipcRenderer.invoke('ungroup-model', modelId),
});
