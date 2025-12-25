# ModelVault - 3D Printing File Organizer

## Project Overview

A desktop application for organizing, cataloging, and managing 3D printing files (STL models) with metadata support and preview generation.

## Use Cases

- Browse and organize large collections of STL files across multiple storage locations
- Manage multi-part models (large prints split into pieces, articulated figures with separate parts)
- Track sliced files (gcode) and their settings alongside original STL files
- Quickly open file location in explorer to drag into slicer software
- Compare different slice settings for the same model
- Link multi-file slices to specific parts (e.g., "printed all parts together on plate")
- Compare different versions of a model side-by-side
- Add detailed metadata and tags to complete models (not individual files)
- Generate previews without opening slicer software
- View assembled preview of multi-part models before printing
- Identify duplicate files across different directories
- Work on multiple models simultaneously with tabbed interface
- Share models with metadata intact using sidecar files
- Track which parts of a model have been printed and which sliced files were used

## Key Concepts

### Models vs Files
- **Model**: A logical 3D print project (e.g., "Dragon Statue", "Chess Set")
- **File**: An individual STL file that is part of a model
- **Single-File Model**: Most common - one model = one STL file
- **Multi-File Model**: One model with multiple STL parts (e.g., "Dragon Statue" might have "body.stl", "wings.stl", "head.stl")
- **Metadata**: Always attached to the model level, not individual files
- **Parts**: Individual files within a multi-file model can have part-specific notes

## Core Features

### 1. File Management
- **Multi-Directory Support**: Add and manage multiple watched directories (different drives, network shares)
- **Directory Watching**: Real-time monitoring of all watched directories
- **File Discovery**: Recursively scan and index STL files across all directories
- **System Integration**:
  - "Show in Folder" button - opens file explorer to STL location
  - "Open With" - quick access to slicer software
  - Drag-and-drop to external applications
- **Smart Model Grouping**:
  - Auto-detect related files (same folder, similar names, naming patterns)
  - Manual grouping: combine multiple STL files into one logical model
  - Split models: separate files that were incorrectly grouped
  - Part naming and ordering within a model
- **File Organization**: 
  - Virtual collections (files stay in place)
  - Physical file moving/reorganization with metadata preservation
  - Both can be used together
- **Duplicate Detection**: Identify identical files across directories (hash-based)
- **Import/Export**: Support for moving files while maintaining metadata

### 2. Metadata Management
- **Model-Level Metadata** (applies to all parts of a multi-file model):
  - Model name
  - Description
  - Tags/categories
  - Date added/modified
  - Total size (sum of all parts)
  - Print settings (layer height, infill, support needed)
  - Assembly instructions or notes
- **Part-Level Information**:
  - Individual file names and dimensions
  - Part-specific notes (e.g., "print at 0.1mm")
  - Print order/priority
- **Custom Fields**: Allow users to define custom metadata fields
- **Batch Operations**: Edit metadata for multiple models at once

### 3. Preview Generation
- **STL Rendering**: Use Three.js to render 3D previews
- **Multi-Part Model Preview**:
  - View all parts together (assembled view)
  - View individual parts
  - Toggle part visibility
  - Color-code different parts
- **Thumbnail Generation**: Create and cache thumbnail images
- **Storage Options**: 
  - Centralized cache (in app data directory)
  - Local storage (next to model files, in `.modelvault/` subfolder or as sidecar)
  - Per-directory configuration
- **Interactive Preview**: Rotate, zoom, pan in 3D view
- **Multiple Views**: Front, side, top views
- **Measurements**: Display model dimensions (individual parts and combined)

### 4. Search & Filter
- Search by name, tags, metadata (across all directories)
- Filter by size, date, custom fields, source directory
- Save search queries/filters
- Duplicate file filtering

### 5. Sliced File Management
- **Gcode/Sliced File Tracking**:
  - Associate sliced files (.gcode, .3mf, .bgcode, etc.) with models
  - Auto-scan for sliced files (same folder or separate output directory)
  - Manual linking of sliced files to models
  - Multi-file slicing: link gcode to specific parts when multiple STLs are sliced together
- **Slicer Settings Extraction**:
  - Parse gcode comments to extract slicer settings
  - Display print time, filament usage, layer height, infill, etc.
  - Extract embedded thumbnails from gcode (PrusaSlicer, OrcaSlicer)
- **Slice Versions**:
  - Track multiple sliced versions of same model (different settings)
  - Compare settings between versions
  - Notes for each sliced version
