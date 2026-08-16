import React, { useState } from 'react';

function FileUploader({ 
  label, 
  name, 
  currentFilePath, 
  onChange, 
  accept = "application/pdf", 
  disabled = false,
  error 
}) {
  const [nuevoArchivo, setNuevoArchivo] = useState(null);
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;

  // Manejador intermedio para actualizar el estado visual y pasar el evento al padre
  const handleInternalChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNuevoArchivo(file.name);
    } else {
      setNuevoArchivo(null);
    }
    // Disparamos la función original de tu formulario
    if (onChange) {
      onChange(e);
    }
  };

  // Extrae solo el nombre del archivo (ej. cedula.pdf)
  const getFileNameFromPath = (path) => {
    if (!path) return null;
    return path.split('/').pop() || path.split('\\').pop();
  };

  return (
    <div className="file-upload">
      <label className="custom-file-label">
        {label}
      </label>

      {/* Visor del archivo actual en la Base de Datos */}
      {currentFilePath && !nuevoArchivo && (
        <div style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
          <span style={{ color: '#6c757d', marginRight: '8px' }}>Archivo actual:</span>
          <a 
            href={`${API_URL}/${currentFilePath}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0056b3' }}
          >
            {getFileNameFromPath(currentFilePath)}
          </a>
        </div>
      )}

      {/* Tu input original inalterado */}
      <input
        type="file"
        name={name}
        className="custom-file-input"
        onChange={handleInternalChange}
        accept={accept}
        disabled={disabled}
      />
      
      {/* Tu span de errores original */}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export default FileUploader;