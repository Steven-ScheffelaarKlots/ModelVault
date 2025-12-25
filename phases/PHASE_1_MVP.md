# ModelVault - Phase 1 MVP Implementation Plan

## Overview
This document provides detailed implementation guidance for the Minimum Viable Product (MVP) of ModelVault, a desktop application for organizing 3D printing files. Phase 1 focuses on establishing the core architecture and basic functionality.

## Goals
- Set up Electron + React + TypeScript project structure
- Implement basic file scanning and indexing
- Create SQLite database with model/file separation
- Build simple UI to display models
- Implement basic 3D preview with Three.js
- Add basic metadata management
- Enable manual model grouping

## Technology Stack

### Core Technologies
- **Electron**: Desktop application framework
- **React 18+**: UI library
- **TypeScript**: Type-safe development
- **SQLite** (via better-sqlite3): Local database
- **Three.js**: 3D rendering for STL preview
- **Vite**: Build tool (fast development, good Electron support)

### Key Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "electron": "latest",
    "better-sqlite3": "^9.0.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "chokidar": "^3.5.3",
    "electron-store": "^8.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/three": "^0.160.0",
    "@types/better-sqlite3": "^7.6.8",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "electron-builder": "^24.9.0"
  }
}
```

## Project Structure

```
ModelVault/
├── electron/
│   ├── main.ts                 # Electron main process entry
│   ├── preload.ts              # Preload script for IPC bridge
│   ├── database/
│   │   ├── db.ts              # Database initialization & connection
│   │   ├── schema.ts          # Database schema definitions
│   │   ├── models.ts          # Model-related queries
│   │   └── migrations/
│   │       └── 001_initial.sql
│   ├── services/
│   │   ├── fileScanner.ts     # Scan directories for STL files
│   │   └── stlParser.ts       # Parse STL files for metadata
│   ├── ipc/
│   │   ├── handlers.ts        # IPC event handlers
│   │   └── events.ts          # IPC event definitions
│   └── config/
│       └── appPaths.ts        # Get app data directory paths
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── MainLayout.tsx
│   │   ├── Sidebar/
│   │   │   ├── DirectorySelector.tsx
│   │   │   └── ModelList.tsx
│   │   ├── ModelViewer/
│   │   │   ├── STLViewer.tsx      # Three.js STL renderer
│   │   │   └── ViewerControls.tsx
│   │   ├── MetadataPanel/
│   │   │   ├── MetadataEditor.tsx
│   │   │   └── TagInput.tsx
│   │   └── ModelGrouping/
│   │       └── GroupingDialog.tsx
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── useModels.ts
│   │   └── useFileSystem.ts
│   ├── types/
│   │   ├── models.ts           # TypeScript interfaces
│   │   ├── database.ts
│   │   └── ipc.ts
│   ├── store/
│   │   ├── index.ts           # State management setup
│   │   └── slices/
│   │       ├── modelsSlice.ts
│   │       └── uiSlice.ts
│   ├── utils/
│   │   ├── ipc.ts             # IPC helper functions
│   │   └── formatters.ts      # Format file sizes, dates, etc.
│   ├── App.tsx
│   ├── main.tsx               # React entry point
│   └── index.css
├── public/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── electron-builder.json
└── PROJECT_PLAN.md
```

## Database Schema (Phase 1)

### SQLite Schema

```sql
-- Watched directories table
CREATE TABLE watched_directories (
  directory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  directory_path TEXT UNIQUE NOT NULL,
  directory_name TEXT NOT NULL,
  date_added TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_scan_date TEXT
);

-- Models table (logical models)
CREATE TABLE models (
  model_id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT NOT NULL,
  directory_id INTEGER NOT NULL,
  date_added TEXT NOT NULL,
  date_modified TEXT NOT NULL,
  date_last_accessed TEXT,
  is_multi_part INTEGER DEFAULT 0,
  FOREIGN KEY (directory_id) REFERENCES watched_directories(directory_id) ON DELETE CASCADE
);

-- Model files table (individual STL files)
CREATE TABLE model_files (
  file_id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  file_path TEXT UNIQUE NOT NULL,
  relative_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  part_name TEXT,
  part_order INTEGER DEFAULT 0,
  file_size INTEGER NOT NULL,
  date_added TEXT NOT NULL,
  date_modified TEXT NOT NULL,
  dimensions_x REAL,
  dimensions_y REAL,
  dimensions_z REAL,
  FOREIGN KEY (model_id) REFERENCES models(model_id) ON DELETE CASCADE
);