- **Quick Actions**:
  - "Send to Printer" (if printer integration added later)
  - "Show in Folder" for sliced file
  - "Open in Slicer" to modify settings

### 6. Multi-Tab Interface & Workspace Management
- **Tab System**: Open multiple models in separate tabs
  - Tab bar with model names
  - Tab close buttons
  - Tab reordering (drag and drop)
  - Keyboard shortcuts (Ctrl+Tab, Ctrl+W, Ctrl+T)
  - Recent tabs history
  - Restore tabs on app restart
- **Split Pane System**: VSCode-style layout
  - Split editor horizontally or vertically
  - Compare two models side-by-side
  - Independent metadata editing per pane
  - Synchronized rotation option (for comparing models)
  - Drag tabs between panes
  - Resize panes
  - Up to 4 panes (2x2 grid)
- **Workspace Layouts**:
  - Save/restore pane configurations
  - Quick layouts (single, side-by-side, quad view)
  - Per-project workspace settings

## Technology Stack

### Frontend
- **Framework**: Electron (for desktop app)
- **UI Library**: React with TypeScript
- **3D Rendering**: Three.js (for STL preview)
- **State Management**: Consider Redux Toolkit or Zustand
- **UI Components**: Consider Material-UI, Ant Design, or Shadcn/ui
- **Layout Management**: react-mosaic or react-grid-layout for split panes (or custom implementation)

### Backend/Data Layer
- **Electron Main Process**: Handle file system operations, IPC communication

### Database Considerations

#### Option 1: Embedded Database (Recommended for Desktop App)
**SQLite** (via better-sqlite3 or sql.js)
- ✅ Pros:
  - No external dependencies
  - Single file storage
  - Fast for local queries
  - ACID compliant
  - Structured data with relationships
  - Good for complex queries
- ❌ Cons:
  - Requires schema migrations
  - Less flexible for varying metadata

#### Option 2: PostgreSQL
- ✅ Pros:
  - Powerful query capabilities
  - Great for complex relationships
  - JSON support for flexible metadata
- ❌ Cons:
  - Requires separate installation/setup
  - Overkill for single-user desktop app
  - Users need to manage database service

#### Option 3: MongoDB
- ✅ Pros:
  - Flexible schema (good for custom metadata)
  - Easy to store varying structures
- ❌ Cons:
  - Requires separate installation
  - Heavier resource usage
  - Complex relationships harder to manage

#### Option 4: JSON File Storage
- ✅ Pros:
  - No dependencies
  - Simple to implement
  - Easy debugging
- ❌ Cons:
  - Slow for large datasets
  - No query optimization
  - Concurrent access issues
  - Not scalable

#### Recommendation
**Use SQLite** - Best balance for a desktop app:
- Self-contained (ships with your app)
- No user setup required
- Fast and reliable
- Can use JSON columns for flexible custom metadata
- Easy backup (single file)

### Additional Libraries to Consider
- **electron-store**: For app settings/preferences, workspace layouts, open tabs state
- **chokidar**: For file system watching
- **sharp**: For image processing/thumbnail generation
- **STL parser**: three-stdlib or custom STL loader
- **react-three-fiber**: React renderer for Three.js (optional, cleaner React integration)
- **Gcode parser**: Custom or gcode-parser library for extracting settings
- **Electron shell.openPath**: Built-in API for "Show in Folder" functionality

## Data Model (SQLite Schema)

### Tables

#### `watched_directories`
```sql
directory_id (PRIMARY KEY)
directory_path (UNIQUE, NOT NULL)
directory_name
date_added
is_active (BOOLEAN)
thumbnail_storage_mode (ENUM: 'centralized', 'local')
last_scan_date
```

#### `models`
```sql
model_id (PRIMARY KEY)
model_name (user-defined or auto-generated from files)
directory_id (FOREIGN KEY - primary location)
date_added
date_modified
date_last_accessed
thumbnail_path (preview of assembled model or first part)
is_multi_part (BOOLEAN)
has_sidecar_file (BOOLEAN)
```

#### `model_files`
```sql
file_id (PRIMARY KEY)
model_id (FOREIGN KEY)
file_path (UNIQUE, NOT NULL)
relative_path (path relative to watched directory)
file_name
part_name (optional, e.g., "left_arm", "base", "part_1")
part_order (for sorting parts)
file_size
file_hash (for duplicate detection)
date_added
date_modified
dimensions_x
dimensions_y
dimensions_z
thumbnail_path (preview of individual part)
```

