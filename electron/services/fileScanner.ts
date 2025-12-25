import fs from 'fs';
import path from 'path';
import { getDatabase } from '../database/db.js';
import { ModelQueries } from '../database/models.js';

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
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
              walk(filePath);
            } else if (file.toLowerCase().endsWith('.stl')) {
              stlFiles.push(filePath);
            }
          } catch (error) {
            console.error(`Error accessing ${filePath}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
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
      model_name: fileName.replace(/\.stl$/i, ''),
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
