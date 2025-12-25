
import type { ModelWithFiles } from '../../types/models';

interface ModelListProps {
  models: ModelWithFiles[];
  selectedModelId?: number;
  onSelectModel: (modelId: number) => void;
}

export default function ModelList({ models, selectedModelId, onSelectModel }: ModelListProps) {
  return (
    <div className="model-list">
      <h3 className="model-list-title">Models ({models.length})</h3>
      <div className="model-list-items">
        {models.length === 0 ? (
          <div className="empty-message">No models yet. Scan a directory to get started.</div>
        ) : (
          models.map((modelWithFiles) => (
            <div
              key={modelWithFiles.model.model_id}
              className={`model-item ${selectedModelId === modelWithFiles.model.model_id ? 'selected' : ''}`}
              onClick={() => onSelectModel(modelWithFiles.model.model_id)}
            >
              <div className="model-item-name">{modelWithFiles.model.model_name}</div>
              <div className="model-item-info">
                {modelWithFiles.model.is_multi_part ? (
                  <span className="badge">Multi-part ({modelWithFiles.files.length})</span>
                ) : (
                  <span className="badge">Single file</span>
                )}
              </div>
              <div className="model-item-tags">
                {modelWithFiles.tags.map(tag => (
                  <span key={tag.tag_id} className="tag">{tag.tag_name}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