#### `sliced_files`
```sql
sliced_file_id (PRIMARY KEY)
file_path (UNIQUE, NOT NULL)
file_name
file_size
slicer_name (e.g., 'PrusaSlicer', 'Cura', 'Simplify3D')
slicer_version
date_created
date_modified
estimated_print_time
filament_usage
filament_type
layer_height
infill_percentage
supports_enabled (BOOLEAN)
thumbnail_path (extracted from gcode if available)
gcode_settings (JSON - full settings)
```

#### `model_sliced_files`
```sql
model_id (FOREIGN KEY)
sliced_file_id (FOREIGN KEY)
file_ids (JSON array - which specific STL files are in this slice)
notes
```

#### `metadata`
```sql
metadata_id (PRIMARY KEY)
model_id (FOREIGN KEY)
name
description
tags (JSON or separate table)
print_settings (JSON)
custom_fields (JSON)
```

#### `collections`
```sql
collection_id (PRIMARY KEY)
collection_name
parent_collection_id (for nested collections)
created_date
```

#### `model_collections`
```sql
model_id (FOREIGN KEY)
collection_id (FOREIGN KEY)
```

#### `tags`
```sql
tag_id (PRIMARY KEY)
tag_name (UNIQUE)
```

#### `model_tags`
```sql
model_id (FOREIGN KEY)
tag_id (FOREIGN KEY)
```

#### `duplicate_groups`
```sql
group_id (PRIMARY KEY)
file_hash
date_detected
user_reviewed (BOOLEAN)
```

#### `duplicate_files`
```sql
group_id (FOREIGN KEY)
file_id (FOREIGN KEY to model_files)
```

#### `model_relationships`
```sql
relationship_id (PRIMARY KEY)
parent_model_id (FOREIGN KEY to models)
related_model_id (FOREIGN KEY to models)
relationship_type (ENUM: 'variant', 'remix', 'scaled_version', 'custom')
notes
```

## Architecture

### Electron Main Process
- File system operations
- Database operations (SQLite in app data directory)
- Multi-directory file watching (with chokidar)
- Thumbnail generation (in background, respects per-directory settings)
- File hash calculation for duplicate detection
- Sidecar file sync (optional import/export)
- IPC handlers for renderer communication
- Settings management (thumbnail storage mode, sidecar sync, etc.)

### Electron Renderer Process (React)
- UI components
- 3D preview (Three.js)
- User interactions
- IPC communication with main process

### Data Flow
```
User Action → React Component → IPC Call → Main Process → Database/File System
                                              ↓
                                         Response
                                              ↓
React Component ← IPC Response ← Main Process
```

## Key Challenges & Solutions

### 1. Performance with Large File Collections
- **Challenge**: Thousands of STL files could slow down the app
- **Solutions**:
  - Lazy loading and virtualization for file lists
  - Background indexing
  - Cached thumbnails
  - Pagination or infinite scroll

### 2. STL File Parsing & Preview
- **Challenge**: STL files can be large, rendering might be slow
- **Solutions**:
  - Load simplified mesh for thumbnails
  - Lazy load full model for detailed view
  - Web Workers for STL parsing
  - LOD (Level of Detail) for large models

### 3. File System Watching
- **Challenge**: Detecting external changes across multiple watched directories (including network shares)
- **Solutions**:
  - Use chokidar for efficient file watching
  - Handle network share disconnections gracefully
  - Debounce scan operations
  - Background sync process
  - Per-directory watching state (active/paused)
  - Retry logic for temporarily unavailable directories

### 4. Cross-Platform Compatibility
- **Challenge**: Works on Windows, macOS, Linux
- **Solutions**:
  - Use path.join for file paths
  - Test file watching on all platforms
  - Handle platform-specific file paths

### 5. Database Portability
- **Challenge**: Users might want to move their library or access from different machines
- **Solutions**:
  - Store relative paths within each watched directory
  - Directory remapping when paths change
  - Export/import functionality (metadata + directory mappings)
  - Sidecar files allow metadata to travel with files
  - Database backup/restore functionality

### 6. Storage Management
- **Challenge**: Users need control over where thumbnails/metadata are stored
- **Solutions**:
  - Clear settings UI for storage preferences
  - Per-directory thumbnail storage configuration
  - Show storage usage statistics
  - Ability to migrate between storage modes
  - Clean up orphaned thumbnails/sidecar files

