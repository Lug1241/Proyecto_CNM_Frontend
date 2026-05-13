// Modal para desplegar calificaciobes de un estudiante
import TablaEstudianteCalificaciones from "../components/Tabla_EstudianteCalificaciones";
import Boton from "../../../components/Boton";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Loading from "../../../components/Loading";
import { useEffect, useState } from "react";
import { Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { modulosRepresentante } from "../components/ModulosRepresentante";
import './VerCalificacionesEstudiante.css';
import { useAuth } from '../../../Utils/useAuth';
import { ErrorMessage } from '../../../Utils/ErrorMesaje';

const VerCalificacionesEstudiante = () => {
  // Protección de ruta para Representante
  const auth = useAuth("representante");
  
  // Si no está autenticado, mostrar mensaje de error
  if (!auth.isAuthenticated) {
    return <ErrorMessage message="No tienes permisos para acceder a esta página" />;
  }

  const [notasEstudiante, setNotasEstudiante] = useState([]);
  const [loading, setLoading] = useState(true);
  const { state } = useLocation();
  const {estudiante, respuestaPeriodosDatos: periodosMatriculados} = state || {};
  const navigate = useNavigate();
  
  // Estado para el periodo elegido
  const [periodoSel, setPeriodoSel] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  
  // ✅ Verificación de autenticación
  const [usuario, setUsuario] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    if (!parsedUser) {
      navigate("/");
      return;
    }
    
    setUsuario(parsedUser);
    setLoading(false);
  }, [navigate]);

  console.log("Datos usuario localStorage: ", usuario);
  console.log("Datos estudiante que llegan en state: ", estudiante);
  const handleCalificaciones = async (matriculaID) => {
    // Encontrar el período seleccionado por su ID
    const periodoEncontrado = periodosMatriculados.find(periodo => periodo.ID === matriculaID);
    setPeriodoSeleccionado(periodoEncontrado);
    
    // Obtener las inscripciones de un estudiante por ID de matricula
    try {
      const token = localStorage.getItem("token");
      const baseURL = import.meta.env.VITE_URL_DEL_BACKEND;
      const headers = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

      // Obtiene las inscripciones
      const { data: respuestaInscripciones } = await axios.get(
        `${baseURL}/inscripcion/obtener/matricula/${matriculaID}`, 
        headers
      ); 

      // Obtener los datos necesarios de inscripciones
      const inscripciones = respuestaInscripciones.map(inscripcion => {
        return {
          ID_inscripcion: inscripcion.ID,
          ID_asignacion: inscripcion.ID_asignacion,
          nombreMateria: inscripcion.Asignacion.Materia.nombre,
          nivel: inscripcion.Matricula.nivel
        };
      })
      
      // Obtener calificaciones parciales, quimestrales y finales de una materia
      // mediante peticiones a endpoints
      const notas = await Promise.all(
        inscripciones.map(async inscripcion => {
          try {
            const esBasicoElemental = 
              inscripcion.nivel.includes('Básico Elemental') ||
              inscripcion.nivel.includes('BE');
              
            // Obtener parciales
            const endpointParciales = esBasicoElemental
              ? `/parcialesbe/inscripcion/${inscripcion.ID_inscripcion}`
              : `/parciales/inscripcion/${inscripcion.ID_inscripcion}`;
  
            const { data: parciales } = await axios.get(`${baseURL}${endpointParciales}`, headers);

            // Obtener quimestrales
            const endpointQuimestrales = esBasicoElemental
              ? `/quimestralesbe/asignacion/${inscripcion.ID_asignacion}`
              : `/quimestrales/asignacion/${inscripcion.ID_asignacion}`;
              
            let quimestrales = [];
            try {
              const { data: quiData } = await axios.get(`${baseURL}${endpointQuimestrales}`, headers);
              // Filtrar solo las calificaciones de este estudiante
              quimestrales = quiData.filter(q => q.idInscripcion === inscripcion.ID_inscripcion);
            } catch (error) {
              console.log(`No hay datos quimestrales para ${inscripcion.nombreMateria}`);
            }

            // Obtener finales (solo para niveles normales)
            let finales = [];
            if (!esBasicoElemental) {
              try {
                const { data: finalesData } = await axios.get(`${baseURL}/finales/asignacion/${inscripcion.ID_asignacion}`, headers);
                // Filtrar solo las calificaciones de este estudiante
                finales = finalesData.filter(f => f.idInscripcion === inscripcion.ID_inscripcion);
              } catch (error) {
                console.log(`No hay datos finales para ${inscripcion.nombreMateria}`);
              }
            }

            setPeriodoSel(true);
            
            // Devolver un objeto con información completa
            return {
              ID_inscripcion: inscripcion.ID_inscripcion,
              ID_asignacion: inscripcion.ID_asignacion,
              nombreMateria: inscripcion.nombreMateria,
              nivel: inscripcion.nivel,
              calificaciones: parciales,
              quimestrales: quimestrales,
              finales: finales,
              esBasicoElemental: esBasicoElemental
            };
          } catch (error) {
            console.error(`Error al obtener notas para ${inscripcion.nombreMateria}:`, error);
            // Devolver objeto con información de error
            return {
              ID_asignacion: inscripcion.ID_asignacion,
              nombreMateria: inscripcion.nombreMateria,
              nivel: inscripcion.nivel,
              error: true,
              mensaje: error.message
            };
          }
        })
      ); 

      // Procesar resultados
      const resultadosCompletos = notas.filter(nota => !nota.error);
      const resultadosConError = notas.filter(nota => nota.error);

      if (resultadosConError.length > 0) {
        console.log('Materias con error:', resultadosConError);
      }

      setNotasEstudiante(resultadosCompletos);


      
    } catch (error) {
      console.log("Error al obtener las calificaciones del estudiante: ", error);
      throw error; // Propagar el error para manejarlo en el componente padre
    }
    
    
  }

	const handleOnClick = () => {
		navigate('/representante/estudiantes'); // Usa el navigate ya definido
	}


  return (
    <div className="section-container">
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>

      <Layout modules={modulosRepresentante} activeModule={2}>
        <div className="vista-calificaciones">
          {loading ? (
            <Loading />
          ) : (
            <>
              {/* Título, selector y botón en la misma línea */}
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap" style={{ gap: '15px' }}>
                <h3 className="mb-0">Calificaciones de {estudiante?.primer_nombre} {estudiante?.primer_apellido}</h3>
                
                <div className="d-flex align-items-center" style={{ gap: '15px' }}>
                  {/* Selector de periodo académico */}
                  <Dropdown>
                    <Dropdown.Toggle variant="secondary" id="dropdown-basic" size="sm">
                      {periodoSeleccionado ? periodoSeleccionado.descripcion : "Seleccione un periodo académico"}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {periodosMatriculados && periodosMatriculados.length > 0 ? (
                        periodosMatriculados.map((periodo, i) => (
                          <Dropdown.Item 
                            key={i} 
                            onClick={() => handleCalificaciones(periodo.ID)}
                          > 
                            {periodo.descripcion} 
                          </Dropdown.Item>
                        ))
                      ) : (
                        <Dropdown.Item href="#"> No hay períodos matriculados </Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                  
                  {/* Botón para volver a lista de estudiantes */}
                  <Boton 
                    texto="Volver a lista" 
                    onClick={() => handleOnClick()} 
                    estilo="boton-crear" 
                  />
                </div>
              </div>

              {/* Renderizado condicional de la tabla de calificaciones o mensaje inicial */}
              {periodoSel ? (
                <div className="tabla-calificaciones">
                  <TablaEstudianteCalificaciones 
                    datos={notasEstudiante} 
                    estudiante={estudiante} 
                    periodosMatriculados={periodosMatriculados}
                  />
                </div>
              ) : (
                <div className="mensaje-inicial">
                  <div className="alert alert-info text-center">
                    <i className="bi bi-info-circle me-2" style={{ fontSize: '1.2rem' }}></i>
                    <strong>Seleccione un período académico</strong>
                    <p className="mb-0 mt-2">
                      Para visualizar las calificaciones de <strong>{estudiante?.primer_nombre} {estudiante?.primer_apellido}</strong>, 
                      por favor seleccione un período académico del menú desplegable superior.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </div>
  );
}

export default VerCalificacionesEstudiante;
