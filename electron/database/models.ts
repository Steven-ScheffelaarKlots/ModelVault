import { getDatabase } from './db.js';
import type { Model, ModelFile, ModelWithFiles, Metadata, Tag } from '../../src/types/models';

export class ModelQueries {
  static getAllModels(): ModelWithFiles[] {
    const db = getDatabase();
    
    const models = db.prepare(`
      SELECT m.*, wd.directory_path, wd.directory_name, wd.date_added as dir_date_added, wd.is_active, wd.last_scan_date
      FROM models m
      JOIN watched_directories wd ON m.directory_id = wd.directory_id
      WHERE wd.is_active = 1
      ORDER BY m.date_modified DESC
    `).all() as any[];
    
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
        date_added: model.dir_date_added,
        is_active: Boolean(model.is_active),
        last_scan_date: model.last_scan_date,
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
    `).get(modelId) as any;
    
    if (!metadata) return undefined;
    
    if (metadata.custom_fields) {
      try {
        metadata.custom_fields = JSON.parse(metadata.custom_fields);
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
    
    if (updates.length > 1) {
      db.prepare(`
        UPDATE models SET ${updates.join(', ')} WHERE model_id = ?
      `).run(...values);
    }
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