### 7. Multi-Part Model Detection
- **Challenge**: Automatically identifying which STL files belong to the same model
- **Solutions**:
  - Pattern matching on filenames (e.g., "dragon_part1.stl", "dragon_part2.stl")
  - Same folder heuristic (files in same folder with similar names)
  - User-defined naming patterns
  - Manual grouping interface with suggestions
  - Learn from user corrections
  - Common patterns:
    - Numbered parts: `model_1.stl`, `model_2.stl`
    - Named parts: `robot_arm.stl`, `robot_body.stl`, `robot_head.stl`
    - Underscore/dash patterns: `item-left.stl`, `item-right.stl`

## Development Phases

### Phase 1: MVP (Minimum Viable Product)
- [ ] Basic Electron + React + TypeScript setup
- [ ] File system scanning (single directory)
- [ ] SQLite database integration with model/file separation
- [ ] Basic file list display (grouped by model)
- [ ] Simple STL preview with Three.js (single file)
- [ ] Basic metadata (name, description, tags) at model level
- [ ] Manual model grouping (combine files into one model)

### Phase 2: Core Features
- [ ] Multiple directory management (add/remove/configure)
- [ ] Auto-detection of multi-part models (pattern matching)
- [ ] Multi-part model viewer (assembled view, part toggles)
- [ ] System integration ("Show in Folder" button, open with slicer)
- [ ] Basic sliced file tracking (link gcode to models)
- [ ] Gcode parser (extract settings, print time, filament usage)
- [ ] Thumbnail generation with configurable storage
- [ ] File system watching for auto-updates (all directories)
- [ ] File hash calculation and duplicate detection
- [ ] Multi-tab interface (open multiple models)
- [ ] Search and filter functionality
- [ ] Collections/folders system (virtual)
- [ ] Batch operations
- [ ] Settings/preferences (thumbnail mode, sidecar sync, grouping patterns)

### Phase 3: Enhanced Features
- [ ] Split pane system (side-by-side comparison)
- [ ] Workspace layouts (save/restore pane configurations)
- [ ] Model relationships (variants, remixes, scaled versions)
- [ ] Part-level notes and print order
- [ ] Advanced sliced file management:
  - [ ] Multiple slice versions per model
  - [ ] Settings comparison
  - [ ] Link specific parts to multi-file slices
  - [ ] Extract thumbnails from gcode
- [ ] Custom metadata fields
- [ ] Advanced search/filters (across all directories)
- [ ] Physical file moving/reorganization
- [ ] Sidecar file generation and sync
- [ ] Duplicate file management UI
- [ ] Export/import metadata (bulk operations)
- [ ] Print history tracking (link completed prints to sliced files)
- [ ] Statistics/analytics

### Phase 4: Polish
- [ ] Performance optimization (lazy load tabs, virtualized lists)
- [ ] Better UI/UX (polish tab interactions, animations)
- [ ] Comprehensive keyboard shortcuts (tab nav, pane management, search)
- [ ] Dark mode
- [ ] Auto-updates
- [ ] Documentation

