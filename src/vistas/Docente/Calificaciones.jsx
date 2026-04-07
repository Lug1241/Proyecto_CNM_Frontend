import React, { useState, useEffect } from "react";
import Notas from "./Notas";
import NotasBE from "./BasicoElemental/NotasBE";
import { Home, Users, Settings } from "lucide-react";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { handleExportPDF, parseFecha, handleEditar as ejecutarHandleEditar } from "./FuncionesCalificaciones";
import { useNavigate, useLocation } from "react-router-dom";
import Loading from "../../components/Loading";
import axios from "axios";
import Swal from "sweetalert2";
import "./Calificaciones.css";
import { ErrorMessage } from "../../Utils/ErrorMesaje";
import { getModulos, transformModulesForLayout } from "../getModulos";
import { useAuth } from "../../Utils/useAuth";

function Calificaciones() {

  // Protección de ruta - permitir acceso a Profesores y Secretarias
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detectar si es acceso de secretaria basado en la ruta
  const isSecretariaAccess = location.pathname.includes('/secretaria/');
  
  // Aplicar protección de rol según el contexto
  const auth = useAuth(isSecretariaAccess ? "Secretaria" : ["Profesor", "Administrador", "Vicerrector"]);
  
  // Si no está autenticado, no renderizar nada (el hook maneja la redirección)
  if (!auth.isAuthenticated) {
    return null;
  }

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputsDisabled, setInputsDisabled] = useState(false);
  const moduloSeleccionado = location.state;
  const [parcial1Quim1Data, setParcial1Quim1Data] = useState([]);
  const [parcial2Quim1Data, setParcial2Quim1Data] = useState([]);
  const [parcial1Quim2Data, setParcial1Quim2Data] = useState([]);
  const [parcial2Quim2Data, setParcial2Quim2Data] = useState([]);
  const [quim1Data, setQuim1Data] = useState([]);
  const [quim2Data, setQuim2Data] = useState([]);
  const [finalData, setFinalData] = useState([]);
  // Restaurar pestañas activas desde localStorage si existen
  const [activeMainTab, setActiveMainTab] = useState(() => {
    const saved = localStorage.getItem("activeMainTab");
    console.log("🔍 Al cargar - activeMainTab desde localStorage:", saved);
    return saved || "quimestre1";
  });
  const [activeSubTabQuim1, setActiveSubTabQuim1] = useState(() => {
    const saved = localStorage.getItem("activeSubTabQuim1");
    console.log("🔍 Al cargar - activeSubTabQuim1 desde localStorage:", saved);
    return saved || "parcial1-quim1";
  });
  const [activeSubTabQuim2, setActiveSubTabQuim2] = useState(() => {
    const saved = localStorage.getItem("activeSubTabQuim2");
    console.log("🔍 Al cargar - activeSubTabQuim2 desde localStorage:", saved);
    return saved || "parcial1-quim2";
  });
  const [datosModulo, setDatosModulo] = useState(moduloSeleccionado || {});
  const [estadoFechas, setEstadoFechas] = useState({});
  const [textoRangoFechas, setTextoRangoFechas] = useState({});
  const soloLectura = usuario?.subRol?.toLowerCase() === "secretaria";
  const [solicitudAceptada, setSolicitudAceptada] = useState(null);
  const [solicitudEnRango, setSolicitudEnRango] = useState(false);

  const getRangoValido = (clave) => {
    // Normalizar para comparar: convertir guiones bajos a guiones medios
    const solicitudDesc = solicitudAceptada?.descripcion?.replace(/_/g, "-");
    const coincideConSolicitud = solicitudDesc === clave && solicitudEnRango;
    return estadoFechas[clave] || coincideConSolicitud;
  };

  const esPorSolicitud = (clave) => {
    // Retorna true si la edición está permitida por solicitud (no por fechas normales)
    const solicitudDesc = solicitudAceptada?.descripcion?.replace(/_/g, "-");
    const coincideConSolicitud = solicitudDesc === clave && solicitudEnRango;
    return !estadoFechas[clave] && coincideConSolicitud;
  };
  
  const obtenerParcialBE = (subtab) => {
    if (subtab.includes("parcial1")) return "P1";
    if (subtab.includes("parcial2")) return "P2";
    return "??";
  };
  
  const makeKey = ({ id_inscripcion, quimestre, parcial }) => {
    const esBe = datosModulo?.nivel?.toLowerCase().includes("be") || datosModulo?.tipoNivel === "BE";
    if (esBe) {
      const tab = activeMainTab === "quimestre1" ? "Q1" :
                  activeMainTab === "quimestre2" ? "Q2" : "FINAL";
      const subtab = activeMainTab === "quimestre1" ? activeSubTabQuim1 :
                     activeMainTab === "quimestre2" ? activeSubTabQuim2 : "";
      const parcialBE = obtenerParcialBE(subtab);
      return `${id_inscripcion}-${tab}-${parcialBE}`;
    }
    return `${id_inscripcion}-${quimestre}-${parcial}`;
  };  
  
  const makeKeyQuim = ({ id_inscripcion, quimestre }) => {
    const esBe = datosModulo?.nivel?.toLowerCase().includes("be") || datosModulo?.tipoNivel === "BE";
    if (esBe) {
      const tab =
        activeMainTab === "quimestre1" ? "Q1" :
        activeMainTab === "quimestre2" ? "Q2" :
        "FINAL";
      return `${id_inscripcion}-${tab}-QUIMESTRAL`;
    }
    return `${id_inscripcion}-${quimestre}`;
  };
  
  const makeKeyFinal = ({ id_inscripcion }) => `${id_inscripcion}`;
  
  const [savedKeys, setSavedKeys] = useState(new Set());
  const [savedKeysQuim, setSavedKeysQuim] = useState(new Set());
  const [savedKeysFinal, setSavedKeysFinal] = useState(new Set());

  // Funciones para agregar a savedKeys sin recargar
  const agregarSavedKey = React.useCallback((key) => {
    setSavedKeys(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  }, []);

  const agregarSavedKeyQuim = React.useCallback((key) => {
    setSavedKeysQuim(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  }, []);

  const agregarSavedKeyFinal = React.useCallback((key) => {
    setSavedKeysFinal(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  }, []);

  const handleActualizarParcial1Quim1 = React.useCallback((datos) => {
    setParcial1Quim1Data(datos);
  }, []);
  const handleActualizarParcial2Quim1 = React.useCallback((datos) => {
    setParcial2Quim1Data(datos);
  }, []);
  const handleActualizarParcial1Quim2 = React.useCallback((datos) => {
    setParcial1Quim2Data(datos);
  }, []);
  const handleActualizarParcial2Quim2 = React.useCallback((datos) => {
    setParcial2Quim2Data(datos);
  }, []);
  const handleActualizarQuim1 = React.useCallback((datos) => {
    setQuim1Data(datos);
  }, []);
  const handleActualizarQuim2 = React.useCallback((datos) => {
    setQuim2Data(datos);
  }, []);
  const handleActualizarFinal = React.useCallback((datos) => {
    setFinalData(datos);
  }, []);

  // Actualizar savedKeys cuando los datos cambian y ya tienen ID guardado
  useEffect(() => {
    const parcialData = [
      ...parcial1Quim1Data,
      ...parcial2Quim1Data,
      ...parcial1Quim2Data,
      ...parcial2Quim2Data
    ];
    
    const newSavedKeys = new Set();
    parcialData.forEach(row => {
      // Si el registro tiene idParcial, significa que ya está guardado
      if (row.idParcial || row.id_parcial) {
        const key = makeKey(row);
        newSavedKeys.add(key);
      }
    });
    
    if (newSavedKeys.size > 0) {
      setSavedKeys(newSavedKeys);
    }
  }, [parcial1Quim1Data, parcial2Quim1Data, parcial1Quim2Data, parcial2Quim2Data]);

  useEffect(() => {
    const quimData = [...quim1Data, ...quim2Data];
    
    const newSavedKeysQuim = new Set();
    quimData.forEach(row => {
      if (row.idQuimestral || row.id_quimestral) {
        const key = makeKeyQuim(row);
        newSavedKeysQuim.add(key);
      }
    });
    
    if (newSavedKeysQuim.size > 0) {
      setSavedKeysQuim(newSavedKeysQuim);
    }
  }, [quim1Data, quim2Data]);

  useEffect(() => {
    const newSavedKeysFinal = new Set();
    finalData.forEach(row => {
      if (row.idFinal || row.id_final) {
        const key = makeKeyFinal(row);
        newSavedKeysFinal.add(key);
      }
    });
    
    if (newSavedKeysFinal.size > 0) {
      setSavedKeysFinal(newSavedKeysFinal);
    }
  }, [finalData]);

  const modules = React.useMemo(() => {
    if (!usuario) return [];

    // const esSecretaria = usuario.subRol?.toLowerCase() === "secretaria";
    
    // if (esSecretaria) {
    //   // Para secretarias, usar los módulos reales de Secretaria
    //   return transformModulesForLayout(getModulos("Secretaria", true));
    // } else {
    //   // Para profesores, usar los módulos estándar
    //   return transformModulesForLayout(getModulos("Profesor", true));
    // }
    console.log("este es el subrol",usuario)
    return transformModulesForLayout(getModulos(usuario.subRol, true));
  }, [usuario]);

  useEffect(() => {
    if (localStorage.getItem("inputsLocked") === null) {
      localStorage.setItem("inputsLocked", "false");
    }
  }, []);

  useEffect(() => {
    const obtenerSolicitud = async () => {
      try {
        const resp = await axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/solicitud/ultima/obtener`);
        const solicitud = resp.data;
        setSolicitudAceptada(solicitud);
    
        // Obtener fecha actual del backend
        const fechaResp = await axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/fechas_notas/fecha_actual`);
        const hoy = parseFecha(fechaResp.data.fechaActual);
        const fechaInicio = parseFecha(solicitud.fecha_inicio);
        const fechaFin = parseFecha(solicitud.fecha_fin);
        const dentroDeRango = hoy >= fechaInicio && hoy <= fechaFin;
    
        setSolicitudEnRango(dentroDeRango);
      } catch (error) {
        console.log("Error al obtener la solicitud o fecha actual:", error);
        console.log("No hay solicitud aprobada o falló la petición");
        setSolicitudAceptada(null);
        setSolicitudEnRango(false);
      }
    };    
    obtenerSolicitud();
  }, []);
  
  // Guardar pestañas activas en localStorage cada vez que cambien
  useEffect(() => {
    console.log("📌 Guardando en localStorage:", { activeMainTab, activeSubTabQuim1, activeSubTabQuim2 });
    localStorage.setItem("activeMainTab", activeMainTab);
    localStorage.setItem("activeSubTabQuim1", activeSubTabQuim1);
    localStorage.setItem("activeSubTabQuim2", activeSubTabQuim2);
  }, [activeMainTab, activeSubTabQuim1, activeSubTabQuim2]);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken && moduloSeleccionado) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      setUsuario(JSON.parse(storedUser));
      setDatosModulo(moduloSeleccionado);
    } else {
      navigate("/profesor/panelcursos"); // Si falta módulo seleccionado o usuario/token, regresamos.
    }
  }, [moduloSeleccionado, navigate]);

  // Función para guardar datos del tab activo
  const handleSave = () => {
    let activeData = [];
    let isQuimestral = false;
    let isFinal = false;
    const esBe = datosModulo?.nivel?.toLowerCase().includes("be") || datosModulo?.tipoNivel === "BE";

    // 1) Determinar qué pestaña (Parcial, Quimestral o Final) está activa
    if (activeMainTab === "quimestre1") {
      if (activeSubTabQuim1 === "parcial1-quim1") {
        activeData = parcial1Quim1Data;
      } else if (activeSubTabQuim1 === "parcial2-quim1") {
        activeData = parcial2Quim1Data;
      } else if (activeSubTabQuim1 === "quimestral-quim1") {
        activeData = quim1Data;
        isQuimestral = true;
      }
    } else if (activeMainTab === "quimestre2") {
      if (activeSubTabQuim2 === "parcial1-quim2") {
        activeData = parcial1Quim2Data;
      } else if (activeSubTabQuim2 === "parcial2-quim2") {
        activeData = parcial2Quim2Data;
      } else if (activeSubTabQuim2 === "quimestral-quim2") {
        activeData = quim2Data;
        isQuimestral = true;
      }
    } else if (activeMainTab === "notaFinal") {
      activeData = finalData;
      isFinal = true;
    }
    if (activeData.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "Sin datos",
        text: "No hay calificaciones para guardar."
      });
    }
    // A) Lógica para parciales y quimestrales (no finales)
    if (!isFinal) {
      const newRows = isQuimestral
        ? activeData.filter(row => !savedKeysQuim.has(makeKeyQuim(row)))
        : activeData.filter(row => !savedKeys.has(makeKey(row)));

      if (newRows.length === 0) {
        return Swal.fire({
          icon: "info",
          title: "Los datos ya fueron guardados",
          text: "No se han insertado registros, los datos ya fueron guardados 💾."
        });
      }
      // 1) Definir campos obligatorios según si es quimestral o parcial
      let requiredFields = [];
      if (isQuimestral) {
        // Solo quimestral
        requiredFields = ["examen"];
      } else {
        // Solo parcial
        requiredFields = ["insumo1", "insumo2", "evaluacion"];
        if (!esBe) {
          requiredFields.push("comportamiento"); // Solo si NO es BE
        }
      }
      
      // 2) GUARDADO PARCIAL: Filtrar filas que tienen al menos un campo con dato
      const rowsConDatos = newRows.filter(row => {
        // Verificar si tiene al menos un campo obligatorio con dato
        if (isQuimestral) {
          return row.examen != null && row.examen !== "";
        } else {
          // Para parciales: insumo1, insumo2, evaluacion
          const tieneInsumo1 = row.insumo1 != null && row.insumo1 !== "";
          const tieneInsumo2 = row.insumo2 != null && row.insumo2 !== "";
          const tieneEval = row.evaluacion != null && row.evaluacion !== "";
          const tieneComport = !esBe && Array.isArray(row.comportamiento) && row.comportamiento.some(v => v != null && v !== "");
          
          return tieneInsumo1 || tieneInsumo2 || tieneEval || tieneComport;
        }
      });

      // 3) De las que tienen datos, verificar cuáles están COMPLETAS
      const rowsCompletas = rowsConDatos.filter(row => {
        return requiredFields.every(field => {
          if (field === "comportamiento") {
            return Array.isArray(row[field]) && row[field].every(v => v != null && v !== "");
          } else {
            return row[field] != null && row[field] !== "";
          }
        });
      });

      // 4) Identificar filas INCOMPLETAS (tienen datos pero les falta algo)
      const rowsIncompletas = rowsConDatos.filter(row => {
        return !requiredFields.every(field => {
          if (field === "comportamiento") {
            return Array.isArray(row[field]) && row[field].every(v => v != null && v !== "");
          } else {
            return row[field] != null && row[field] !== "";
          }
        });
      });

      // Si hay filas incompletas, mostrar detalle específico
      if (rowsIncompletas.length > 0) {
        const detalles = rowsIncompletas.map(row => {
          const camposFaltantes = [];
          requiredFields.forEach(field => {
            if (field === "comportamiento") {
              if (!Array.isArray(row[field]) || !row[field].every(v => v != null && v !== "")) {
                camposFaltantes.push("Comportamiento");
              }
            } else {
              if (row[field] == null || row[field] === "") {
                const nombreCampo = field === "insumo1" ? "Insumo 1" : 
                                   field === "insumo2" ? "Insumo 2" : 
                                   field === "evaluacion" ? "Evaluación Sumativa" :
                                   field === "examen" ? "Examen" : field;
                camposFaltantes.push(nombreCampo);
              }
            }
          });
          
          // Obtener el índice real en activeData para mostrar el número de fila correcto
          const indiceReal = activeData.findIndex(r => r.id_inscripcion === row.id_inscripcion);
          const numeroFila = indiceReal !== -1 ? indiceReal + 1 : "?";
          const nombreEstudiante = row.nombre ? `${row.nombre}` : `Fila ${numeroFila}`;
          return `• Fila ${numeroFila} - ${nombreEstudiante}: Falta ${camposFaltantes.join(', ')}`;
        }).join('\n');

        return Swal.fire({
          icon: "warning",
          title: "No se puede guardar",
          html: `<div style="text-align: left;">Faltan datos en:<br><br>${detalles.split('\n').join('<br>')}</div>`,
          confirmButtonText: "OK"
        });
      }

      // Si no hay filas completas para guardar
      if (rowsCompletas.length === 0) {
        return Swal.fire({
          icon: "warning",
          title: "Sin datos completos",
          text: "No hay estudiantes con todas sus calificaciones completas para guardar."
        });
      }
      // 3) Realizar el POST con las filas completas
      const endpoint = esBe
        ? isQuimestral
          ? `${import.meta.env.VITE_URL_DEL_BACKEND}/quimestralesbe/bulk`
          : `${import.meta.env.VITE_URL_DEL_BACKEND}/parcialesbe/bulk`
        : isQuimestral
          ? `${import.meta.env.VITE_URL_DEL_BACKEND}/quimestrales/bulk`
          : `${import.meta.env.VITE_URL_DEL_BACKEND}/parciales/bulk`;

      axios.post(endpoint, rowsCompletas)
        .then((response) => {
          // Verificas el status o el contenido del response
          if (response.status === 201) {
            // Calcular totales para mensaje
            const totalNuevos = newRows.length;
            const guardados = rowsCompletas.length;
            const faltantes = totalNuevos - guardados;
            
            // Mensaje según si guardó todo o parcial
            let mensaje;
            if (faltantes === 0) {
              mensaje = "Calificaciones guardadas correctamente.";
            } else {
              mensaje = `Guardado(s) ${guardados} de ${totalNuevos} estudiante(s), faltan ${faltantes}.`;
            }
            
            // Actualizar savedKeys ANTES de mostrar el mensaje
            if (isQuimestral) {
              setSavedKeysQuim(prev => {
                const copy = new Set(prev);
                rowsCompletas.forEach(r => copy.add(makeKeyQuim(r)));
                return copy;
              });
            } else {
              setSavedKeys(prev => {
                const copy = new Set(prev);
                rowsCompletas.forEach(r => copy.add(makeKey(r)));
                return copy;
              });
            }
              
            Swal.fire({
              icon: "success",
              title: "Guardado",
              text: mensaje
            }).then(() => { 
              setInputsDisabled(true); 
              localStorage.setItem("inputsLocked", "true");
              setForceEdit(false);
              // Guardar las pestañas activas ANTES de recargar para mantener la posición
              console.log("💾 ANTES de reload - Guardando:", { activeMainTab, activeSubTabQuim1, activeSubTabQuim2 });
              localStorage.setItem("activeMainTab", activeMainTab);
              localStorage.setItem("activeSubTabQuim1", activeSubTabQuim1);
              localStorage.setItem("activeSubTabQuim2", activeSubTabQuim2);
              console.log("✅ Valores guardados en localStorage");
              // Recargar para obtener los IDs del backend
              window.location.reload();
            });
          }
          else if (
            response.status === 200 &&
            response.data.message === "No se han insertado registros, ya existen."
          ) {
            // Significa que el backend devolvió el mensaje de que NO se insertó nada
            Swal.fire({
              icon: "info",
              title: "Sin cambios",
              text: "Para editar una calificación ya guardada usa el botón ✏️ y guarda con el botón 💾 en Acciones."
            });
          }
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron guardar las calificaciones."
          });
          ErrorMessage(error);
        });
      return; // Sale, porque no es Final
    }
    // B) Lógica para Nota Final (Examen Supletorio)
    if (isFinal) {
      // 1) Filtrar solo las filas que NO están guardadas todavía (registros nuevos)
      // Nota: en Nota Final, `activeData` viene transformado desde `Final.jsx` y no incluye `idFinal`.
      const newRows = activeData.filter(row => !savedKeysFinal.has(makeKeyFinal(row)));
      
      if (newRows.length === 0) {
        return Swal.fire({
          icon: "info",
          title: "Sin cambios",
          text: "Para editar una calificación ya guardada usa el botón ✏️ y guarda con el botón 💾 en Acciones."
        });
      }
      
      // 2) Verificar que quienes estén entre 4 y 6.99 no dejen el supletorio vacío
      const rowsNeedingSupleButEmpty = newRows.filter(row => {
        const promedioAnual = parseFloat(row._promedioAnual) || 0;
        const supleVal = row.examen_recuperacion;
        const supleValNorm = typeof supleVal === "string" ? supleVal.trim() : supleVal;
        const estaVacio = supleValNorm === "" || supleValNorm == null;
        return (promedioAnual >= 4 && promedioAnual < 7 && estaVacio);
      });

      if (rowsNeedingSupleButEmpty.length > 0) {
        const detalles = rowsNeedingSupleButEmpty.map(row => {
          const indiceReal = activeData.findIndex(r => r.id_inscripcion === row.id_inscripcion);
          const numeroFila = indiceReal !== -1 ? indiceReal + 1 : "?";
          const nombreEstudiante = row.nombre ? String(row.nombre) : "";
          const encabezado = nombreEstudiante ? `Fila ${numeroFila} - ${nombreEstudiante}` : `Fila ${numeroFila}`;
          return `• ${encabezado}: Falta Examen Supletorio`;
        }).join('\n');
        
        return Swal.fire({
          icon: "warning",
          title: "No se puede guardar",
          html: `<div style="text-align: left;">Faltan datos en:<br><br>${detalles.split('\n').join('<br>')}</div>`,
          confirmButtonText: "OK"
        });
      }
      
      // 3) Excluir a los que tengan promedio <4 (pierden el año) o ≥7 (no necesitan supletorio)
      const rowsToSave = newRows.filter(row => {
        const promedioAnual = parseFloat(row._promedioAnual) || 0;
        if (promedioAnual < 4 || promedioAnual >= 7) {
          return false;
        }
        return true;
      });
      
      // 4) Si no hay nada que guardar, salimos con un mensaje
      if (rowsToSave.length === 0) {
        return Swal.fire({
          icon: "info",
          title: "Sin cambios",
          text: "No hay supletorios nuevos para guardar."
        });
      }
      // 4) Transformar los datos (ej. fila["Examen Supletorio"] => examen_recuperacion)
      const datosFiltrados = rowsToSave
        .filter(row => row.id_inscripcion) // Asegurar que tiene id_inscripcion válido
        .map((row) => ({
          id_inscripcion: row.id_inscripcion,
          examen_recuperacion: parseFloat(row.examen_recuperacion),
        }));
      // 5) Guardar en /finales/bulk
      axios.post(`${import.meta.env.VITE_URL_DEL_BACKEND}/finales/bulk`, datosFiltrados)
        .then((response) => {
          // Revisas el status o el contenido de response
          if (response.status === 201) {
            // Se insertaron registros nuevos
            Swal.fire({
              icon: "success",
              title: "Guardado",
              text: "Examen(es) supletorio(s) guardado(s) correctamente."
            }).then(() => {
              setInputsDisabled(true);
              setForceEdit(false); // Resetear para que la próxima vez detecte datos guardados
              // Guardar las pestañas activas antes de recargar
              localStorage.setItem("activeMainTab", activeMainTab);
              localStorage.setItem("activeSubTabQuim1", activeSubTabQuim1);
              localStorage.setItem("activeSubTabQuim2", activeSubTabQuim2);
              // Recargar la página para actualizar los datos con los IDs del backend
              window.location.reload();
            });
            // Actualizar las “keys” guardadas
            setSavedKeysFinal(prev => {
              const copy = new Set(prev);
              rowsToSave.forEach(r => copy.add(makeKeyFinal(r)));
              return copy;
            });
          }
          else if (
            response.status === 200 &&
            response.data.message === "No se han insertado registros, ya existen."
          ) {
            Swal.fire({
              icon: "info",
              title: "Sin cambios",
              text: "Para editar una calificación ya guardada usa el botón ✏️ y guarda con el botón 💾 en Acciones."
            });
          }
          else {
            Swal.fire({
              icon: "info",
              title: `Status: ${response.status}`,
              text: response.data?.message || "Respuesta no esperada"
            });
          }
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron guardar los supletorios."
          });
          ErrorMessage(error);
        });
      return;
    }
  };

  const handleSidebarNavigation = (path) => {
    if (!path) return;
    setLoading(true);
    setTimeout(() => navigate(path), 800);
  };

  if (loading) {
    return <Loading />;
  }

  const [forceEdit, setForceEdit] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  
  // Al cambiar de pestaña o subpestaña, volvemos a bloquear los inputs globalmente:
  useEffect(() => {
    setForceEdit(false);
    setInputsDisabled(true);
    setEditingRow(null); // Resetear edición individual al cambiar de pestaña
  }, [activeMainTab, activeSubTabQuim1, activeSubTabQuim2]);

  const tieneDatosGuardados = () => {
    const tieneCamposLlenos = (data, campos) =>
      data.length > 0 && data.every(row =>
        campos.every(campo => row[campo] !== null && row[campo] !== "")
      );
    if (activeMainTab === "quimestre1") {
      if (activeSubTabQuim1 === "parcial1-quim1") {
        return tieneCamposLlenos(parcial1Quim1Data, ["insumo1", "insumo2", "evaluacion", "comportamiento"]);
      } else if (activeSubTabQuim1 === "parcial2-quim1") {
        return tieneCamposLlenos(parcial2Quim1Data, ["insumo1", "insumo2", "evaluacion", "comportamiento"]);
      } else if (activeSubTabQuim1 === "quimestral-quim1") {
        return tieneCamposLlenos(quim1Data, ["examen"]);
      }
    } else if (activeMainTab === "quimestre2") {
      if (activeSubTabQuim2 === "parcial1-quim2") {
        return tieneCamposLlenos(parcial1Quim2Data, ["insumo1", "insumo2", "evaluacion", "comportamiento"]);
      } else if (activeSubTabQuim2 === "parcial2-quim2") {
        return tieneCamposLlenos(parcial2Quim2Data, ["insumo1", "insumo2", "evaluacion", "comportamiento"]);
      } else if (activeSubTabQuim2 === "quimestral-quim2") {
        return tieneCamposLlenos(quim2Data, ["examen"]);
      }
    } else if (activeMainTab === "notaFinal") {
      // Para Final, solo verificar estudiantes que REQUIEREN supletorio (4.00 ≤ promedio < 7.00)
      // Los que tienen promedio >= 7 están aprobados sin supletorio
      // Los que tienen promedio < 4 están reprobados sin opción a supletorio
      const estudiantesConSupletorioRequerido = finalData.filter(row => {
        const promedio = parseFloat(row._promedioAnual) || 0;
        return promedio >= 4 && promedio < 7;
      });
      
      // Si no hay estudiantes que requieran supletorio, no hay datos que guardar
      if (estudiantesConSupletorioRequerido.length === 0) {
        return false;
      }
      
      // Verificar que todos los que requieren supletorio lo tengan guardado
      // Un estudiante tiene supletorio guardado si:
      // 1. Tiene idFinal (registro en BD) Y
      // 2. El campo examen_recuperacion no está vacío
      return estudiantesConSupletorioRequerido.every(row => 
        row.idFinal && row.examen_recuperacion !== null && row.examen_recuperacion !== "" && row.examen_recuperacion !== undefined
      );
    }
    return false;
  };

  const handleEditar = () => {
    ejecutarHandleEditar({
      activeMainTab,
      activeSubTabQuim1,
      activeSubTabQuim2,
      estadoFechas,
      forceEdit,
      setForceEdit,
      setInputsDisabled,
      tieneDatosGuardados,
      solicitudAceptada,
      solicitudEnRango,
      finalData,
      datosModulo
    });
  };

  useEffect(() => {
    const verificarFechas = async () => {
      const mapping = {
        "parcial1-quim1": "parcial1_quim1",
        "parcial2-quim1": "parcial2_quim1",
        "quimestral-quim1": "quimestre1",
        "parcial1-quim2": "parcial1_quim2",
        "parcial2-quim2": "parcial2_quim2",
        "quimestral-quim2": "quimestre2",
        "notaFinal": "nota_final"
      };
      let activeSubTab = null;
      if (activeMainTab === "quimestre1") {
        activeSubTab = activeSubTabQuim1;
      } else if (activeMainTab === "quimestre2") {
        activeSubTab = activeSubTabQuim2;
      } else if (activeMainTab === "notaFinal") {
        activeSubTab = "notaFinal";
      }
      const claveDescripcion = mapping[activeSubTab];
      if (!claveDescripcion) return;
      try {
        // Obtener las fechas definidas en el backend
        const resp = await axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/fechas_notas/obtener_todo`);
        const data = resp.data;
        const registro = data.find(item => item.descripcion === claveDescripcion);
        if (!registro) {
          Swal.fire({
            icon: "warning",
            title: "Fecha por definirse",
            text: "Aún no se han definido las fechas para esta sección.",
          });
          setEstadoFechas(prev => ({ ...prev, [activeSubTab]: false }));
          setTextoRangoFechas(prev => ({ ...prev, [activeSubTab]: "" }));
          return;
        }
        // Obtener la fecha actual del backend
        const fechaResp = await axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/fechas_notas/fecha_actual`);
        const hoy = parseFecha(fechaResp.data.fechaActual);
        const fechaInicio = parseFecha(registro.fecha_inicio);
        const fechaFin = parseFecha(registro.fecha_fin);
        const estaDentro = hoy >= fechaInicio && hoy <= fechaFin;
        const formatearFecha = (fechaStr) => {
          const [anio, mes, dia] = fechaStr.split("-");
          const diaF = dia.padStart(2, "0");
          const mesF = mes.padStart(2, "0");
          return `${diaF}/${mesF}/${anio}`;
        };
        const rangoTexto = `Disponible del ${formatearFecha(registro.fecha_inicio)} al ${formatearFecha(registro.fecha_fin)}`;
        setEstadoFechas(prev => ({ ...prev, [activeSubTab]: estaDentro }));
        setTextoRangoFechas(prev => ({ ...prev, [activeSubTab]: rangoTexto }));
      } catch (error) {
        ErrorMessage(error);
        setEstadoFechas(prev => ({ ...prev, [activeSubTab]: false }));
        setTextoRangoFechas(prev => ({ ...prev, [activeSubTab]: "Error al obtener fechas" }));
      }
    };
    verificarFechas();
  }, [activeMainTab, activeSubTabQuim1, activeSubTabQuim2]);

  const handleEditarFila = (rowIndex, rowData) => {
    // No hacer nada aquí - la lógica de editingRow en Tabla.jsx ya maneja la habilitación de la fila individual
    // Solo se usa para callbacks si es necesario en el futuro
  };

  // Determinar si es BE: puede ser por nivel directo o por tipoNivel en materias agrupadas
  const esBE = datosModulo?.nivel?.toLowerCase().includes("be") || datosModulo?.tipoNivel === "BE";

  const ComponenteNotas = esBE ? NotasBE : Notas;

  return (
    <ComponenteNotas
      usuario={usuario}
      modules={modules}
      datosModulo={datosModulo}
      handleSidebarNavigation={handleSidebarNavigation}
      handleExportPDF={handleExportPDF}
      handleSave={handleSave}
      handleEditar={handleEditar}
      forceEdit={forceEdit}
      inputsDisabled={inputsDisabled}
      estadoFechas={estadoFechas}
      textoRangoFechas={textoRangoFechas}
      activeMainTab={activeMainTab}
      activeSubTabQuim1={activeSubTabQuim1}
      activeSubTabQuim2={activeSubTabQuim2}
      setActiveMainTab={setActiveMainTab}
      setActiveSubTabQuim1={setActiveSubTabQuim1}
      setActiveSubTabQuim2={setActiveSubTabQuim2}
      parcial1Quim1Data={parcial1Quim1Data}
      parcial2Quim1Data={parcial2Quim1Data}
      parcial1Quim2Data={parcial1Quim2Data}
      parcial2Quim2Data={parcial2Quim2Data}
      quim1Data={quim1Data}
      quim2Data={quim2Data}
      finalData={finalData}
      handleActualizarParcial1Quim1={handleActualizarParcial1Quim1}
      handleActualizarParcial2Quim1={handleActualizarParcial2Quim1}
      handleActualizarParcial1Quim2={handleActualizarParcial1Quim2}
      handleActualizarParcial2Quim2={handleActualizarParcial2Quim2}
      handleActualizarQuim1={handleActualizarQuim1}
      handleActualizarQuim2={handleActualizarQuim2}
      handleActualizarFinal={handleActualizarFinal}
      handleEditarFila={handleEditarFila}
      soloLectura={soloLectura}
      getRangoValido={getRangoValido}
      esPorSolicitud={esPorSolicitud}
      savedKeys={savedKeys}
      savedKeysQuim={savedKeysQuim}
      savedKeysFinal={savedKeysFinal}
      makeKey={makeKey}
      makeKeyQuim={makeKeyQuim}
      makeKeyFinal={makeKeyFinal}
      agregarSavedKey={agregarSavedKey}
      agregarSavedKeyQuim={agregarSavedKeyQuim}
      agregarSavedKeyFinal={agregarSavedKeyFinal}
      editingRow={editingRow}
      setEditingRow={setEditingRow}
    />
  );
}

export default Calificaciones;