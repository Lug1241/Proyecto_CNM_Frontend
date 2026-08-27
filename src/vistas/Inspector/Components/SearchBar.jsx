import React from 'react';

const SearchBar = ({ search, onSearchChange }) => {
  return (
    <div style={{ marginBottom: '15px' }}>
      <input
        type="text"
        placeholder="Filtrar por primer_nombre"
        style={{
          width: '300px',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          outline: 'none',
          fontSize: '14px'
        }}
        value={search}
        onChange={onSearchChange}
      />
    </div>
  );
};

export default SearchBar;