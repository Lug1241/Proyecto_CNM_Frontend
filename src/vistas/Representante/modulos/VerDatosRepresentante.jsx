import { useState } from "react";
import axios from "axios";
import ViewData from "../../Admin/Modules/Estudiantil/Estudiantes/ViewData";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Boton from "../../../components/Boton";
import Loading from "../../../components/Loading";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { modulosRepresentante } from "../components/ModulosRepresentante";
import "../Styles/VerDatosRepresentante.css";
import Swal from 'sweetalert2';
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import { useAuth } from '../../../Utils/useAuth';
import FileUploader from '../../../vistas/components/FileUploader.jsx';

const VerDatosRepresentante = () => {
  // Protección de ruta para Representante
  const auth = useAuth("representante");

  // Si no está autenticado, mostrar mensaje de error
  if (!auth.isAuthenticated) {
    return <ErrorMessage message="No tienes permisos para acceder a esta página" />;
  }

  const [representante, setRepresentante] = useState([]);
  const location = useLocation();
  const [mostrarModal, setMostrarModal] = useState(false); // Cambiar a false para no mostrar el modal inicialmente
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [nroCedula, setNroCedula] = useState(""); // Inicializar con cadena vacia si es que hay valores undefined 
  const [primer_nombre, setPrimerNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [primer_apellido, setPrimerApellido] = useState("");
  const [segundo_nombre, setSegundoNombre] = useState("");
  const [segundo_apellido, setSegundoApellido] = useState("");
  const [convencional, setConvencional] = useState("");
  const [emergencia, setEmergencia] = useState("");
  const [email, setEmail] = useState("");

  // Estado para manejar archivos
  const [files, setFiles] = useState({
    croquis: null,
    copiaCedula: null
  });

  // Variables para habilitar o deshabilitar la actualizacion de datos
  const [dentroDeRango, setDentroDeRango] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Estados para errores de validación
  const [errors, setErrors] = useState({});

  /*
    OJO FALTA COMPROBAR EL FUNCIONAMIENTO CON LOS ARCHIVOS PDFS SUBIDOS
  */

  if (isLoading) {
    <Loading></Loading>
  }

  useEffect(() => {
    if (representante) {
      setNroCedula(representante.nroCedula || ""); // Set cadena vacia en caso de que haya un dato undefined
      setPrimerNombre(representante.primer_nombre || "");
      setCelular(representante.celular || "");
      setPrimerApellido(representante.primer_apellido || "");
      setSegundoNombre(representante.segundo_nombre || "");
      setSegundoApellido(representante.segundo_apellido || "");
      setConvencional(representante.convencional || "");
      setEmergencia(representante.emergencia || "");
      setEmail(representante.email || "");
      // Falta cedulaPDF y croquisPDF
    }
  }, [representante]);


  const cargarDatosRepresentante = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const baseURL = import.meta.env.VITE_URL_DEL_BACKEND;
      const headers = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // 1. Saber quién es el usuario desde el localStorage
      const usuarioGuardado = localStorage.getItem("usuario");
      let idRepresentante = null;

      if (usuarioGuardado) {
        const userCache = JSON.parse(usuarioGuardado);
        setRepresentante(userCache); // Lo ponemos temporalmente para que la pantalla no se vea vacía
        idRepresentante = userCache.nroCedula; // O el campo que uses como ID (ej. userCache.ID)
      }

      // 2. 👇 AQUÍ ESTÁ LA MAGIA: Traer los datos FRESCOS de la base de datos
      if (idRepresentante) {
        try {
            // Asegúrate de que esta ruta coincida con tu endpoint del backend para obtener 1 representante
            const { data: representanteFresco } = await axios.get(`${baseURL}/representante/obtener/${idRepresentante}`, headers);
            
            setRepresentante(representanteFresco); // 👈 Ahora sí, React tiene las rutas de los PDF actualizadas
            
            // Opcional: Actualizamos la "foto" del localStorage por si acaso
            localStorage.setItem("usuario", JSON.stringify(representanteFresco));
        } catch (error) {
            console.error("No se pudo obtener la info fresca de la BD:", error);
        }
      }

      // 3. Obtener la fecha actual del servidor (Tu código original)
      const { data: response } = await axios.get(`${baseURL}/fechas_procesos/fecha_actual`, headers);
      
      // ... El resto de tu código de las fechas (procesoActivo, etc.) sigue igualito abajo ...
      const { data: fechaActualizacionDatos } = await axios.get(
        `${baseURL}/fechas_procesos/actualizacion`,
        headers
      );

      const { procesoActivo, fechaInicioProceso, fechaFinProceso } = fechaActualizacionDatos;

      setFechaInicio(fechaInicioProceso);
      setFechaFin(fechaFinProceso);
      setDentroDeRango(procesoActivo);

    } catch (error) {
      console.error('Error al obtener datos de representante: ', error);
      setDentroDeRango(false);
    } finally {
      setIsLoading(false);
    }
  };


  const OnCancel = () => {
    // Simplemente navegar hacia atrás sin confirmaciones adicionales
    navigate(-1);
  }

  const abrirModalActualizar = () => {
    setMostrarModal(true);
  }

  const cerrarModal = () => {
    setMostrarModal(false);
  }

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
          confirmButtonColor: '#003F89',
        });
        event.target.value = ''; // Limpiar el input
        return;
      }

      // Validar tamaño máximo de 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'El archivo no puede superar los 5MB.',
          confirmButtonColor: '#003F89',
        });
        event.target.value = ''; // Limpiar el input
        return;
      }
    }

    setFiles((prevState) => ({
      ...prevState,
      [name]: file, // Solo se selecciona un archivo por input
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!dentroDeRango) {
      Swal.fire({
        icon: "warning",
        title: "Fuera de fecha",
        text: "No se pueden actualizar datos fuera del período permitido.",
        confirmButtonColor: "#003F89",
      });
      return;
    }

    // 👉 Si no hay cambios, avisar y cerrar modal
    if (noHayCambios()) {
      Swal.fire({
        icon: "info",
        title: "Sin cambios",
        text: "No realizaste modificaciones.",
        confirmButtonColor: "#003F89",
      }).then(() => {
        setMostrarModal(false); // cierra modal y regresa a la vista
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
        text: 'Por favor, corrija los errores en el formulario antes de continuar.',
        confirmButtonColor: '#003F89',
      });
      return;
    }

    setSubmitting(true);

    // Crear FormData
    const formData = new FormData();
    formData.append("copiaCedula", files.copiaCedula);
    formData.append("croquis", files.croquis);
    formData.append("nroCedula", nroCedula);
    formData.append("primer_nombre", primer_nombre);
    formData.append("primer_apellido", primer_apellido);
    formData.append("segundo_nombre", segundo_nombre);
    formData.append("segundo_apellido", segundo_apellido);
    formData.append("email", email);
    formData.append("celular", celular);
    formData.append("convencional", convencional);
    formData.append("emergencia", emergencia);

    const baseURL = import.meta.env.VITE_URL_DEL_BACKEND;
    const token = localStorage.getItem("token");

    axios
      .put(`${baseURL}/representante/editar/${nroCedula}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      })
      .then((res) => {
        setSubmitting(false);

        // Actualizar datos locales y cerrar modal SIN segunda pregunta
        const usuarioActualizado = res.data;
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        setRepresentante(usuarioActualizado);

        Swal.fire({
          icon: "success",
          title: "Datos actualizados con éxito",
          iconColor: "#218838",
          confirmButtonText: "OK",
          confirmButtonColor: "#003F89",
        }).then(() => {
          setMostrarModal(false); // cierra modal y regresa a la vista
        });
      })
      .catch((error) => {
        setSubmitting(false);
        ErrorMessage(error);
        console.log(error);
      });
  };

  // Función de validación para representante
  const validateForm = () => {
    const newErrors = {};

    // Validar documento (cédula o pasaporte)
    if (!nroCedula) {
      newErrors.nroCedula = 'El número de documento es obligatorio';
    } else if (!/^\d{7,10}$/.test(nroCedula)) {
      newErrors.nroCedula = 'El documento debe tener entre 7 y 10 dígitos';
    }

    // Validar nombres (solo letras, tildes y diéresis - sin espacios al final)
    if (!primer_nombre) {
      newErrors.primer_nombre = 'El primer nombre es obligatorio';
    } else if (!validarNombre(primer_nombre)) {
      newErrors.primer_nombre = 'Solo se permiten letras, tildes y diéresis. No se permiten espacios al final';
    }

    if (!primer_apellido) {
      newErrors.primer_apellido = 'El primer apellido es obligatorio';
    } else if (!validarNombre(primer_apellido)) {
      newErrors.primer_apellido = 'Solo se permiten letras, tildes y diéresis. No se permiten espacios al final';
    }

    // Segundo nombre y apellido (opcionales pero si tienen valor, validar)
    if (segundo_nombre && !validarNombre(segundo_nombre)) {
      newErrors.segundo_nombre = 'Solo se permiten letras, tildes y diéresis. No se permiten espacios al final';
    }

    if (segundo_apellido && !validarNombre(segundo_apellido)) {
      newErrors.segundo_apellido = 'Solo se permiten letras, tildes y diéresis. No se permiten espacios al final';
    }

    // Validar email
    if (!email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!validarEmail(email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    // Validar celular (10 dígitos, empezar con 09)
    if (!celular) {
      newErrors.celular = 'El número de celular es obligatorio';
    } else if (!/^09\d{8}$/.test(celular)) {
      newErrors.celular = 'El celular debe tener 10 dígitos y empezar con 09';
    }

    // Teléfono convencional (opcional, pero si tiene valor, validar - 9 dígitos empezando con 0)
    if (convencional && !/^0\d{8}$/.test(convencional)) {
      newErrors.convencional = 'El teléfono convencional debe tener 9 dígitos y empezar con 0';
    }

    // Teléfono de emergencia (opcional, pero si tiene valor, validar - 10 dígitos empezando con 09)
    if (emergencia && !/^09\d{8}$/.test(emergencia)) {
      newErrors.emergencia = 'El teléfono de emergencia debe tener 10 dígitos y empezar con 09';
    }

    return newErrors;
  };

  // Función para validar nombres (solo letras, tildes, diéresis - sin espacios al final)
  const validarNombre = (nombre) => {
    // Expresión regular que permite letras, tildes (áéíóú), diéresis (üï), espacios internos
    // pero no permite números, símbolos especiales, espacios al final
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜïÏñÑ]+(\s[a-zA-ZáéíóúÁÉÍÓÚüÜïÏñÑ]+)*$/;
    return regex.test(nombre.trim()) && nombre === nombre.trim();
  };

  // Función para validar email
  const validarEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  // Funciones para manejar cambios en los inputs con validación en tiempo real
  const handleCedulaChange = (value) => {
    // Solo permitir números y máximo 10 caracteres
    const soloNumeros = value.replace(/[^0-9]/g, '').substring(0, 10);
    setNroCedula(soloNumeros);
    limpiarError('nroCedula');
  };

  const handleNombreChange = (field, value, setter) => {
    // Remover caracteres especiales excepto letras, tildes, diéresis y espacios
    const valorLimpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜïÏñÑ\s]/g, '');
    setter(valorLimpio);
    limpiarError(field);
  };

  const handleCelularChange = (value) => {
    // Solo permitir números y máximo 10 caracteres
    const soloNumeros = value.replace(/[^0-9]/g, '').substring(0, 10);
    setCelular(soloNumeros);
    limpiarError('celular');
  };

  const handleConvencionalChange = (value) => {
    // Solo permitir números y máximo 9 caracteres
    const soloNumeros = value.replace(/[^0-9]/g, '').substring(0, 9);
    setConvencional(soloNumeros);
    limpiarError('convencional');
  };

  const handleEmergenciaChange = (value) => {
    // Solo permitir números y máximo 10 caracteres
    const soloNumeros = value.replace(/[^0-9]/g, '').substring(0, 10);
    setEmergencia(soloNumeros);
    limpiarError('emergencia');
  };

  const handleEmailChange = (value) => {
    // Remover espacios
    const valorSinEspacios = value.replace(/\s/g, '');
    setEmail(valorSinEspacios);
    limpiarError('email');
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

  const handleConfirmacion = () => {
  }


  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    const fecha = new Date(`${fechaIso}T00:00:00`); // evita desfase por zona horaria
    return fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Normaliza valores para comparar (evita null/undefined y espacios)
  const norm = (v) => (v ?? "").toString().trim();

  // ¿El usuario cambió algo?
  const noHayCambios = () => {
    return (
      norm(nroCedula) === norm(representante.nroCedula) &&
      norm(primer_nombre) === norm(representante.primer_nombre) &&
      norm(primer_apellido) === norm(representante.primer_apellido) &&
      norm(segundo_nombre) === norm(representante.segundo_nombre) &&
      norm(segundo_apellido) === norm(representante.segundo_apellido) &&
      norm(email) === norm(representante.email) &&
      norm(celular) === norm(representante.celular) &&
      norm(convencional) === norm(representante.convencional) &&
      norm(emergencia) === norm(representante.emergencia) &&
      !files.copiaCedula &&
      !files.croquis
    );
  };


  useEffect(() => {
    cargarDatosRepresentante();
  }, []);

  return (
    <div>
      <div className="container-fluid p-0">
        {representante && <Header isAuthenticated={true} usuario={representante} />}
      </div>

      <Layout modules={modulosRepresentante} activeModule={1}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {/* Vista principal de información del representante */}
            <div className="info-representante-container">
              <div className="card-representante">
                <div className="card-header-representante">
                  <h3 className="mb-0">Información de {`${primer_nombre} ${primer_apellido}`}</h3>
                  <div>
                    <button
                      className="btn btn-primary"
                      onClick={abrirModalActualizar}
                      disabled={!dentroDeRango}
                      title={!dentroDeRango ? "Fuera del período de actualización" : "Actualizar información"}
                    >
                      <i className="bi bi-pencil-square me-1"></i>
                      Actualizar Información
                    </button>
                  </div>
                </div>

                <div className="card-body-representante">
                  <div className="row">
                    <div className="col-md-6 campo-info">
                      <strong>Número de Cédula:</strong>
                      <p>{representante.nroCedula || 'No especificado'}</p>
                    </div>
                    <div className="col-md-6 campo-info">
                      <strong>Celular:</strong>
                      <p>{representante.celular || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 campo-info">
                      <strong>Primer Nombre:</strong>
                      <p>{representante.primer_nombre || 'No especificado'}</p>
                    </div>
                    <div className="col-md-6 campo-info">
                      <strong>Primer Apellido:</strong>
                      <p>{representante.primer_apellido || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 campo-info">
                      <strong>Segundo Nombre:</strong>
                      <p>{representante.segundo_nombre || 'No especificado'}</p>
                    </div>
                    <div className="col-md-6 campo-info">
                      <strong>Segundo Apellido:</strong>
                      <p>{representante.segundo_apellido || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 campo-info">
                      <strong>Teléfono Convencional:</strong>
                      <p>{representante.convencional || 'No especificado'}</p>
                    </div>
                    <div className="col-md-6 campo-info">
                      <strong>Teléfono de Emergencia:</strong>
                      <p>{representante.emergencia || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 campo-info">
                      <strong>Email:</strong>
                      <p>{representante.email || 'No especificado'}</p>
                    </div>
                  </div>

                  {!dentroDeRango && (
                    <div className="alert alert-warning mt-3">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Actualización no disponible:</strong> No se pueden actualizar datos fuera del período permitido.
                      <br />
                      {fechaInicio && fechaFin ? (
                        <small>
                          Período de actualización: {formatearFecha(fechaInicio)} al {formatearFecha(fechaFin)}
                        </small>
                      ) : (
                        <small>No hay un proceso de actualización activo.</small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>          {/* Modal de actualización */}
            {mostrarModal && (
              <div className="modal-overlay">
                <div className="modal-container modal-representante">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="modal-title mb-0">Actualizar información de {`${primer_nombre} ${primer_apellido}`}</h2>

                  </div>

                  <form onSubmit={(e) => handleSubmit(e)} className="modal-form">
                    <div className='rows'>
                      <div className="form-group">
                        <label htmlFor="nroCedula">Número de cédula: *</label>
                        <input
                          id="nroCedula"
                          value={nroCedula}
                          onChange={(e) => handleCedulaChange(e.target.value)}
                          placeholder="Ingrese su número de cédula"
                          maxLength="10"
                          className={errors.nroCedula ? 'input-error' : ''}
                        />
                        {errors.nroCedula && <span className="error-text">{errors.nroCedula}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="celular">#Celular: *</label>
                        <input
                          id="celular"
                          value={celular}
                          onChange={(e) => handleCelularChange(e.target.value)}
                          placeholder="Ej: 0987654321"
                          maxLength="10"
                          className={errors.celular ? 'input-error' : ''}
                        />
                        {errors.celular && <span className="error-text">{errors.celular}</span>}
                      </div>
                    </div>

                    <div className='rows'>
                      <div className="form-group">
                        <label htmlFor="primer_nombre">Primer nombre: *</label>
                        <input
                          id="primer_nombre"
                          value={primer_nombre}
                          onChange={(e) => handleNombreChange('primer_nombre', e.target.value, setPrimerNombre)}
                          placeholder="Ingrese su primer nombre"
                          className={errors.primer_nombre ? 'input-error' : ''}
                        />
                        {errors.primer_nombre && <span className="error-text">{errors.primer_nombre}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="primer_apellido">Primer apellido: *</label>
                        <input
                          id="primer_apellido"
                          value={primer_apellido}
                          onChange={(e) => handleNombreChange('primer_apellido', e.target.value, setPrimerApellido)}
                          placeholder="Ingrese su primer apellido"
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
                          onChange={(e) => handleNombreChange('segundo_nombre', e.target.value, setSegundoNombre)}
                          placeholder="Ingrese su segundo nombre (opcional)"
                          className={errors.segundo_nombre ? 'input-error' : ''}
                        />
                        {errors.segundo_nombre && <span className="error-text">{errors.segundo_nombre}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="segundo_apellido">Segundo apellido:</label>
                        <input
                          id="segundo_apellido"
                          value={segundo_apellido}
                          onChange={(e) => handleNombreChange('segundo_apellido', e.target.value, setSegundoApellido)}
                          placeholder="Ingrese su segundo apellido (opcional)"
                          className={errors.segundo_apellido ? 'input-error' : ''}
                        />
                        {errors.segundo_apellido && <span className="error-text">{errors.segundo_apellido}</span>}
                      </div>
                    </div>

                    <div className='rows'>
                      <div className="form-group">
                        <label htmlFor="convencional">#Convencional:</label>
                        <input
                          id="convencional"
                          value={convencional}
                          onChange={(e) => handleConvencionalChange(e.target.value)}
                          placeholder="Ej: 023456789 (opcional)"
                          maxLength="9"
                          className={errors.convencional ? 'input-error' : ''}
                        />
                        {errors.convencional && <span className="error-text">{errors.convencional}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="emergencia">#Emergencia:</label>
                        <input
                          id="emergencia"
                          value={emergencia}
                          onChange={(e) => handleEmergenciaChange(e.target.value)}
                          placeholder="Ej: 0987651234 (opcional)"
                          maxLength="10"
                          className={errors.emergencia ? 'input-error' : ''}
                        />
                        {errors.emergencia && <span className="error-text">{errors.emergencia}</span>}
                      </div>
                    </div>

                    <div className='rows'>
                      <div className="form-group">
                        <label htmlFor="email">Email: *</label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          placeholder="ejemplo@correo.com"
                          className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                      </div>
                      <div className='form-group'>
                        {/* Espacio vacío para mantener la estructura */}
                      </div>
                    </div>

                    <div className='file-upload-container'>

                      <FileUploader
                        label="Copia de Cédula:"
                        name="copiaCedula"
                        currentFilePath={representante?.cedula_PDF}
                        onChange={handleFileChange}
                        disabled={!dentroDeRango}
                        error={errors.copiaCedula}
                      />
                      <FileUploader
                        label="Croquis:"
                        name="croquis"
                        currentFilePath={representante?.croquis_PDF} // <-- Asumiendo que así se llame tu campo en la BD
                        onChange={handleFileChange}
                        disabled={!dentroDeRango}
                        error={errors.croquis}
                      />
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
                          onClick={cerrarModal}
                          disabled={submitting}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </Layout>
    </div>
  );
}

export default VerDatosRepresentante;