-- Metadata table
CREATE TABLE metadata (
  metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  description TEXT,
  custom_fields TEXT, -- JSON string for flexible metadata
  FOREIGN KEY (model_id) REFERENCES models(model_id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE tags (
  tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name TEXT UNIQUE NOT NULL
);

-- Model-Tags junction table
CREATE TABLE model_tags (
  model_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (model_id, tag_id),
  FOREIGN KEY (model_id) REFERENCES models(model_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_model_files_model_id ON model_files(model_id);
CREATE INDEX idx_models_directory_id ON models(directory_id);
CREATE INDEX idx_metadata_model_id ON metadata(model_id);
```

## TypeScript Interfaces

```typescript
// src/types/models.ts

export interface WatchedDirectory {
  directory_id: number;
  directory_path: string;
  directory_name: string;
  date_added: string;
  is_active: boolean;
  last_scan_date?: string;
}

export interface Model {
  model_id: number;
  model_name: string;
  directory_id: number;
  date_added: string;
  date_modified: string;
  date_last_accessed?: string;
  is_multi_part: boolean;
}

export interface ModelFile {
  file_id: number;
  model_id: number;
  file_path: string;
  relative_path: string;
  file_name: string;
  part_name?: string;
  part_order: number;
  file_size: number;
  date_added: string;
  date_modified: string;
  dimensions_x?: number;
  dimensions_y?: number;
  dimensions_z?: number;
}

export interface Metadata {
  metadata_id: number;
  model_id: number;
  description?: string;
  custom_fields?: Record<string, any>;
}

export interface Tag {
  tag_id: number;
  tag_name: string;
}

export interface ModelWithFiles {
  model: Model;
  files: ModelFile[];
  metadata?: Metadata;
  tags: Tag[];
  directory: WatchedDirectory;
}
```

## Core Features Implementation

### 1. Electron Setup

#### main.ts
```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase } from './database/db';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Initialize database
  await initDatabase();
  
  // Register IPC handlers
  registerIpcHandlers();
  
  // Create window
  await createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

#### preload.ts
```typescript
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
```

### 2. Database Setup

#### database/db.ts
```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'modelvault.db');
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  
  // Open database
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Run migrations
  await runMigrations();
  
  console.log('Database initialized at:', dbPath);
}

async function runMigrations(): Promise<void> {
  const schemaSQL = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_initial.sql'),
    'utf-8'
  );
  
  db!.exec(schemaSQL);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

#### database/models.ts
```typescript
import { getDatabase } from './db';
import type { Model, ModelFile, ModelWithFiles, Metadata, Tag } from '../../src/types/models';

export class ModelQueries {
  static getAllModels(): ModelWithFiles[] {
    const db = getDatabase();
    
    const models = db.prepare(`
      SELECT m.*, wd.directory_path, wd.directory_name
      FROM models m
      JOIN watched_directories wd ON m.directory_id = wd.directory_id
      WHERE wd.is_active = 1
      ORDER BY m.date_modified DESC
    `).all() as (Model & { directory_path: string; directory_name: string })[];
    
    return models.map(model => ({
      model: {
        model_id: model.model_id,
        model_name: model.model_name,
        directory_id: model.directory_id,
        date_added: model.date_added,
        date_modified: model.date_modified,
        date_last_accessed: model.date_last_accessed,
        is_multi_part: Boolean(model.is_multi_part),
      },
      files: this.getModelFiles(model.model_id),
      metadata: this.getMetadata(model.model_id),
      tags: this.getTags(model.model_id),
      directory: {
        directory_id: model.directory_id,
        directory_path: model.directory_path,
        directory_name: model.directory_name,
        date_added: '',
        is_active: true,
      },
    }));
  }
  
  static getModelById(modelId: number): ModelWithFiles | null {
    const db = getDatabase();
    
    const model = db.prepare(`
      SELECT m.*, wd.*
      FROM models m
      JOIN watched_directories wd ON m.directory_id = wd.directory_id
      WHERE m.model_id = ?
    `).get(modelId) as any;
    
    if (!model) return null;
    
    return {
      model: {
        model_id: model.model_id,
        model_name: model.model_name,
        directory_id: model.directory_id,
        date_added: model.date_added,
        date_modified: model.date_modified,
        date_last_accessed: model.date_last_accessed,
        is_multi_part: Boolean(model.is_multi_part),
      },
      files: this.getModelFiles(modelId),
      metadata: this.getMetadata(modelId),
      tags: this.getTags(modelId),
      directory: {
        directory_id: model.directory_id,
        directory_path: model.directory_path,
        directory_name: model.directory_name,
        date_added: model.date_added,
        is_active: Boolean(model.is_active),
        last_scan_date: model.last_scan_date,
      },
    };
  }
  
  static getModelFiles(modelId: number): ModelFile[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM model_files
      WHERE model_id = ?
      ORDER BY part_order ASC, file_name ASC
    `).all(modelId) as ModelFile[];
  }
  
  static getMetadata(modelId: number): Metadata | undefined {
    const db = getDatabase();
    const metadata = db.prepare(`
      SELECT * FROM metadata WHERE model_id = ?
    `).get(modelId) as Metadata | undefined;
    
    if (metadata && metadata.custom_fields) {
      try {
        metadata.custom_fields = JSON.parse(metadata.custom_fields as any);
      } catch (e) {
        metadata.custom_fields = {};
      }
    }
    
    return metadata;
  }
  
  static getTags(modelId: number): Tag[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT t.* FROM tags t
      JOIN model_tags mt ON t.tag_id = mt.tag_id
      WHERE mt.model_id = ?
    `).all(modelId) as Tag[];
  }
  
  static createModel(data: {
    model_name: string;
    directory_id: number;
    is_multi_part: boolean;
  }): number {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO models (model_name, directory_id, date_added, date_modified, is_multi_part)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.model_name, data.directory_id, now, now, data.is_multi_part ? 1 : 0);
    
    // Create empty metadata entry
    db.prepare(`
      INSERT INTO metadata (model_id, description)
      VALUES (?, '')
    `).run(result.lastInsertRowid);
    
    return result.lastInsertRowid as number;
  }
  
  static updateModel(modelId: number, data: Partial<Model>): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.model_name !== undefined) {
      updates.push('model_name = ?');
      values.push(data.model_name);
    }
    
    updates.push('date_modified = ?');
    values.push(now);
    values.push(modelId);
    
    db.prepare(`
      UPDATE models SET ${updates.join(', ')} WHERE model_id = ?
    `).run(...values);
  }
  
  static deleteModel(modelId: number): void {
    const db = getDatabase();
    db.prepare('DELETE FROM models WHERE model_id = ?').run(modelId);
  }
  
  static addFile(data: {
    model_id: number;
    file_path: string;
    relative_path: string;
    file_name: string;
    file_size: number;
    part_name?: string;
    part_order?: number;
  }): number {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO model_files (
        model_id, file_path, relative_path, file_name, 
        file_size, date_added, date_modified, part_name, part_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.model_id,
      data.file_path,
      data.relative_path,
      data.file_name,
      data.file_size,
      now,
      now,
      data.part_name || null,
      data.part_order || 0
    );
    
    return result.lastInsertRowid as number;
  }
}
```

### 3. File Scanner Service

#### services/fileScanner.ts
```typescript
import fs from 'fs';
import path from 'path';
import { getDatabase } from '../database/db';
import { ModelQueries } from '../database/models';

