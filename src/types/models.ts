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
