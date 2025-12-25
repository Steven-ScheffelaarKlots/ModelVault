# ModelVault

A desktop application for organizing 3D printing files (STL models) with metadata support and 3D preview generation.

## Features (Phase 1 MVP)

- **Directory Scanning**: Scan directories for STL files and automatically index them
- **SQLite Database**: Efficient local storage with model/file separation
- **3D Preview**: View STL files in 3D using Three.js
- **Metadata Management**: Add descriptions and tags to models
- **Multi-part Models**: Manually group multiple STL files into a single model
- **File System Integration**: "Show in Folder" to quickly locate files

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Steven-ScheffelaarKlots/ModelVault.git
cd ModelVault
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run electron:dev
```

4. Build for production:
```bash
npm run electron:build
```

## Technology Stack

- **Electron**: Desktop application framework
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **SQLite** (better-sqlite3): Local database
- **Three.js**: 3D rendering for STL preview
- **Vite**: Fast build tool

## Project Structure

```
ModelVault/
├── electron/               # Electron main process
│   ├── main.ts            # Main entry point
│   ├── preload.ts         # IPC bridge
│   ├── database/          # Database layer
│   ├── services/          # File scanning services
│   └── ipc/               # IPC handlers
├── src/                   # React application
│   ├── components/        # React components
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # React entry point
├── phases/                # Implementation plans
└── package.json
```

## Usage

1. **Scan a Directory**: Click "Scan Directory" to select a folder containing STL files
2. **View Models**: Select a model from the sidebar to view it in 3D
3. **Edit Metadata**: Add descriptions and tags to your models
4. **Show in Folder**: Click to open the file location in your file explorer
5. **Group Files**: Combine multiple STL files into a multi-part model (future feature)

## Database

ModelVault uses SQLite to store all model metadata. The database is stored in your application data directory:
- **Windows**: `%APPDATA%/ModelVault/modelvault.db`
- **macOS**: `~/Library/Application Support/ModelVault/modelvault.db`
- **Linux**: `~/.config/ModelVault/modelvault.db`

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
