interface DirectorySelectorProps {
  onScan: () => void;
  loading: boolean;
}

export default function DirectorySelector({ onScan, loading }: DirectorySelectorProps) {
  return (
    <div className="directory-selector">
      <button 
        onClick={onScan} 
        disabled={loading}
        className="scan-button"
      >
        {loading ? 'Scanning...' : 'Scan Directory'}
      </button>
    </div>
  );
}