export interface ScanResult {
  totalFiles: number;
  newModels: number;
  errors: string[];
}

export class FileScanner {
  static async scanDirectory(directoryPath: string): Promise<ScanResult> {
    const result: ScanResult = {
      totalFiles: 0,
      newModels: 0,
      errors: [],
    };
    
    try {
      // Add or get directory from database
      const directoryId = this.addOrGetDirectory(directoryPath);
      
      // Find all STL files
      const stlFiles = this.findSTLFiles(directoryPath);
      result.totalFiles = stlFiles.length;
      
      // Process each file
      for (const filePath of stlFiles) {
        try {
          await this.processFile(filePath, directoryPath, directoryId);
          result.newModels++;
        } catch (error) {
          result.errors.push(`Error processing ${filePath}: ${error}`);
        }
      }
      
      // Update last scan date
      this.updateLastScan(directoryId);
      
    } catch (error) {
      result.errors.push(`Error scanning directory: ${error}`);
    }
    
    return result;
  }
  
  private static addOrGetDirectory(directoryPath: string): number {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Check if directory exists
    const existing = db.prepare(
      'SELECT directory_id FROM watched_directories WHERE directory_path = ?'
    ).get(directoryPath) as { directory_id: number } | undefined;
    
    if (existing) {
      return existing.directory_id;
    }
    
    // Add new directory
    const dirName = path.basename(directoryPath);
    const result = db.prepare(`
      INSERT INTO watched_directories (directory_path, directory_name, date_added, is_active)
      VALUES (?, ?, ?, 1)
    `).run(directoryPath, dirName, now);
    
    return result.lastInsertRowid as number;
  }
  
