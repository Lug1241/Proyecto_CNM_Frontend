import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ListadoEstudiantesDocente from './ListadoEstudiantesDocente';

const CursosDocente = ({ docente, onBack }) => {
  // Maneja si mostramos "Grupal" o "Individual"
  const [activeTab, setActiveTab] = useState('Grupal');
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datosListado, setDatosListado] = useState(null);
  
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const token = localStorage.getItem("token");

  useEffect(() => {
    let mounted = true;

    const fetchCursos = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_URL}/asignacion/docente/${docente.nroCedula}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (mounted) {
          setAsignaciones(data.data || []);
        }
      } catch (error) {
        console.error("Error al cargar las asignaciones:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (docente?.nroCedula) {
      fetchCursos();
    }

    return () => {
      mounted = false;
    };
  }, [docente, API_URL, token]);

  // 1. Filtramos las asignaciones según la pestaña activa
  const cursosFiltrados = asignaciones.filter(asig =>
    asig.tipo?.toLowerCase() === activeTab.toLowerCase()
  );

  // 2. Lógica de agrupación: Agrupamos las individuales por Materia y Nivel
  const getCursosAgrupados = () => {
    if (activeTab === 'Grupal') {
      // Las grupales se mantienen 1 a 1 en su tarjeta
      return cursosFiltrados.map(curso => ({
        materia: curso.materia,
        nivel: curso.nivel,
        asignaciones: [curso] // Lo metemos en un array para reutilizar el mismo renderizado
      }));
    } else {
      // Las individuales se agrupan si coinciden en Materia y Nivel
      const grupos = cursosFiltrados.reduce((acc, curso) => {
        const key = `${curso.materia}-${curso.nivel}`;
        if (!acc[key]) {
          acc[key] = {
            materia: curso.materia,
            nivel: curso.nivel,
            asignaciones: []
          };
        }
        acc[key].asignaciones.push(curso);
        return acc;
      }, {});

      return Object.values(grupos);
    }
  };

  const cursosARenderizar = getCursosAgrupados();

  // Función para formatear el horario visualmente
  const formatHorario = (curso) => {
    if (!curso.dias || !curso.horaInicio || !curso.horaFin) {
      return <span className="text-dark">Horario no definido</span>;
    }

    // Si es un curso individual, tiene 2 días registrados y tiene las horas secundarias
    if (curso.tipo?.toLowerCase() === 'individual' && Array.isArray(curso.dias) && curso.dias.length === 2 && curso.hora1 && curso.hora2) {
      return (
        <div className="text-dark">
          <div>{curso.dias[0]} de {curso.horaInicio} a {curso.horaFin}</div>
          <div>{curso.dias[1]} de {curso.hora1} a {curso.hora2}</div>
        </div>
      );
    }

    // Comportamiento por defecto para Grupales o Individuales de 1 solo día
    const diasStr = Array.isArray(curso.dias) ? curso.dias.join(', ') : curso.dias;
    return <span className="text-dark">{diasStr} de {curso.horaInicio} a {curso.horaFin}</span>;
  };

  // Si el usuario hizo clic en una tarjeta, mostramos el listado
  if (datosListado) {
    return (
      <ListadoEstudiantesDocente
        datosTarjeta={datosListado}
        onBack={() => setDatosListado(null)}
      />
    );
  }

  return (
    <div className="d-flex flex-column h-100 p-4 bg-white border rounded shadow-sm">

      {/* Encabezado: Título pequeño y botón a la derecha */}
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
        <h5 className="m-0 text-primary fw-bold">
          Cursos del docente {docente?.primer_nombre} {docente?.primer_apellido}
        </h5>
        <button
          onClick={onBack}
          className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3"
          style={{ whiteSpace: 'nowrap', width: 'fit-content' }}
        >
          <span>&larr;</span> Regresar
        </button>
      </div>

      {/* Pestañas de Bootstrap */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item" style={{ cursor: 'pointer' }}>
          <span
            className={`nav-link ${activeTab === 'Grupal' ? 'active fw-bold' : 'text-muted'}`}
            onClick={() => setActiveTab('Grupal')}
          >
            Cursos Grupales
          </span>
        </li>
        <li className="nav-item" style={{ cursor: 'pointer' }}>
          <span
            className={`nav-link ${activeTab === 'Individual' ? 'active fw-bold' : 'text-muted'}`}
            onClick={() => setActiveTab('Individual')}
          >
            Cursos Individuales
          </span>
        </li>
      </ul>

      {/* Contenedor de Tarjetas (Grid de Bootstrap) */}
      <div className="flex-grow-1 overflow-auto pb-2 px-1">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <span className="text-muted">Cargando asignaciones...</span>
          </div>
        ) : cursosARenderizar.length === 0 ? (
          <div className="alert alert-light text-center border mt-4">
            No se encontraron cursos de tipo {activeTab.toLowerCase()} para este periodo.
          </div>
        ) : (
          <div className="row g-4 mt-1">
            {cursosARenderizar.map((grupo, index) => (
              <div className="col-12 col-md-6 col-lg-4" key={index}>
                
                {/* TARJETA CLICKEABLE */}
                <div 
                  className="card h-100 shadow" 
                  style={{ borderColor: '#004a98', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setDatosListado({
                    tipo: activeTab,
                    docente: `${docente?.primer_nombre || ''} ${docente?.primer_apellido || ''}`.trim(),
                    materia: grupo.materia,
                    nivel: grupo.nivel,
                    descripcionPeriodo: grupo.asignaciones[0]?.Periodo_Academico?.descripcion,
                    asignaciones: grupo.asignaciones
                  })}
                >
                  {/* Cabecera de la Tarjeta (Materia agrupada) */}
                  <div className="card-header text-white fw-bold border-0" style={{ backgroundColor: '#004a98' }}>
                    {grupo.materia || 'Materia desconocida'}
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="card-body bg-white">
                    <p className="card-text mb-3">
                      <strong style={{ color: '#004a98' }}>Nivel:</strong> <span className="text-dark">{grupo.nivel || 'N/A'}</span>
                    </p>

                    {/* Si es Grupal, mostramos detalles completos. Si es Individual, un resumen compacto. */}
                    {activeTab === 'Grupal' ? (
                      grupo.asignaciones.map((curso, idx) => (
                        <div key={curso.ID} className={idx > 0 ? "border-top pt-3 mt-3" : ""}>
                          <p className="card-text mb-2">
                            <strong style={{ color: '#004a98' }}>Paralelo:</strong> <span className="text-dark">{curso.paralelo}</span>
                          </p>

                          <div className="card-text mb-2">
                            <strong style={{ color: '#004a98' }}>Horario:</strong> {formatHorario(curso)}
                          </div>

                          <p className="card-text mb-0">
                            <strong style={{ color: '#004a98' }}>Cupos totales:</strong> <span className="text-dark">{curso.cupos}</span>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="card-text mb-0">
                        <strong style={{ color: '#004a98' }}>Cursos agrupados:</strong> <span className="text-dark">{grupo.asignaciones.length}</span>
                      </p>
                    )}
                  </div>
                  

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CursosDocente;