import React, { useState, useEffect } from "react";
import axios from 'axios';
import Tabla from '../../Representante/components/Tabla_Representante';
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Loading from "../../../components/Loading";
import VerDatosEstudiante from '../../Representante/modulos/VerDatosEstudiante';
import Horarios from './Matriculacion/Horarios';
import '../components/Tabla_Representante.css'; // Importar estilos para la sección de resumen
import './Matriculacion/Busqueda.css'; // Importar estilos para las tarjetas del resumen semanal
import { useLocation, useNavigate } from "react-router-dom";
import { modulosRepresentante } from "../components/ModulosRepresentante";
import { useAuth } from '../../../Utils/useAuth';
import { ErrorMessage } from '../../../Utils/ErrorMesaje';

function ListaEstudiantes() {
  // Protección de ruta para Representante
  const auth = useAuth("representante");
  
  // Si no está autenticado, mostrar mensaje de error
  if (!auth.isAuthenticated) {
    return <ErrorMessage message="No tienes permisos para acceder a esta página" />;
  }

  // Estado para almacenar la información del usuario conectado
  const [usuario, setUsuario] = useState(null);
  const [datosEstudiante, setDatosEstudiante] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalificacionesOpen, setIsCalificacionesOpen] = useState(false);
  const [isResumenSemanalOpen, setIsResumenSemanalOpen] = useState(false);
  const [asignacionesResumen, setAsignacionesResumen] = useState([]);
  const [estudianteResumen, setEstudianteResumen] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  let periodosMatriculados = [];
  //let periodosDatos = [];
  const [periodosDatos, setPeriodosDatos] = useState([]);
  const navigate = useNavigate();

  // Dentro de ListaEstudiantes
  const handleUpdatedEstudiante = (estudianteActualizado) => {
    setDatosEstudiante(prev =>
      prev.map(est =>
        est.ID === estudianteActualizado.ID ? { ...est, ...estudianteActualizado } : est
      )
    );
  };

  // ✅ Verificación de autenticación
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    if (!parsedUser) {
      navigate("/");
      return;
    }
    setUsuario(parsedUser);
  }, [navigate]);


  const handleVerCalificaciones = async (estudianteCedula) => {
    console.log("ver calificaciones de: ", estudianteCedula);

    try {
      const token = localStorage.getItem("token");
      const baseURL = import.meta.env.VITE_URL_DEL_BACKEND;
      const headers = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

      // Solicitud para obtener los datos de un estudiante en caso
      // de que se haga click en su correspondiente boton
      // de Ver calificaciones
      const { data: estudiante } = await axios.get(
        `${baseURL}/estudiante/obtener/${estudianteCedula}`,
        headers
      );
      setEstudianteSeleccionado(estudiante);

      // Solicitud para ver todos los periodos academicos en los que un estudiante se matriculo 
      const { data: periodosMatriculados } = await axios.get(
        `${baseURL}/matricula/estudiante/${estudiante.ID}`,
        headers
      );
      // Devuelve un array con objetos. 
      // Formato de objetos {ID de la matricula:, ID periodo academico:} 
      // Ejemplo [{ID: 21, ID_periodo_academico: "Periodo academico 2024-2025"}]

      // Solicitud par obtener datos de los periodos academicos en los que se matriculo el estudiante
      const respuestaPeriodosDatos = await Promise.all(
        periodosMatriculados.map(matricula =>
          axios.get(`${baseURL}/periodo_academico/obtener/${matricula.ID_periodo_academico}`, headers)
            .then(response => ({
              ...matricula,
              descripcion: response.data.descripcion
            }))
        )
      );

      navigate(
        `/representante/calificaciones`,
        { state: { estudiante, respuestaPeriodosDatos } }
      );


    } catch (error) {
      console.log('Error al obtener las calificaciones del estudiante para el modal', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleVerDatosEstudiante = async (estudianteCedula) => {
    try {

      const token = localStorage.getItem("token");
      const respuesta = await axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/estudiante/obtener/${estudianteCedula}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEstudianteSeleccionado(respuesta.data);
      setIsModalOpen(true);

    } catch (error) {
      console.log('Error al obtener los datos del estudiante para el modal', error);
    } finally {
      setIsLoading(false);
    }

  }

  const handleVerResumenSemanal = async (estudianteCedula) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
      
      // Obtener datos del estudiante
      const respuestaEstudiante = await axios.get(`${API_URL}/estudiante/obtener/${estudianteCedula}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Obtener período académico activo
      const respuestaPeriodo = await axios.get(`${API_URL}/periodo_academico/activo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Obtener matrícula del estudiante en el período activo
      const respuestaMatricula = await axios.get(
        `${API_URL}/matricula/estudiante/periodo/${respuestaEstudiante.data.ID}/${respuestaPeriodo.data.ID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (respuestaMatricula.data) {
        // Obtener inscripciones del estudiante
        const respuestaInscripciones = await axios.get(
          `${API_URL}/inscripcion/obtener/matricula/${respuestaMatricula.data.ID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Extraer las asignaciones de las inscripciones (como en Matriculación)
        const asignaciones = respuestaInscripciones.data
          .map(insc => insc.Asignacion)
          .filter(Boolean);
        
        setEstudianteResumen(respuestaEstudiante.data);
        setAsignacionesResumen(asignaciones);
        setIsResumenSemanalOpen(true);
      } else {
        // Si no tiene matrícula, mostrar mensaje
        setEstudianteResumen(respuestaEstudiante.data);
        setAsignacionesResumen([]);
        setIsResumenSemanalOpen(true);
      }

    } catch (error) {
      console.log('Error al obtener el resumen semanal del estudiante', error);
      ErrorMessage(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResumenSemanal = () => {
    setIsResumenSemanalOpen(false);
    setEstudianteResumen(null);
    setAsignacionesResumen([]);
  };


  //  Obtener los datos del representante guardados en localStorage
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      try {
        // Obtener datos del representante logeado
        const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
        if (usuarioGuardado) {
          setUsuario(usuarioGuardado);
        } else {
          return console.log('El usuario es NULL');
        }
      } catch (error) {
        console.error("Error al cargar datos: ", error);
      } finally {
        setIsLoading(false);
      }
    }
    cargarDatos();
  }, []);

  // Obtener los estudiantes a cargo de un representante
  useEffect(() => {
    const cargarDatosEstudiantes = async () => {
      if (!usuario || usuario.length == 0) {
        return;
      }
      try {
        // Peticion para obtener los estudiantes a cargo del representante logeado
        const token = localStorage.getItem("token");
        const respuesta = await axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/api/representantes/${usuario.nroCedula}/estudiantes`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setDatosEstudiante(respuesta.data);

      } catch (error) {
        console.error("Error al cargar datos del estudiante: ", error);
      }
    }
    cargarDatosEstudiantes();
  }, [usuario]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCalificacionesOpen(false);
    setEstudianteSeleccionado(null);
  }

  return (
    <div className="section-container">
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>

      <Layout modules={modulosRepresentante}>
        <div className="vista-estudiantes">
          {isLoading ? (
            <Loading />
          ) : (
            <Tabla
              datos={datosEstudiante}
              isLoading={isLoading}
              handleVerCalificaciones={handleVerCalificaciones}
              handleVerDatosEstudiante={handleVerDatosEstudiante}
              handleVerResumenSemanal={handleVerResumenSemanal}
            />
          )}

          {/* Sección de resumen semanal del estudiante */}
          {isResumenSemanalOpen && (
            <div className="seccion-resumen-semanal">
              <div className="header-resumen">
                <h3>Horario de: {estudianteResumen?.primer_nombre} {estudianteResumen?.primer_apellido}</h3>
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={handleCloseResumenSemanal}
                  type="button"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="contenido-resumen">
                {asignacionesResumen.length > 0 ? (
                  <div className="resumen-semanal-estudiante">
                    <div className="grid-dias">
                      {(() => {
                        // Función para obtener el horario correcto por día
                        const getHorarioPorDia = (asignacion, dia) => {
                          if (asignacion.rangoPorDia && asignacion.rangoPorDia[dia]) {
                            return asignacion.rangoPorDia[dia];
                          }
                          return { horaInicio: asignacion.horaInicio, horaFin: asignacion.horaFin };
                        };

                        // Organizar asignaciones por día
                        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
                        const horarioPorDia = {};
                        
                        diasSemana.forEach(dia => {
                          horarioPorDia[dia] = [];
                        });

                        asignacionesResumen.forEach(asignacion => {
                          if (asignacion && asignacion.dias) {
                            asignacion.dias.forEach(dia => {
                              if (horarioPorDia[dia]) {
                                horarioPorDia[dia].push(asignacion);
                              }
                            });
                          }
                        });

                        return Object.entries(horarioPorDia).map(([dia, asignacionesDia]) => (
                          <div key={dia} className={`dia-container ${asignacionesDia.length > 0 ? 'con-clases' : 'sin-clases'}`}>
                            <div className="dia-titulo">{dia}</div>
                            <div className="dia-contenido">
                              {asignacionesDia.length > 0 ? (
                                asignacionesDia
                                  .sort((a, b) => getHorarioPorDia(a, dia).horaInicio.localeCompare(getHorarioPorDia(b, dia).horaInicio))
                                  .map((asignacion, index) => {
                                    const horarioDia = getHorarioPorDia(asignacion, dia);
                                    return (
                                    <div key={index} className="clase-item">
                                      <span className="materia-nombre">{asignacion.Materia?.nombre}</span>
                                      <span className="docente-nombre">
                                        {asignacion.Docente ? 
                                          `${asignacion.Docente.primer_nombre} ${asignacion.Docente.primer_apellido}` 
                                          : 'Sin docente'
                                        }
                                      </span>
                                      <span className="horario-time">{horarioDia.horaInicio} - {horarioDia.horaFin}</span>
                                    </div>
                                  )})
                              ) : (
                                <span className="sin-clases-texto">Sin clases</span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle"></i>
                    <span className="ms-2">Este estudiante no tiene materias inscritas en el período académico actual.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal de datos del estudiante */}
          {isModalOpen && (
            <VerDatosEstudiante
              onCancel={handleCloseModal}
              isLoading={isLoading}
              entity={estudianteSeleccionado}
              onUpdated={handleUpdatedEstudiante}
            />
          )}
        </div>
      </Layout>
    </div>
  )
}

export default ListaEstudiantes; 
