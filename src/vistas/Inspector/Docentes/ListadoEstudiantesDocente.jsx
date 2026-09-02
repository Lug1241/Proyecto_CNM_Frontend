import React, { useEffect, useState } from "react";
import axios from "axios";
import HeaderTabla from "../../../components/HeaderTabla";
import Tabla from "../../../components/Tabla";

function ListadoEstudiantesDocente({ datosTarjeta, onBack }) {
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState([]);
  
  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;

  // Función para formatear el horario como texto plano (Ideal para la tabla y el futuro PDF)
  const formatHorarioString = (curso) => {
    if (!curso.dias || !curso.horaInicio || !curso.horaFin) return 'Horario no definido';
    if (curso.tipo?.toLowerCase() === 'individual' && Array.isArray(curso.dias) && curso.dias.length === 2 && curso.hora1 && curso.hora2) {
      return `${curso.dias[0]} de ${curso.horaInicio} a ${curso.horaFin} | ${curso.dias[1]} de ${curso.hora1} a ${curso.hora2}`;
    }
    const diasStr = Array.isArray(curso.dias) ? curso.dias.join(', ') : curso.dias;
    return `${diasStr} de ${curso.horaInicio} a ${curso.horaFin}`;
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchEstudiantes = async () => {
      try {
        setLoading(true);
        // Hacemos un Promise.all para buscar los estudiantes de TODAS las asignaciones de esta tarjeta
        const promesas = datosTarjeta.asignaciones.map(asig => 
          axios.get(`${API_URL}/inscripcion/asignacion/${asig.ID}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        
        const resultados = await Promise.all(promesas);
        
        let estudiantesCombinados = [];
        
        // Iteramos sobre las respuestas y le inyectamos a cada estudiante su horario respectivo
        resultados.forEach((res, index) => {
          const asignacionOrigen = datosTarjeta.asignaciones[index];
          const listaEstudiantes = res.data || []; // Ajusta según cómo devuelve tu API
          
          listaEstudiantes.forEach(est => {
            estudiantesCombinados.push({
              ...est,
              Horario: formatHorarioString(asignacionOrigen) // Inyectamos el horario
            });
          });
        });

        // Opcional: Ordenar alfabéticamente por si se mezclaron individuales
        estudiantesCombinados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        if (mounted) {
          setEstudiantes(estudiantesCombinados);
        }
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (datosTarjeta?.asignaciones?.length > 0) {
      fetchEstudiantes();
    }

    return () => { mounted = false; };
  }, [datosTarjeta, API_URL, token]);

  // Si es Individual agregamos la columna "Horario"
  const columnas = datosTarjeta.tipo === 'Individual' ? ["Horario"] : [];

  const tablaFormateada = estudiantes.map((e, index) => {
    const fila = {
      "Nro": index + 1, // Recalculamos el Nro porque combinamos listas
      "Nómina de Estudiantes": e.nombre || `${e.apellidos} ${e.nombres}` // Ajusta al campo real de tu BD
    };
    if (datosTarjeta.tipo === 'Individual') {
      fila["Horario"] = e.Horario;
    }
    return fila;
  });

  // Configuración del HeaderTabla dependiendo del tipo de curso
  const getDatosEncabezado = () => {
    const infoBasica = {
      "Profesor": datosTarjeta.docente,
      "Asignatura": datosTarjeta.materia,
      "Año Lectivo": datosTarjeta.descripcionPeriodo,
      "Nivel": datosTarjeta.nivel || "N/A"
    };

    if (datosTarjeta.tipo === 'Grupal') {
      const asigUnica = datosTarjeta.asignaciones[0];
      infoBasica["Paralelo"] = asigUnica.paralelo;
      infoBasica["Horario"] = formatHorarioString(asigUnica);
    }

    return {
      titulo: "CONSERVATORIO NACIONAL DE MÚSICA",
      subtitulo: "LISTADO DE ESTUDIANTES",
      info: infoBasica
    };
  };

  return (
    <div className="d-flex flex-column h-100 bg-white border rounded shadow-sm p-4">
      {/* Barra superior con Regresar y Exportar */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <button
          className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3"
          style={{ whiteSpace: 'nowrap', width: 'fit-content' }}
          onClick={onBack}
        >
          <i className="bi bi-arrow-left-circle-fill"></i> Regresar a cursos
        </button>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted fw-bold" style={{ fontSize: '14px' }}>Exportaciones:</span>
          <button
            className="btn btn-success btn-sm"
            onClick={() => console.log("Exportar Excel Pendiente")}
            title="Exportar a Excel"
          >
            <i className="bi bi-file-earmark-excel-fill"></i> Exportar Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center flex-grow-1">
          <span className="text-muted">Cargando listado de estudiantes...</span>
        </div>
      ) : (
        <div className="flex-grow-1 overflow-auto">
          <HeaderTabla
            datosEncabezado={getDatosEncabezado()}
            imagenIzquierda={"/ConservatorioNacional.png"}
          />

          <Tabla
            columnas={columnas}
            columnasAgrupadas={null}
            datos={tablaFormateada}
            mostrarEditar={false}
            mostrarGuardar={false}
            clasePersonalizada="tabla-listado mt-3"
            soloLectura={true}
            encabezadosVerticales={false} // Aseguramos que los encabezados sean verticales
          />
        </div>
      )}
    </div>
  );
}

export default ListadoEstudiantesDocente;