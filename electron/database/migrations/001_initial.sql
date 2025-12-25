-- Watched directories table
CREATE TABLE IF NOT EXISTS watched_directories (
  directory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  directory_path TEXT UNIQUE NOT NULL,
  directory_name TEXT NOT NULL,
  date_added TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_scan_date TEXT
);

-- Models table (logical models)
CREATE TABLE IF NOT EXISTS models (
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
CREATE TABLE IF NOT EXISTS model_files (
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
CREATE TABLE IF NOT EXISTS metadata (
  metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  description TEXT,
  custom_fields TEXT,
  FOREIGN KEY (model_id) REFERENCES models(model_id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name TEXT UNIQUE NOT NULL
);

-- Model-Tags junction table
CREATE TABLE IF NOT EXISTS model_tags (
  model_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (model_id, tag_id),
  FOREIGN KEY (model_id) REFERENCES models(model_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_files_model_id ON model_files(model_id);
CREATE INDEX IF NOT EXISTS idx_models_directory_id ON models(directory_id);
CREATE INDEX IF NOT EXISTS idx_metadata_model_id ON metadata(model_id);
