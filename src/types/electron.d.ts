import type { ModelWithFiles, Model, Metadata, Tag } from './models';

export interface ElectronAPI {
  // Directory operations
  selectDirectory: () => Promise<string | null>;
  scanDirectory: (path: string) => Promise<ScanResult>;
  
  // Model operations
  getModels: () => Promise<ModelWithFiles[]>;
  getModel: (modelId: number) => Promise<ModelWithFiles | null>;
  createModel: (data: CreateModelData) => Promise<number>;
  updateModel: (modelId: number, data: Partial<Model>) => Promise<void>;
  deleteModel: (modelId: number) => Promise<void>;
  
  // File operations
  getModelFiles: (modelId: number) => Promise<any[]>;
  readSTLFile: (filePath: string) => Promise<Buffer>;
  showInFolder: (filePath: string) => Promise<void>;
  
  // Metadata operations
  updateMetadata: (modelId: number, metadata: Partial<Metadata>) => Promise<void>;
  addTag: (modelId: number, tagName: string) => Promise<Tag>;
  removeTag: (modelId: number, tagId: number) => Promise<void>;
  getAllTags: () => Promise<Tag[]>;
  
  // Grouping operations
  groupFiles: (fileIds: number[], modelName: string) => Promise<number | null>;
  ungroupModel: (modelId: number) => Promise<void>;
}

export interface ScanResult {
  totalFiles: number;
  newModels: number;
  errors: string[];
}

export interface CreateModelData {
  model_name: string;
  directory_id: number;
  is_multi_part: boolean;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