  private static findSTLFiles(directoryPath: string): string[] {
    const stlFiles: string[] = [];
    
    const walk = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walk(filePath);
        } else if (file.toLowerCase().endsWith('.stl')) {
          stlFiles.push(filePath);
        }
      }
    };
    
    walk(directoryPath);
    return stlFiles;
  }
  
  private static async processFile(
    filePath: string,
    baseDirectory: string,
    directoryId: number
  ): Promise<void> {
    const db = getDatabase();
    
    // Check if file already exists
    const existing = db.prepare(
      'SELECT file_id FROM model_files WHERE file_path = ?'
    ).get(filePath);
    
    if (existing) {
      return; // Skip existing files
    }
    
    const fileName = path.basename(filePath);
    const relativePath = path.relative(baseDirectory, filePath);
    const stats = fs.statSync(filePath);
    
    // Create a single-file model for each STL
    const modelId = ModelQueries.createModel({
      model_name: fileName.replace('.stl', ''),
      directory_id: directoryId,
      is_multi_part: false,
    });
    
    // Add the file
    ModelQueries.addFile({
      model_id: modelId,
      file_path: filePath,
      relative_path: relativePath,
      file_name: fileName,
      file_size: stats.size,
    });
  }
  
  private static updateLastScan(directoryId: number): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE watched_directories SET last_scan_date = ? WHERE directory_id = ?
    `).run(now, directoryId);
  }
}
```

### 4. IPC Handlers

#### ipc/handlers.ts
```typescript
import { ipcMain, dialog, shell } from 'electron';
import { FileScanner } from '../services/fileScanner';
import { ModelQueries } from '../database/models';
import fs from 'fs';

export function registerIpcHandlers(): void {
  // Directory selection
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths[0];
  });
  
  // Directory scanning
  ipcMain.handle('scan-directory', async (_, directoryPath: string) => {
    return await FileScanner.scanDirectory(directoryPath);
  });
  
  // Model operations
  ipcMain.handle('get-models', () => {
    return ModelQueries.getAllModels();
  });
  
  ipcMain.handle('get-model', (_, modelId: number) => {
    return ModelQueries.getModelById(modelId);
  });
  
  ipcMain.handle('create-model', (_, data: any) => {
    return ModelQueries.createModel(data);
  });
  
  ipcMain.handle('update-model', (_, modelId: number, data: any) => {
    return ModelQueries.updateModel(modelId, data);
  });
  
  ipcMain.handle('delete-model', (_, modelId: number) => {
    return ModelQueries.deleteModel(modelId);
  });
  
  // File operations
  ipcMain.handle('get-model-files', (_, modelId: number) => {
    return ModelQueries.getModelFiles(modelId);
  });
  
  ipcMain.handle('read-stl-file', async (_, filePath: string) => {
    const buffer = fs.readFileSync(filePath);
    return buffer;
  });
  
  ipcMain.handle('show-in-folder', async (_, filePath: string) => {
    shell.showItemInFolder(filePath);
  });
  
  // Metadata operations
  ipcMain.handle('update-metadata', (_, modelId: number, metadata: any) => {
    const db = require('../database/db').getDatabase();
    
    db.prepare(`
      UPDATE metadata 
      SET description = ?, custom_fields = ?
      WHERE model_id = ?
    `).run(
      metadata.description || '',
      JSON.stringify(metadata.custom_fields || {}),
      modelId
    );
  });
  
  ipcMain.handle('add-tag', (_, modelId: number, tagName: string) => {
    const db = require('../database/db').getDatabase();
    
    // Get or create tag
    let tag = db.prepare('SELECT tag_id FROM tags WHERE tag_name = ?').get(tagName);
    
    if (!tag) {
      const result = db.prepare('INSERT INTO tags (tag_name) VALUES (?)').run(tagName);
      tag = { tag_id: result.lastInsertRowid };
    }
    
    // Link to model
    db.prepare(`
      INSERT OR IGNORE INTO model_tags (model_id, tag_id) VALUES (?, ?)
    `).run(modelId, tag.tag_id);
    
    return tag;
  });
  
  ipcMain.handle('remove-tag', (_, modelId: number, tagId: number) => {
    const db = require('../database/db').getDatabase();
    
    db.prepare(`
      DELETE FROM model_tags WHERE model_id = ? AND tag_id = ?
    `).run(modelId, tagId);
  });
  
  ipcMain.handle('get-all-tags', () => {
    const db = require('../database/db').getDatabase();
    return db.prepare('SELECT * FROM tags ORDER BY tag_name').all();
  });
  
  // Grouping operations
  ipcMain.handle('group-files', (_, fileIds: number[], modelName: string) => {
    const db = require('../database/db').getDatabase();
    
    if (fileIds.length === 0) return null;
    
    // Get first file to determine directory
    const firstFile = db.prepare('SELECT * FROM model_files WHERE file_id = ?').get(fileIds[0]);
    const firstModel = db.prepare('SELECT * FROM models WHERE model_id = ?').get(firstFile.model_id);
    
    // Create new multi-part model
    const newModelId = ModelQueries.createModel({
      model_name: modelName,
      directory_id: firstModel.directory_id,
      is_multi_part: true,
    });
    
    // Move all files to new model
    const stmt = db.prepare('UPDATE model_files SET model_id = ? WHERE file_id = ?');
    for (const fileId of fileIds) {
      stmt.run(newModelId, fileId);
    }
    
    // Delete old single-file models that are now empty
    db.prepare(`
      DELETE FROM models 
      WHERE model_id IN (
        SELECT m.model_id FROM models m
        LEFT JOIN model_files mf ON m.model_id = mf.model_id
        WHERE mf.file_id IS NULL
      )
    `).run();
    
    return newModelId;
  });
  
  ipcMain.handle('ungroup-model', (_, modelId: number) => {
    const db = require('../database/db').getDatabase();
    
    // Get all files in this model
    const files = ModelQueries.getModelFiles(modelId);
    const model = db.prepare('SELECT * FROM models WHERE model_id = ?').get(modelId);
    
    // Create individual models for each file
    for (const file of files) {
      const newModelId = ModelQueries.createModel({
        model_name: file.file_name.replace('.stl', ''),
        directory_id: model.directory_id,
        is_multi_part: false,
      });
      
      db.prepare('UPDATE model_files SET model_id = ? WHERE file_id = ?')
        .run(newModelId, file.file_id);
    }
    
    // Delete the multi-part model
    ModelQueries.deleteModel(modelId);
  });
}
```

