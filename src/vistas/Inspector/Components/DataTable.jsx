import React from 'react';
import TableRow from './TableRow';

const DataTable = ({ data, onViewGrades }) => {
  return (
    <div style={{ 
      overflowX: 'auto', // Permite scroll horizontal si la tabla es más ancha que la pantalla
      border: '1px solid #dee2e6', 
      borderRadius: '4px', 
      backgroundColor: 'white',
      width: '100%'
    }}>
      <table style={{ 
        width: '100%', 
        minWidth: '900px', // Fuerza el scroll horizontal en pantallas pequeñas (móviles/tablets)
        borderCollapse: 'collapse', 
        textAlign: 'center', 
        fontSize: '14px' 
      }}>
        <thead style={{ backgroundColor: '#004a98', color: 'white' }}>
          <tr>           
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Cédula</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Primer Nombre</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Primer Apellido</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Segundo Nombre</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Segundo Apellido</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Email</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Celular</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Rol</th>
            <th style={{ padding: '12px', border: '1px solid #99b6d3', fontWeight: '600' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((docente) => (
              <TableRow 
                key={docente.nroCedula} 
                docente={docente} 
                onViewGrades={onViewGrades}
              />
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ padding: '20px', color: '#6c757d' }}>
                No se encontraron registros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;