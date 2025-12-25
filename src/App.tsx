import { useState, useEffect } from 'react';
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
