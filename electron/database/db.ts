import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