### 5. React Application

#### App.tsx
```typescript
import React, { useState, useEffect } from 'react';
import MainLayout from './components/Layout/MainLayout';
import DirectorySelector from './components/Sidebar/DirectorySelector';
import ModelList from './components/Sidebar/ModelList';
import STLViewer from './components/ModelViewer/STLViewer';
import MetadataEditor from './components/MetadataPanel/MetadataEditor';
import type { ModelWithFiles } from './types/models';
import './App.css';

function App() {
  const [models, setModels] = useState<ModelWithFiles[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelWithFiles | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const result = await window.electron.getModels();
      setModels(result);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanDirectory = async () => {
    const directory = await window.electron.selectDirectory();
    if (!directory) return;

    setLoading(true);
    try {
      await window.electron.scanDirectory(directory);
      await loadModels();
    } catch (error) {
      console.error('Error scanning directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (modelId: number) => {
    const model = await window.electron.getModel(modelId);
    setSelectedModel(model);
  };

  const handleUpdateMetadata = async (modelId: number, metadata: any) => {
    await window.electron.updateMetadata(modelId, metadata);
    await loadModels();
    if (selectedModel?.model.model_id === modelId) {
      const updated = await window.electron.getModel(modelId);
      setSelectedModel(updated);
    }
  };

  return (
    <MainLayout>
      <div className="app-container">
        <aside className="sidebar">
          <DirectorySelector onScan={handleScanDirectory} loading={loading} />
          <ModelList
            models={models}
            selectedModelId={selectedModel?.model.model_id}
            onSelectModel={handleSelectModel}
          />
        </aside>
        
        <main className="main-content">
          {selectedModel ? (
            <>
              <div className="viewer-section">
                <STLViewer model={selectedModel} />
              </div>
              <div className="metadata-section">
                <MetadataEditor
                  model={selectedModel}
                  onUpdate={(metadata) => 
                    handleUpdateMetadata(selectedModel.model.model_id, metadata)
                  }
                />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No Model Selected</h2>
              <p>Select a model from the sidebar or scan a directory to get started.</p>
            </div>
          )}
        </main>
      </div>
    </MainLayout>
  );
}

export default App;
```

