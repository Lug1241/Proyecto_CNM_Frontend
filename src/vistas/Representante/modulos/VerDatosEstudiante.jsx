import React, { useEffect } from 'react';
import Boton from '../../../components/Boton';
import Loading from '../../../components/Loading';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import "../Styles/VerDatosRepresentante.css";
import { useAuth } from '../../../Utils/useAuth';
import { ErrorMessage } from '../../../Utils/ErrorMesaje';
import FileUploader from '../../../vistas/components/FileUploader.jsx';
function ViewDataEstudiante({ onCancel, isLoading, entity, onUpdated }) {
  // Protección de ruta para Representante (solo si se usa como página standalone)

  useEffect(() => {
    cargarFechasActualizacionDatos();
  }, []);

  useEffect(() => {
    if (entity) {
      setNroCedula(entity.nroCedula || ""); // Set cadena vacia en caso de que haya un dato undefined
      setPrimerNombre(entity.primer_nombre || "");
      setPrimerApellido(entity.primer_apellido || "");
      setSegundoNombre(entity.segundo_nombre || "");
      setSegundoApellido(entity.segundo_apellido || "");
      setNivel(entity.nivel || "");
      setGenero(entity.genero || "");
      setJornada(entity.jornada || "");
      setFechaNacimiento(toISO(entity.fecha_nacimiento));
      setGrupoEtnico(entity.grupo_etnico || "");
      setEspecialidad(entity.especialidad || "");
      setIER(entity.IER || "");
      setNroCedulaRepresentante(entity.nroCedula_representante || "");
      setDireccion(entity.direccion || "");

    }
  }, [entity]);
  const [nroCedula, setNroCedula] = useState(""); // Inicializar con cadena vacia si es que hay valores undefined en entity
  const [primer_nombre, setPrimerNombre] = useState("");
  const [primer_apellido, setPrimerApellido] = useState("");
  const [segundo_nombre, setSegundoNombre] = useState("");
  const [segundo_apellido, setSegundoApellido] = useState("");
  const [nivel, setNivel] = useState("");
  const [genero, setGenero] = useState("");
  const [anioMatricula, setAnioMatricula] = useState("");
  const [jornada, setJornada] = useState("");
  const [fecha_nacimiento, setFechaNacimiento] = useState("");
  const [grupo_etnico, setGrupoEtnico] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [IER, setIER] = useState("");
  // matricula IER PDF --->
  const [nroCedula_representante, setNroCedulaRepresentante] = useState("");
  const [direccion, setDireccion] = useState("");

  // Variables para la actualizacion de datos segun las fechas establecidas 
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [dentroDeRango, setDentroDeRango] = useState(false);

  // Estados para errores de validación
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Estado para manejar archivos
  const [files, setFiles] = useState({
    copiaCedula: null,
    matricula_IER: null
  });

  /* 
    OJO FALTA COMPROBAR EL FUNCIONAMIENTO CON LOS ARCHIVOS PDFS SUBIDOS
  */
  const auth = useAuth("representante");

  // Si no está autenticado y no hay props de modal, mostrar mensaje de error
  if (!auth.isAuthenticated && !onCancel) {
    return <ErrorMessage message="No tienes permisos para acceder a esta página" />;
  }
  if (isLoading) {
    <Loading></Loading>
  }

  const cargarFechasActualizacionDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_URL_DEL_BACKEND;
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      // Solo este endpoint es necesario para habilitar/bloquear
      const { data } = await axios.get(`${baseURL}/fechas_procesos/actualizacion`, headers);

      const { procesoActivo, fechaInicioProceso, fechaFinProceso } = data || {};

      setFechaInicio(fechaInicioProceso || null);
      setFechaFin(fechaFinProceso || null);
      setDentroDeRango(!!procesoActivo);
    } catch (error) {
      console.log('Error al obtener las fechas de actualizacion de datos', error);
      setDentroDeRango(false);
      setFechaInicio(null);
      setFechaFin(null);
    }
  };




  // --- MISMA FILE: ViewDataEstudiante.jsx ---
  const ESPECIALIDADES = [
    "Flauta Traversa", "Oboe", "Clarinete", "Saxofón", "Fagot", "Corno Francés",
    "Trompeta", "Trombón", "Percusión", "Canto", "Piano", "Guitarra",
    "Arpa Diatónica", "Violín", "Viola", "Violoncello", "Contrabajo",
  ];

  const handleSubmit = async () => {
    // Validar que la actualización esté dentro de fechas
    if (!dentroDeRango) {
      Swal.fire({
        icon: 'warning',
        title: 'Fuera de fecha',
        text: 'No se pueden actualizar datos fuera del rango de fechas establecido.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Validar formulario
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: 'Por favor, complete todos los campos obligatorios correctamente.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Preparar datos para envío
      const formData = new FormData();
      formData.append('nroCedula', nroCedula);
      formData.append('primer_nombre', primer_nombre);
      formData.append('primer_apellido', primer_apellido);
      formData.append('segundo_nombre', segundo_nombre);
      formData.append('segundo_apellido', segundo_apellido);
      formData.append('genero', genero);
      formData.append('jornada', jornada);
      formData.append('fecha_nacimiento', fecha_nacimiento);
      formData.append('grupo_etnico', grupo_etnico);
      formData.append('especialidad', especialidad);
      formData.append('IER', IER);
      formData.append('direccion', direccion);

      // Agregar archivos si existen
      if (files.copiaCedula) {
        formData.append('copiaCedula', files.copiaCedula);
      }
      if (files.matricula_IER) {
        formData.append('matricula_IER', files.matricula_IER);
      }

      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_URL_DEL_BACKEND;

      const { data: actualizado } = await axios.put(
        `${baseURL}/estudiante/editar/${entity.ID}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // ✅ Avisar al padre
      if (onUpdated) onUpdated(actualizado);

      Swal.fire({
        icon: 'success',
        title: 'Actualización exitosa',
        text: 'Los datos del estudiante han sido actualizados correctamente.',
        confirmButtonColor: '#3085d6',
      });

      onCancel(); // Cerrar modal
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al actualizar los datos. Inténtelo nuevamente.',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Función de validación
  const validateForm = () => {
    const newErrors = {};

    // Validar cédula (entre 7 y 10 dígitos)
    if (!nroCedula) {
      newErrors.nroCedula = 'La cédula es obligatoria';
    } else if (!/^\d{7,10}$/.test(nroCedula)) {
      newErrors.nroCedula = 'La cédula debe tener entre 7 y 10 dígitos';
    }

    // Validar nombres (solo letras y espacios)
    if (!primer_nombre) {
      newErrors.primer_nombre = 'El primer nombre es obligatorio';
    } else if (!validarNombre(primer_nombre)) {
      newErrors.primer_nombre = 'Solo se permiten letras, tildes y diéresis';
    }

    if (!primer_apellido) {
      newErrors.primer_apellido = 'El primer apellido es obligatorio';
    } else if (!validarNombre(primer_apellido)) {
      newErrors.primer_apellido = 'Solo se permiten letras, tildes y diéresis';
    }

    // Segundo nombre y apellido (opcionales pero si tienen valor, validar)
    if (segundo_nombre && !validarNombre(segundo_nombre)) {
      newErrors.segundo_nombre = 'Solo se permiten letras, tildes y diéresis';
    }

    if (segundo_apellido && !validarNombre(segundo_apellido)) {
      newErrors.segundo_apellido = 'Solo se permiten letras, tildes y diéresis';
    }

    // Validar fecha de nacimiento
    if (!fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    }

    // Validar campos obligatorios
    if (!genero) newErrors.genero = 'El género es obligatorio';
    if (!grupo_etnico) newErrors.grupo_etnico = 'El grupo étnico es obligatorio';
    if (!direccion) newErrors.direccion = 'La dirección es obligatoria';
    if (!jornada) newErrors.jornada = 'La jornada es obligatoria';
    if (!especialidad) newErrors.especialidad = 'La especialidad es obligatoria';
    if (!IER) newErrors.IER = 'El IER es obligatorio';

    return newErrors;
  };

  // Función para validar nombres (solo letras, tildes, diéresis)
  const validarNombre = (nombre) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜïÏñÑ]+(\s[a-zA-ZáéíóúÁÉÍÓÚüÜïÏñÑ]+)*$/;
    return regex.test(nombre.trim()) && nombre === nombre.trim();
  };

  // Funciones para manejar cambios en los inputs
  const handleCedulaChange = (value) => {
    // Solo permitir números y entre 7-10 caracteres
    const soloNumeros = value.replace(/[^0-9]/g, '').substring(0, 10);
    setNroCedula(soloNumeros);
    limpiarError('nroCedula');
  };

  const handleNombreChange = (value, setter) => {
    // Remover caracteres especiales excepto letras, tildes, diéresis y espacios
    const valorLimpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜïÏñÑ\s]/g, '');
    setter(valorLimpio);
  };

  const handleDireccionChange = (value) => {
    // Permitir letras, números, espacios, tildes y guión medio, pero no caracteres especiales como #, $, @, etc.
    const valorLimpio = value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜïÏñÑ\s\-.,]/g, '');
    setDireccion(valorLimpio);
    limpiarError('direccion');
  };

  const handleIERChange = (value) => {
    // Permitir letras, números y espacios, pero no caracteres especiales
    const valorLimpio = value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜïÏñÑ\s]/g, '');
    setIER(valorLimpio);
    limpiarError('IER');
  };

  // Manejo de archivos
  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    const file = selectedFiles[0];

    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        Swal.fire({
          icon: 'error',
          title: 'Formato no válido',
          text: 'Solo se permiten archivos PDF.',
          confirmButtonColor: '#3085d6',
        });
        event.target.value = '';
        return;
      }

      // Validar tamaño máximo de 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'El archivo no puede superar los 5MB.',
          confirmButtonColor: '#3085d6',
        });
        event.target.value = '';
        return;
      }
    }

    setFiles((prevState) => ({
      ...prevState,
      [name]: file,
    }));
  };

  // Limpiar errores cuando el usuario empiece a escribir
  const limpiarError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    const fecha = new Date(`${fechaIso}T00:00:00`); // evita desfase por zona horaria
    return fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // dd/mm/yyyy -> yyyy-mm-dd  (para el <input type="date"> y para el backend)
  const toISO = (v) => {
    if (!v) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      const [d, m, y] = v.split("/");
      return `${y}-${m}-${d}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  };

  // yyyy-mm-dd -> dd/mm/yyyy (solo para mostrar)
  const toDDMMYYYY = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-representante">
        <h2 className="modal-title">Información completa de {`${primer_nombre} ${primer_apellido}`}</h2>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="modal-form">
          <div className='rows'>
            <div className="form-group">
              <label htmlFor="nroCedula">Número de cédula: *</label>
              <input
                id="nroCedula"
                value={nroCedula}
                onChange={(e) => handleCedulaChange(e.target.value)}
                placeholder="Ingrese un número de cédula (7-10 dígitos)"
                maxLength="10"
                disabled={!dentroDeRango}
                className={errors.nroCedula ? 'input-error' : ''}
              />
              {errors.nroCedula && <span className="error-text">{errors.nroCedula}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="nivel">Nivel:</label>
              <input
                id="nivel"
                value={nivel}
                disabled={true}
                className="disabled-field"
                placeholder="Campo bloqueado"
              />
            </div>
          </div>

          <div className='rows'>
            <div className="form-group">
              <label htmlFor="primer_nombre">Primer nombre: *</label>
              <input
                id="primer_nombre"
                value={primer_nombre}
                onChange={(e) => {
                  handleNombreChange(e.target.value, setPrimerNombre);
                  limpiarError('primer_nombre');
                }}
                placeholder="Ingrese primer nombre (solo letras)"
                maxLength="50"
                disabled={!dentroDeRango}
                className={errors.primer_nombre ? 'input-error' : ''}
              />
              {errors.primer_nombre && <span className="error-text">{errors.primer_nombre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="primer_apellido">Primer apellido: *</label>
              <input
                id="primer_apellido"
                value={primer_apellido}
                onChange={(e) => {
                  handleNombreChange(e.target.value, setPrimerApellido);
                  limpiarError('primer_apellido');
                }}
                placeholder="Ingrese primer apellido (solo letras)"
                maxLength="50"
                disabled={!dentroDeRango}
                className={errors.primer_apellido ? 'input-error' : ''}
              />
              {errors.primer_apellido && <span className="error-text">{errors.primer_apellido}</span>}
            </div>
          </div>

          <div className='rows'>
            <div className="form-group">
              <label htmlFor="segundo_nombre">Segundo nombre:</label>
              <input
                id="segundo_nombre"
                value={segundo_nombre}
                onChange={(e) => {
                  handleNombreChange(e.target.value, setSegundoNombre);
                  limpiarError('segundo_nombre');
                }}
                placeholder="Ingrese segundo nombre (solo letras)"
                maxLength="50"
                disabled={!dentroDeRango}
                className={errors.segundo_nombre ? 'input-error' : ''}
              />
              {errors.segundo_nombre && <span className="error-text">{errors.segundo_nombre}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="segundo_apellido">Segundo apellido:</label>
              <input
                id="segundo_apellido"
                value={segundo_apellido}
                onChange={(e) => {
                  handleNombreChange(e.target.value, setSegundoApellido);
                  limpiarError('segundo_apellido');
                }}
                placeholder="Ingrese segundo apellido (solo letras)"
                maxLength="50"
                disabled={!dentroDeRango}
                className={errors.segundo_apellido ? 'input-error' : ''}
              />
              {errors.segundo_apellido && <span className="error-text">{errors.segundo_apellido}</span>}
            </div>
          </div>

          <div className='rows'>
            <div className="form-group">
              <label htmlFor="fecha_nacimiento">Fecha de nacimiento: *</label>
              <input
                type="date"
                id="fecha_nacimiento"
                value={fecha_nacimiento}                 // yyyy-mm-dd
                onChange={(e) => {
                  setFechaNacimiento(e.target.value);   // el datepicker devuelve yyyy-mm-dd
                  limpiarError('fecha_nacimiento');
                }}
                disabled={!dentroDeRango}
                className={errors.fecha_nacimiento ? 'input-error' : ''}
              />
              {errors.fecha_nacimiento && <span className="error-text">{errors.fecha_nacimiento}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="genero">Género: *</label>
              <select
                id="genero"
                value={genero}
                onChange={(e) => {
                  setGenero(e.target.value);
                  limpiarError('genero');
                }}
                disabled={!dentroDeRango}
                className={errors.genero ? 'input-error' : ''}
              >
                <option value="">Seleccione género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
              {errors.genero && <span className="error-text">{errors.genero}</span>}
            </div>
          </div>

          <div className='rows'>
            <div className="form-group">
              <label htmlFor="grupo_etnico">Grupo étnico: *</label>
              <select
                id="grupo_etnico"
                value={grupo_etnico}
                onChange={(e) => {
                  setGrupoEtnico(e.target.value);
                  limpiarError('grupo_etnico');
                }}
                disabled={!dentroDeRango}
                className={errors.grupo_etnico ? 'input-error' : ''}
              >
                <option value="">Seleccione grupo étnico</option>
                <option value="Indígena">Indígena</option>
                <option value="Mestizo">Mestizo</option>
                <option value="Afro-descendiente">Afro-descendiente</option>
                <option value="Negro">Negro</option>
                <option value="Blanco">Blanco</option>
              </select>
              {errors.grupo_etnico && <span className="error-text">{errors.grupo_etnico}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="direccion">Dirección: *</label>
              <input
                id="direccion"
                value={direccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                placeholder="Ingrese la dirección"
                maxLength="100"
                disabled={!dentroDeRango}
                className={errors.direccion ? 'input-error' : ''}
              />
              {errors.direccion && <span className="error-text">{errors.direccion}</span>}
            </div>
          </div>

          <div className='rows'>
            <div className="form-group">
              <label htmlFor="especialidad">Especialidad: *</label>
              <select
                id="especialidad"
                value={especialidad}
                onChange={(e) => { setEspecialidad(e.target.value); limpiarError('especialidad'); }}
                disabled={!dentroDeRango}
                className={errors.especialidad ? 'input-error' : ''}
              >
                <option value="">Seleccione especialidad</option>

                {ESPECIALIDADES.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}

                {/* Por si llega un valor guardado que no esté en la lista */}
                {especialidad && !ESPECIALIDADES.includes(especialidad) && (
                  <option value={especialidad}>{especialidad}</option>
                )}
              </select>

              {errors.especialidad && <span className="error-text">{errors.especialidad}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="jornada">Jornada: *</label>
              <select
                id="jornada"
                value={jornada}
                onChange={(e) => {
                  setJornada(e.target.value);
                  limpiarError('jornada');
                }}
                disabled={!dentroDeRango}
                className={errors.jornada ? 'input-error' : ''}
              >
                <option value="">Seleccione jornada</option>
                <option value="Matutina">Matutina</option>
                <option value="Vespertina">Vespertina</option>
              </select>
              {errors.jornada && <span className="error-text">{errors.jornada}</span>}
            </div>
          </div>

          <div className='rows'>
            <div className="form-group">
              <label htmlFor="IER">IER: *</label>
              <input
                id="IER"
                value={IER}
                onChange={(e) => handleIERChange(e.target.value)}
                placeholder="Ingrese el IER (letras y números)"
                maxLength="20"
                disabled={!dentroDeRango}
                className={errors.IER ? 'input-error' : ''}
              />
              {errors.IER && <span className="error-text">{errors.IER}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="nroCedula_representante"># de cédula representante:</label>
              <input
                id="nroCedula_representante"
                value={nroCedula_representante}
                disabled={true}
                className="disabled-field"
                placeholder="Campo bloqueado"
              />
            </div>
          </div>

          <div className='file-upload-container'>
            <FileUploader
              label="Copia de Cédula Estudiante:"
              name="copiaCedula"
              currentFilePath={entity?.cedula_PDF} // <-- La ruta que te devuelve el backend
              onChange={handleFileChange}
              disabled={!dentroDeRango}
              error={errors.copiaCedula}
            />

            {/* <FileUploader
              label="Matrícula Institución de Educación Regular:"
              name="matricula_IER"
              currentFilePath={entity?.matricula_IER_PDF} // <-- Asumiendo que así se llame tu campo en la BD
              onChange={handleFileChange}
              disabled={true} // hay que volver a !dentroDeRango despues de la prueba
              error={errors.matricula_IER}
            /> */}
          </div>

          {!dentroDeRango && (
            <div className="alert-container">
              <p className="alert-text">
                No se pueden actualizar datos fuera de fecha.
              </p>
              <p className="alert-text">
                Fecha: {formatearFecha(fechaInicio)} al {formatearFecha(fechaFin)}
              </p>
            </div>
          )}

          <div className='rows-botones'>
            <div className="botones">
              <button
                type='submit'
                className='boton-crear'
                disabled={!dentroDeRango || submitting}
              >
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                className="boton-cancelar"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel();
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

}

export default ViewDataEstudiante;
