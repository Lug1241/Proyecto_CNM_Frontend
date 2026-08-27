import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SearchBar from '../Components/SearchBar';
import DataTable from '../Components/DataTable';
import Paginación from '../../Admin/Components/Paginación';
import CursosDocente from './CursosDocente';

function Docentes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [vistaActual, setVistaActual] = useState('tabla'); // Puede ser 'tabla' o 'cursos'
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  // Estados para los datos y la carga interna de la tabla
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la paginación
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10; 
  const pagerRef = useRef(null);

  // Variables de entorno y token
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const token = localStorage.getItem("token");

  // Fetch de datos inicial
  useEffect(() => {
    let mounted = true;
    const fetchDocentes = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_URL}/docente/obtener`, {
          params: { page: 1, limit: 1000 },
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!mounted) return;
        setDocentes(data.data ?? []);
      } catch (error) {
        console.error("Error obteniendo docentes:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (docentes.length === 0) {
      fetchDocentes();
    }
    
    return () => {
      mounted = false;
    };
  }, [API_URL, token]); 

  // 1. Filtrar los usuarios protegiendo contra nulos
  const filteredUsers = docentes.filter(docente => {
    const nombre = docente.primer_nombre || '';
    const termino = searchTerm || ''; 
    return nombre.toLowerCase().includes(termino.toLowerCase());
  });

  // 2. Calcular la paginación sobre los usuarios filtrados
  const totalFilteredPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const pageData = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 3. Volver a la página 1 al buscar
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);


  const handleViewGrades = (docente) => {
    setDocenteSeleccionado(docente);
    setVistaActual('cursos');
  };

  if (vistaActual === 'cursos') {
    return (
      <div style={{ padding: '20px', height: 'calc(100vh - 60px)', backgroundColor: '#f8f9fa' }}>
        <CursosDocente 
          docente={docenteSeleccionado} 
          onBack={() => setVistaActual('tabla')} 
        />
      </div>
    );
  }

return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 60px)', // Restringe la altura total restando el Header
      backgroundColor: '#f8f9fa' // Fondo opcional para que resalte la tabla blanca
    }}>
      
      {/* 1. Contenedor superior fijo (Buscador) */}
      <div style={{ padding: '20px 20px 0 20px', flexShrink: 0 }}>
        <SearchBar 
          search={searchTerm} 
          onSearchChange={(e) => setSearchTerm(e.target?.value)} 
        />
      </div>
      
      {/* 2. Contenedor central flexible (Tabla con Scroll) */}
      <div style={{ 
        flex: '1', 
        overflow: 'auto', // Habilita el scroll vertical y horizontal aquí
        padding: '0 20px 20px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <span style={{ color: '#6c757d' }}>Cargando docentes...</span>
          </div>
        ) : (
          <DataTable 
            data={pageData} 
            onViewGrades={handleViewGrades}
          />
        )}
      </div>
      
      {/* 3. Contenedor inferior fijo (Paginación) */}
      <div style={{ 
        flexShrink: 0,
        padding: '15px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }} ref={pagerRef}>
        {totalFilteredPages > 1 && (
          <Paginación totalPages={totalFilteredPages} page={page} setPage={setPage} />
        )}
      </div>
      
    </div>
  );
}

export default Docentes;