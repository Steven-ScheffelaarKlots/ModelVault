import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import type { ModelWithFiles } from '../../types/models';

interface STLViewerProps {
  model: ModelWithFiles;
}

function STLModel({ filePath }: { filePath: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const loadSTL = async () => {
      try {
        const buffer = await window.electron.readSTLFile(filePath);
        const loader = new STLLoader();
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
        const geom = loader.parse(arrayBuffer);
        geom.center();
        
        if (mounted) {
          setGeometry(geom);
        }
      } catch (error) {
        console.error('Error loading STL:', error);
      }
    };
    
    loadSTL();
    
    return () => {
      mounted = false;
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [filePath]);
  
  if (!geometry) return null;
  
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#60a5fa" />
    </mesh>
  );
}

export default function STLViewer({ model }: STLViewerProps) {
  if (model.files.length === 0) {
    return <div className="no-files">No files to display</div>;
  }
  
  return (
    <div className="stl-viewer">
      <Canvas camera={{ position: [100, 100, 100], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        {model.files.map((file) => (
          <STLModel key={file.file_id} filePath={file.file_path} />
        ))}
        
        <Grid infiniteGrid fadeDistance={300} fadeStrength={5} />
        <OrbitControls makeDefault />
      </Canvas>
      
      <div className="viewer-overlay">
        <strong>{model.model.model_name}</strong>
        {model.model.is_multi_part && (
          <div className="viewer-parts-count">
            Parts: {model.files.length}
          </div>
        )}
      </div>
    </div>
  );
}
