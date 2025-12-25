import { ipcMain, dialog, shell } from 'electron';
import { FileScanner } from '../services/fileScanner.js';
import { ModelQueries } from '../database/models.js';
import { getDatabase } from '../database/db.js';
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
    const db = getDatabase();
    
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
    const db = getDatabase();
    
    // Get or create tag
    let tag = db.prepare('SELECT tag_id FROM tags WHERE tag_name = ?').get(tagName) as { tag_id: number } | undefined;
    
    if (!tag) {
      const result = db.prepare('INSERT INTO tags (tag_name) VALUES (?)').run(tagName);
      tag = { tag_id: result.lastInsertRowid as number };
    }
    
    // Link to model
    try {
      db.prepare(`
        INSERT INTO model_tags (model_id, tag_id) VALUES (?, ?)
      `).run(modelId, tag.tag_id);
    } catch (error) {
      // Ignore duplicate key errors
    }
    
    return tag;
  });
  
  ipcMain.handle('remove-tag', (_, modelId: number, tagId: number) => {
    const db = getDatabase();
    
    db.prepare(`
      DELETE FROM model_tags WHERE model_id = ? AND tag_id = ?
    `).run(modelId, tagId);
  });
  
  ipcMain.handle('get-all-tags', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM tags ORDER BY tag_name').all();
  });
  
  // Grouping operations
  ipcMain.handle('group-files', (_, fileIds: number[], modelName: string) => {
    const db = getDatabase();
    
    if (fileIds.length === 0) return null;
    
    // Get first file to determine directory
    const firstFile = db.prepare('SELECT * FROM model_files WHERE file_id = ?').get(fileIds[0]) as any;
    const firstModel = db.prepare('SELECT * FROM models WHERE model_id = ?').get(firstFile.model_id) as any;
    
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
    const db = getDatabase();
    
    // Get all files in this model
    const files = ModelQueries.getModelFiles(modelId);
    const model = db.prepare('SELECT * FROM models WHERE model_id = ?').get(modelId) as any;
    
    // Create individual models for each file
    for (const file of files) {
      const newModelId = ModelQueries.createModel({
        model_name: file.file_name.replace(/\.stl$/i, ''),
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