## Project Structure
```
ModelVault/
├── electron/
│   ├── main.ts              # Main process entry
│   ├── preload.ts           # Preload script
│   ├── database/
│   │   ├── db.ts           # Database initialization
│   │   ├── models.ts       # Model queries
│   │   ├── directories.ts  # Directory management
│   │   ├── slicedFiles.ts  # Sliced file queries
│   │   ├── duplicates.ts   # Duplicate detection queries
│   │   └── migrations/     # Schema migrations
│   ├── services/
│   │   ├── directoryManager.ts     # Multi-directory management
│   │   ├── fileScanner.ts          # File system scanning
│   │   ├── fileWatcher.ts          # Watch for changes
│   │   ├── modelGrouper.ts         # Auto-detect and group related files
│   │   ├── slicedFileScanner.ts    # Scan for gcode/sliced files
│   │   ├── gcodeParser.ts          # Extract settings from gcode
│   │   ├── thumbnailGenerator.ts   # With storage mode support
│   │   ├── stlParser.ts            # STL file parsing
│   │   ├── hashCalculator.ts       # File hashing for duplicates
│   │   ├── sidecarManager.ts       # JSON sidecar file sync
│   │   ├── systemIntegration.ts    # Open in file explorer, slicer
│   │   └── duplicateDetector.ts    # Duplicate detection logic
│   ├── ipc/                # IPC handlers
│   └── config/
│       └── appPaths.ts     # App data directory paths
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── TabBar/         # Tab management
│   │   │   ├── TabContent/     # Individual tab content
│   │   │   ├── SplitPane/      # Pane splitting logic
│   │   │   └── WorkspaceLayout/ # Overall layout manager
│   │   ├── DirectoryManager/   # Add/remove/configure directories
│   │   ├── FileList/           # With directory source display
│   │   ├── ModelViewer/        # Three.js preview
│   │   │   ├── SinglePartView/
│   │   │   ├── MultiPartView/  # Assembled view with part toggles
│   │   │   └── PartList/       # List of parts in a model
│   │   ├── MetadataEditor/
│   │   ├── ModelGrouper/       # Group/ungroup files into models
│   │   ├── SlicedFileManager/  # View/link gcode files
│   │   │   ├── SliceList/
│   │   │   ├── SliceSettings/  # Display extracted settings
│   │   │   └── SliceLinking/   # Link gcode to STL parts
│   │   ├── SearchBar/
│   │   ├── Collections/
│   │   ├── DuplicateManager/   # View and resolve duplicates
│   │   ├── Settings/           # App settings UI
│   │   └── FileOrganizer/      # Move/reorganize files
│   ├── hooks/
│   ├── store/              # State management
│   ├── types/
│   ├── utils/
│   └── App.tsx
├── public/
├── package.json
└── tsconfig.json
```

## Security Considerations
- Sanitize file paths to prevent directory traversal
- Validate user input for metadata
- Be careful with file system operations
- Consider sandboxing for STL parsing (use workers)

## Testing Strategy
- Unit tests for database operations
- Integration tests for file scanning
- E2E tests for critical user flows
- Test with large STL files
- Test with large file collections (1000+ files)

## Future Enhancements
- Cloud sync (optional)
- Direct slicer integration (auto-open in PrusaSlicer, Cura, etc.)
- Printer connection and monitoring (OctoPrint, Klipper integration)
- Send directly to printer from app
- Print queue management with sliced files
- Filament inventory tracking
- Multi-user support (optional)
- Plugin system for extensibility
- AI-powered auto-tagging
- Duplicate file detection
- Watch slicer output directories for auto-import of gcode files
- Estimate costs based on filament usage and filament inventory prices

## Resolved Design Decisions

1. **Database Location**: 
   - ✅ **Store in user's app data directory**
   - Keeps database separate from model files
   - Standard location: `~/.config/ModelVault/` (Linux), `~/Library/Application Support/ModelVault/` (macOS), `%APPDATA%/ModelVault/` (Windows)

2. **Thumbnail Storage**:
   - ✅ **User-configurable option**
   - Allow user to choose between:
     - Centralized cache (default): `appData/ModelVault/thumbnails/`
     - Same directory as models: Creates `.modelvault/` subfolder or `{filename}_thumb.png`
   - Pros of centralized: Clean model directories, easier management
   - Pros of same directory: Thumbnails travel with files when shared

3. **File Organization**:
   - ✅ **Both virtual collections AND physical file moving**
   - Virtual collections (tags/collections) for flexible organization without moving files
   - Optional file moving/reorganization with metadata preservation
   - User chooses workflow that fits their needs

4. **Multi-Directory Support**:
   - ✅ **Multiple watched directories**
   - Support directories on different drives, network shares, external storage
   - Each directory can have independent settings (thumbnail storage preference)
   - Duplicate detection: Flag identical files across directories for user review
   - Show directory source in file list

5. **Metadata Storage**:
   - ✅ **Hybrid approach: Database + optional sidecar files**
   - Primary storage: Database (fast queries, always available)
   - Optional: Export to `.json` sidecar files for portability
   - Sidecar format: One JSON file per model (contains all parts + metadata)
   - Naming: `{model_name}.modelvault.json` or stored in `.modelvault/` folder
   - Sync mechanism: Database is source of truth, can import/export sidecar files
   - User setting: Auto-generate sidecar files on metadata change (opt-in)

## Resources & References
- [Electron Documentation](https://www.electronjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber)
- [STL File Format](https://en.wikipedia.org/wiki/STL_(file_format))

## Next Steps
1. Set up basic Electron + React + TypeScript boilerplate
2. Implement basic STL file loading and Three.js preview
3. Set up SQLite database with initial schema
4. Create basic file scanning functionality
5. Build simple UI to display scanned files