#### components/ModelViewer/STLViewer.tsx
```typescript
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';
import type { ModelWithFiles } from '../../types/models';

interface STLViewerProps {
  model: ModelWithFiles;
}

function STLModel({ filePath }: { filePath: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const loadSTL = async () => {
      try {
        const buffer = await window.electron.readSTLFile(filePath);
        const loader = new STLLoader();
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
        const geom = loader.parse(arrayBuffer);
        geom.center();
        
        if (mounted) {
          setGeometry(geom);
        }
      } catch (error) {
        console.error('Error loading STL:', error);
      }
    };
    
    loadSTL();
    
    return () => {
      mounted = false;
    };
  }, [filePath]);
  
  if (!geometry) return null;
  
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#60a5fa" />
    </mesh>
  );
}

export default function STLViewer({ model }: STLViewerProps) {
  if (model.files.length === 0) {
    return <div>No files to display</div>;
  }
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [100, 100, 100], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        {model.files.map((file) => (
          <STLModel key={file.file_id} filePath={file.file_path} />
        ))}
        
        <Grid infiniteGrid fadeDistance={300} fadeStrength={5} />
        <OrbitControls makeDefault />
      </Canvas>
      
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', borderRadius: '5px' }}>
        <strong>{model.model.model_name}</strong>
        {model.model.is_multi_part && (
          <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
            Parts: {model.files.length}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Phase 1 Checklist

### Setup & Configuration
- [ ] Initialize project with Vite + Electron + React + TypeScript
- [ ] Configure electron-builder for packaging
- [ ] Set up TypeScript configurations
- [ ] Install all dependencies

### Database Layer
- [ ] Create SQLite schema (migration file)
- [ ] Implement database initialization
- [ ] Create model queries (CRUD operations)
- [ ] Add indexes for performance
- [ ] Test database operations

### Electron Main Process
- [ ] Set up main.ts with window creation
- [ ] Create preload.ts with IPC bridge
- [ ] Implement file scanner service
- [ ] Register all IPC handlers
- [ ] Add app data directory configuration

### React UI
- [ ] Create main layout structure
- [ ] Build directory selector component
- [ ] Build model list component
- [ ] Implement STL viewer with Three.js
- [ ] Create metadata editor
- [ ] Add basic styling

### Core Features
- [ ] Directory selection dialog
- [ ] Scan directory for STL files
- [ ] Create models from scanned files
- [ ] Display models in list
- [ ] Select and view model in 3D
- [ ] Edit model name
- [ ] Add/edit description
- [ ] Add/remove tags
- [ ] "Show in Folder" button

### Manual Grouping
- [ ] UI to select multiple files
- [ ] Group files into multi-part model
- [ ] Ungroup multi-part model
- [ ] Display parts in grouped models

### Testing & Polish
- [ ] Test with small directory (~10 files)
- [ ] Test with larger directory (~100 files)
- [ ] Test multi-part grouping
- [ ] Handle errors gracefully
- [ ] Add loading states
- [ ] Test on target platforms (Windows/Mac/Linux)

## Success Criteria

Phase 1 is complete when:
1. ✅ User can select a directory containing STL files
2. ✅ Application scans and imports all STL files into database
3. ✅ Models are displayed in a list with basic info
4. ✅ User can select a model to view in 3D
5. ✅ 3D viewer displays STL files using Three.js
6. ✅ User can edit model name, description, and tags
7. ✅ User can manually group multiple files into one model
8. ✅ User can ungroup a multi-part model
9. ✅ "Show in Folder" opens file explorer to file location
10. ✅ All data persists in SQLite database

## Known Limitations (Phase 1)

- No automatic model grouping (pattern detection)
- No thumbnail generation
- No file watching for changes
- Single directory only
- No advanced search/filtering
- No collections/virtual folders
- No sliced file management
- No split panes or multi-tab interface
- Basic styling only

These will be addressed in Phase 2 and beyond.

## Next Steps After Phase 1

Once Phase 1 is complete and tested:
1. Review and refactor code
2. Document any architectural decisions
3. Create Phase 2 implementation plan
4. Begin work on auto-grouping and thumbnails
