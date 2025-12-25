import { useState, useEffect } from 'react';
import type { ModelWithFiles, Metadata, Tag } from '../../types/models';

interface MetadataEditorProps {
  model: ModelWithFiles;
  onUpdate: (metadata: Partial<Metadata>) => void;
}

export default function MetadataEditor({ model, onUpdate }: MetadataEditorProps) {
  const [description, setDescription] = useState(model.metadata?.description || '');
  const [newTagName, setNewTagName] = useState('');
  const [tags, setTags] = useState<Tag[]>(model.tags);

  useEffect(() => {
    setDescription(model.metadata?.description || '');
    setTags(model.tags);
  }, [model]);

  const handleSaveDescription = () => {
    onUpdate({ description });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const tag = await window.electron.addTag(model.model.model_id, newTagName.trim());
      setTags([...tags, tag]);
      setNewTagName('');
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await window.electron.removeTag(model.model.model_id, tagId);
      setTags(tags.filter(t => t.tag_id !== tagId));
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleShowInFolder = () => {
    if (model.files.length > 0) {
      window.electron.showInFolder(model.files[0].file_path);
    }
  };

  return (
    <div className="metadata-editor">
      <h3>Model Details</h3>
      
      <div className="metadata-section">
        <h4>Files</h4>
        <div className="file-list">
          {model.files.map((file) => (
            <div key={file.file_id} className="file-item">
              <span className="file-name">{file.file_name}</span>
              <span className="file-size">{(file.file_size / 1024).toFixed(2)} KB</span>
            </div>
          ))}
        </div>
        <button onClick={handleShowInFolder} className="action-button">
          Show in Folder
        </button>
      </div>

      <div className="metadata-section">
        <h4>Description</h4>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={4}
          className="description-input"
        />
        <button onClick={handleSaveDescription} className="action-button">
          Save Description
        </button>
      </div>

      <div className="metadata-section">
        <h4>Tags</h4>
        <div className="tags-container">
          {tags.map((tag) => (
            <div key={tag.tag_id} className="tag-item">
              <span>{tag.tag_name}</span>
              <button onClick={() => handleRemoveTag(tag.tag_id)} className="tag-remove">×</button>
            </div>
          ))}
        </div>
        <div className="tag-input-container">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add a tag..."
            className="tag-input"
          />
          <button onClick={handleAddTag} className="action-button">Add Tag</button>
        </div>
      </div>

      <div className="metadata-section">
        <h4>Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Directory:</span>
            <span className="info-value">{model.directory.directory_name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Date Added:</span>
            <span className="info-value">{new Date(model.model.date_added).toLocaleDateString()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Modified:</span>
            <span className="info-value">{new Date(model.model.date_modified).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
