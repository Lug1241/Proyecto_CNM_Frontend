import React, { useState, useEffect, useRef } from "react";
import HeaderTabla from "../../../components/HeaderTabla";
import Tabla from "../../../components/Tabla";
import axios from "axios";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import Swal from 'sweetalert2';
import "../Parcial.css";

function ParcialBE({ quimestreSeleccionado, parcialSeleccionado, actualizarDatosParcial, datosModulo, inputsDisabled, onEditar, isWithinRange, rangoTexto, forceEdit, soloLectura, escala, esPorSolicitud, savedKeys, makeKey, agregarSavedKey, editingRow, setEditingRow }) {
  // ID dinámico: pdf-parcial1-quim1, pdf-parcial2-quim1, pdf-parcial1-quim2, etc.
  const idContenedor = `pdf-parcial-be${parcialSeleccionado}-quim${quimestreSeleccionado}`;

  const subtitulo = `NOTA DEL ${parcialSeleccionado === "1" ? "PRIMER" : "SEGUNDO"} PARCIAL - ${quimestreSeleccionado === "1" ? "PRIMER" : "SEGUNDO"} QUIMESTRE`;

  const convertirNota = (nota) => {
    const n = parseFloat(nota);
    if (isNaN(n) || n < 0 || n > 10) return "";

    if (escala === "cuantitativa" || escala === "1") {
      if (n >= 9) return "DA";
      if (n >= 7) return "AA";
      if (n > 4) return "PA";
      return "NA";
    }

    if (escala === "cualitativa" || escala === "2") {
      if (n >= 9.5) return "A+";
      if (n >= 9) return "A-";
      if (n >= 8.5) return "B+";
      if (n >= 7.5) return "B-";
      if (n >= 7) return "C+";
      if (n >= 6.5) return "C-";
      if (n >= 4) return "D+";
      if (n >= 3.5) return "D-";
      if (n >= 2) return "E+";
      return "E-";
    }

    return "";
  };

  // ⬇️ Aquí implementamos la función para determinar la jornada
  const determinarJornada = (horario) => {
    const horaInicio = horario.split("-")[0];
    const horaNumerica = parseInt(horaInicio.split(":")[0], 10);
    return horaNumerica < 12 ? "Matutina" : "Vespertina";
  };

  const [datosOriginales, setDatosOriginales] = useState([]);

  const obtenerEtiquetaQuimestre = () => {
    return quimestreSeleccionado === "1" ? "Q1" : "Q2";
  };

  const obtenerEtiquetaParcial = () => {
    return parcialSeleccionado === "1" ? "P1" : "P2";
  };

  const datosEncabezado = {
    titulo: "CONSERVATORIO NACIONAL DE MUSICA",
    subtitulo: subtitulo,
    info: {
      "Profesor": datosModulo.docente || (datosModulo.asignaciones?.[0]?.docente),
      "Asignatura": datosModulo.materia || datosModulo.nombreMateria,
      "Curso": datosModulo.asignaciones ? `Niveles ${datosModulo.tipoNivel}` : datosModulo.año,
      "Paralelo": datosModulo.asignaciones ? "Múltiples" : datosModulo.paralelo,
      "Año Lectivo": datosModulo.periodo || (datosModulo.asignaciones?.[0]?.periodo),
      "Jornada": datosModulo.horario ? determinarJornada(datosModulo.horario) : (datosModulo.asignaciones?.[0]?.horario ? determinarJornada(datosModulo.asignaciones[0].horario) : "")
    }
  };

  const columnasAgrupadas = [
    { titulo: "", colspan: 2 },
    { titulo: "Evaluación de Aprendizajes", colspan: 5 },
    { titulo: "Evaluaciones Sumativas", colspan: 5 },
    { titulo: "", colspan: 2 }
  ];

  const nombreColumnaExtra = escala === "cualitativa" ? "CUALITATIVA" : "CUANTITATIVA";
  const nombreColumnaExtra1 = escala === "cualitativa" ? "CUALITATIVA\u00A0" : "CUANTITATIVA\u00A0";
  
  const columnas = [
    "INSUMO 1", "INSUMO 2", "PROMEDIO", nombreColumnaExtra, "PONDERACIÓN 70%", "EVALUACIÓN SUMATIVA", "EVALUACIÓN MEJORAMIENTO",
    "PROMEDIO DE MEJORA", "PROMEDIO SUMATIVAS", "PONDERACIÓN 30%", "NOTA PARCIAL",
    nombreColumnaExtra1
  ];

  const [datos, setDatos] = useState([]);

  // Definir qué columnas son editables en Parciales
  const columnasEditables = [
    "INSUMO 1", "INSUMO 2", "EVALUACIÓN SUMATIVA", "EVALUACIÓN MEJORAMIENTO",
  ];

  function parseCampoNumerico(valor) {
    if (typeof valor === "string" && valor.trim() === "") {
      return null; // vacío
    }
    const parsed = parseFloat(valor);
    return isNaN(parsed) ? null : parsed;
  }

  // 🔁 Transformador que ajusta la estructura a lo que necesita el backend
  const transformarDatosParaGuardar = (datos) => {
    return datos.map((fila) => {
      return {
        id_inscripcion: fila.idInscripcion,
        insumo1: parseCampoNumerico(fila["INSUMO 1"]),
        insumo2: parseCampoNumerico(fila["INSUMO 2"]),
        evaluacion: parseCampoNumerico(fila["EVALUACIÓN SUMATIVA"]),
        mejoramiento: parseCampoNumerico(fila["EVALUACIÓN MEJORAMIENTO"]),
        quimestre: obtenerEtiquetaQuimestre(),
        parcial: obtenerEtiquetaParcial(),
        "Promedio Final": parseCampoNumerico(fila["NOTA PARCIAL"]),
      };
    });
  };

  // Combina la lógica de "deshabilitado por fuera de fecha" y "deshabilitado por prop"
  // Función que determina si una fila específica está deshabilitada
  const esFilaDeshabilitada = (row) => {
    // Si es soloLectura, siempre deshabilitado
    if (soloLectura) return true;
    
    // Si la fila está guardada (tiene idParcial), está deshabilitada
    // INCLUSO si forceEdit está activo (botón amarillo presionado)
    if (savedKeys && row.idInscripcion) {
      const quim = quimestreSeleccionado; // "1" o "2"
      const parc = parcialSeleccionado; // "1" o "2"
      const rowKey = `${row.idInscripcion}-${quim}-${parc}`;
      if (savedKeys.has(rowKey)) {
        return true;
      }
    }
    
    // Si forceEdit está activo, las NO guardadas están habilitadas
    if (forceEdit) return false;
    
    // Si estamos fuera de rango, deshabilitado
    if (!isWithinRange) return true;
    
    // Si inputsDisabled es true, deshabilitado
    return inputsDisabled;
  };

  // ✅ Nuevo useEffect que envía datos transformados al padre
  useEffect(() => {
    // ✅ Nos aseguramos de que ya haya datos con cálculos listos
    if (!datos || datos.length === 0) return;

    const datosCompletos = datos.filter(fila => fila["NOTA PARCIAL"] !== undefined);

    if (actualizarDatosParcial && datosCompletos.length > 0) {
      const datosTransformados = transformarDatosParaGuardar(datos);
      actualizarDatosParcial(datosTransformados);
    }
  }, [datos, actualizarDatosParcial, quimestreSeleccionado, parcialSeleccionado]);

  // Manejar cambios en los inputs de la tabla
  const handleInputChange = (rowIndex, columnName, value) => {
    // La validación de si está bloqueado ya se maneja en el atributo 'disabled' de los inputs
    // que considera editingRow, savedKeys y rangos de fecha correctamente

    const nuevosDatos = datos.map((fila, i) => {
      if (i === rowIndex) {
        let nuevaFila = { ...fila };

        if (!(nombreColumnaExtra in nuevaFila)) {
          nuevaFila[nombreColumnaExtra] = "-";
        }
        if (!(nombreColumnaExtra1 in nuevaFila)) {
          nuevaFila[nombreColumnaExtra1] = "-";
        }

        // Validación básica
        if (["INSUMO 1", "INSUMO 2", "EVALUACIÓN SUMATIVA", "EVALUACIÓN MEJORAMIENTO"].includes(columnName)) {
          if (value === "") {
            nuevaFila[columnName] = "";
          } else if (!/^\d{0,2}(\.\d{0,2})?$/.test(value) || value > 10 || value < 0) {
            Swal.fire({
              icon: 'error',
              title: 'Error de Validación',
              text: 'El valor debe estar entre 0.00 y 10.00 con máximo dos decimales.',
            });
            return fila;
          } else {
            nuevaFila[columnName] = value;
          }
        }

        const insumo1 = parseFloat(nuevaFila["INSUMO 1"]) || 0;
        const insumo2 = parseFloat(nuevaFila["INSUMO 2"]) || 0;
        const promedio = (insumo1 + insumo2) / 2;
        const ponderacion70 = promedio * 0.7;

        const evaluacion = parseFloat(nuevaFila["EVALUACIÓN SUMATIVA"]);
        const mejora = parseFloat(nuevaFila["EVALUACIÓN MEJORAMIENTO"]);
        let promedioMejora = "";
        let promedioSumativas = isNaN(evaluacion) ? 0 : evaluacion;

        if (!isNaN(evaluacion) && !isNaN(mejora)) {
          const promedioDeMejora = (evaluacion + mejora) / 2;
          promedioMejora = promedioDeMejora.toFixed(2);

          if (mejora >= evaluacion) {
            promedioSumativas = ((promedioDeMejora + evaluacion) / 2);
          } else {
            promedioSumativas = evaluacion;
          }
        }

        const ponderacion30 = parseFloat(promedioSumativas) * 0.3;
        const notaParcial = ponderacion70 + ponderacion30;

        return {
          ...nuevaFila,
          "PROMEDIO": promedio.toFixed(2),
          [nombreColumnaExtra]: convertirNota(promedio.toFixed(2)),
          "PROMEDIO DE MEJORA": promedioMejora,
          "PROMEDIO SUMATIVAS": promedioSumativas.toFixed(2),
          "PONDERACIÓN 70%": ponderacion70.toFixed(2),
          "PONDERACIÓN 30%": ponderacion30.toFixed(2),
          "NOTA PARCIAL": notaParcial.toFixed(2),
          [nombreColumnaExtra1]: !isNaN(evaluacion) ? convertirNota(notaParcial.toFixed(2)) : ""
        };
      }
      return fila;
    });

    setDatos(nuevosDatos);
  };

  const safe = (val) => (val === 0 || val === "0") ? "0" : (val !== undefined && val !== null ? val : "");

  const calcularDatosFila = (fila) => {
    const evaluacion = parseFloat(fila["EVALUACIÓN SUMATIVA"]);
    const mejora = parseFloat(fila["EVALUACIÓN MEJORAMIENTO"] || 0);
    const insumo1 = parseFloat(fila["INSUMO 1"]) || 0;
    const insumo2 = parseFloat(fila["INSUMO 2"]) || 0;
    const promedio = (insumo1 + insumo2) / 2;
    const ponderacion70 = promedio * 0.7;

    let promedioMejora = "";
    let promedioSumativas = isNaN(evaluacion) ? 0 : evaluacion;

    if (!isNaN(evaluacion) && !isNaN(mejora)) {
      const promedioDeMejora = (evaluacion + mejora) / 2;
      promedioMejora = promedioDeMejora.toFixed(2);

      if (mejora >= evaluacion) {
        promedioSumativas = ((promedioDeMejora + evaluacion) / 2);
      } else {
        promedioSumativas = evaluacion;
      }
    }

    const ponderacion30 = parseFloat(promedioSumativas) * 0.3;
    const notaParcial = ponderacion70 + ponderacion30;

    return {
      ...fila,
      "PROMEDIO": promedio.toFixed(2),
      [nombreColumnaExtra]: convertirNota(promedio.toFixed(2)),
      "PROMEDIO DE MEJORA": promedioMejora,
      "PROMEDIO SUMATIVAS": promedioSumativas.toFixed(2),
      "PONDERACIÓN 70%": ponderacion70.toFixed(2),
      "PONDERACIÓN 30%": ponderacion30.toFixed(2),
      "NOTA PARCIAL": notaParcial.toFixed(2),
      [nombreColumnaExtra1]: !isNaN(evaluacion) ? convertirNota(notaParcial.toFixed(2)) : ""
    };
  };

  useEffect(() => {
    if (!datos || datos.length === 0) return;

    const nuevosDatos = datos.map(fila => calcularDatosFila(fila));
    setDatos(nuevosDatos);
  }, [escala]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    const esGrupoIndividual = datosModulo?.asignaciones && datosModulo.asignaciones.length > 0;

    if (esGrupoIndividual) {
      const promesasAsignaciones = datosModulo.asignaciones.map(asignacion => {
        const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${asignacion.ID}`;
        const urlParciales = `${import.meta.env.VITE_URL_DEL_BACKEND}/parcialesbe/asignacion/${asignacion.ID}`;
        return Promise.all([axios.get(urlInscripciones), axios.get(urlParciales)])
          .then(([respEstudiantes, respParciales]) => ({
            asignacion,
            estudiantes: respEstudiantes.data,
            parciales: respParciales.data
          }));
      });

      Promise.all(promesasAsignaciones)
        .then(resultados => {
          const todosLosDatos = [];

          resultados.forEach(({ asignacion, estudiantes, parciales }) => {
            estudiantes.forEach(est => {
              const parcialGuardado = parciales.find(p =>
                p.idInscripcion === est.idInscripcion &&
                p.parcial === obtenerEtiquetaParcial() &&
                p.quimestre === obtenerEtiquetaQuimestre()
              ) || {};

              const fila = {
                idInscripcion: est.idInscripcion,
                idParcial: parcialGuardado?.idParcial,
                idAsignacion: asignacion.ID,
                "Nro": 0, // Se asignará después de ordenar
                "Nómina de Estudiantes": est.nombre,
                "INSUMO 1": safe(parcialGuardado?.insumo1),
                "INSUMO 2": safe(parcialGuardado?.insumo2),
                "EVALUACIÓN SUMATIVA": safe(parcialGuardado?.evaluacion),
                "EVALUACIÓN MEJORAMIENTO": safe(parcialGuardado?.mejoramiento),
                "PONDERACIÓN 70%": "",
                "PONDERACIÓN 30%": "",
                "NOTA PARCIAL": ""
              };
              todosLosDatos.push(calcularDatosFila(fila));
            });
          });

          // Ordenar alfabéticamente por nombre completo
          todosLosDatos.sort((a, b) => {
            const nombreA = a["Nómina de Estudiantes"].toLowerCase();
            const nombreB = b["Nómina de Estudiantes"].toLowerCase();
            return nombreA.localeCompare(nombreB);
          });

          // Asignar números secuenciales después de ordenar
          todosLosDatos.forEach((fila, index) => {
            fila["Nro"] = index + 1;
          });

          setDatos(todosLosDatos);
          setDatosOriginales(JSON.parse(JSON.stringify(todosLosDatos)));
        })
        .catch((error) => {
          ErrorMessage(error);
        });
    } else if (datosModulo?.ID) {
      const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${datosModulo.ID}`;
      const urlParciales = `${import.meta.env.VITE_URL_DEL_BACKEND}/parcialesbe/asignacion/${datosModulo.ID}`;

      Promise.all([axios.get(urlInscripciones), axios.get(urlParciales)])
        .then(([respEstudiantes, respParciales]) => {
          const estudiantes = respEstudiantes.data;
          const parciales = respParciales.data;

          const nuevosDatos = estudiantes.map(est => {
            const parcialGuardado = parciales.find(p =>
              p.idInscripcion === est.idInscripcion &&
              p.parcial === obtenerEtiquetaParcial() &&
              p.quimestre === obtenerEtiquetaQuimestre()
            ) || {};

            const fila = {
              idInscripcion: est.idInscripcion,
              idParcial: parcialGuardado?.idParcial,
              "Nro": est.nro,
              "Nómina de Estudiantes": est.nombre,
              "INSUMO 1": safe(parcialGuardado?.insumo1),
              "INSUMO 2": safe(parcialGuardado?.insumo2),
              "EVALUACIÓN SUMATIVA": safe(parcialGuardado?.evaluacion),
              "EVALUACIÓN MEJORAMIENTO": safe(parcialGuardado?.mejoramiento),
              "PONDERACIÓN 70%": "",
              "PONDERACIÓN 30%": "",
              "NOTA PARCIAL": ""
            };
            return calcularDatosFila(fila);
          });
          setDatos(nuevosDatos);
          setDatosOriginales(JSON.parse(JSON.stringify(nuevosDatos)));
        })
        .catch((error) => {
          ErrorMessage(error);
        });
    }
  }, [datosModulo, quimestreSeleccionado, parcialSeleccionado]);

  const handleGuardar = (rowIndex, rowData, onSuccessCallback) => {
    if (!rowData.idParcial) {
      Swal.fire({
        icon: "error",
        title: "Registro no encontrado",
        text: "No se puede actualizar porque aún no existe un registro para esta fila.",
      });
      return;
    }

    // Validar que todos los campos obligatorios estén completos (mejoramiento NO es obligatorio)
    const camposVacios = [];
    if (!rowData["INSUMO 1"] || rowData["INSUMO 1"] === "") camposVacios.push("Insumo 1");
    if (!rowData["INSUMO 2"] || rowData["INSUMO 2"] === "") camposVacios.push("Insumo 2");
    if (!rowData["EVALUACIÓN SUMATIVA"] || rowData["EVALUACIÓN SUMATIVA"] === "") camposVacios.push("Evaluación Sumativa");

    if (camposVacios.length > 0) {
      const listaCampos = camposVacios.length === 1 
        ? camposVacios[0]
        : camposVacios.length === 2
        ? camposVacios.join(' y ')
        : `${camposVacios.slice(0, -1).join(', ')} y ${camposVacios[camposVacios.length - 1]}`;
      
      Swal.fire({
        icon: "warning",
        title: "Faltan datos",
        text: `Debes completar: ${listaCampos}`,
        confirmButtonText: "OK"
      });
      return;
    }

    const original = datosOriginales[rowIndex];
    const haCambiado = JSON.stringify(rowData) !== JSON.stringify(original);

    if (!haCambiado) {
      Swal.fire({
        icon: "info",
        title: "Sin cambios",
        text: "No has realizado ningún cambio en esta fila.",
      });
      return;
    }

    const body = {
      id_inscripcion: rowData.idInscripcion,
      insumo1: parseFloat(rowData["INSUMO 1"]),
      insumo2: parseFloat(rowData["INSUMO 2"]),
      evaluacion: parseFloat(rowData["EVALUACIÓN SUMATIVA"]),
      mejoramiento: parseFloat(rowData["EVALUACIÓN MEJORAMIENTO"]),
      quimestre: obtenerEtiquetaQuimestre(),
      parcial: obtenerEtiquetaParcial(),
    };

    axios
      .put(`${import.meta.env.VITE_URL_DEL_BACKEND}/parcialesbe/${rowData.idParcial}`, body)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Actualizado",
          text: "Las calificaciones se actualizaron correctamente.",
        });
        const nuevaCopia = [...datosOriginales];
        nuevaCopia[rowIndex] = JSON.parse(JSON.stringify(rowData));
        setDatosOriginales(nuevaCopia);
        
        // Actualizar savedKeys para bloquear la fila inmediatamente sin recargar
        if (agregarSavedKey && makeKey) {
          const key = makeKey({
            id_inscripcion: rowData.idInscripcion,
            quimestre: obtenerEtiquetaQuimestre(),
            parcial: obtenerEtiquetaParcial()
          });
          agregarSavedKey(key);
          
          // Forzar re-render
          setDatos([...datos]);
        }
        
        // Solo resetear editingRow si el guardado fue exitoso
        if (onSuccessCallback) onSuccessCallback();
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Error al actualizar ❌.",
          text: "No se pudo actualizar la calificación.",
        });
        ErrorMessage(error);
      });
  };

  const handleEliminar = (rowIndex, rowData) => {
    if (!rowData.idParcial) {
      Swal.fire({
        icon: "warning",
        title: "No hay registro",
        text: "Esta fila aún no tiene calificaciones guardadas para eliminar.",
      });
      return;
    }

    Swal.fire({
      icon: "warning",
      title: "¿Eliminar calificaciones?",
      text: `¿Estás seguro de eliminar las calificaciones de ${rowData["Nómina de Estudiantes"]}? Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${import.meta.env.VITE_URL_DEL_BACKEND}/parcialesbe/${rowData.idParcial}`)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Eliminado",
              text: "Las calificaciones se eliminaron correctamente.",
            }).then(() => {
              // Actualizar el estado local sin recargar la página
              const nuevosDatos = datos.map((fila, i) => {
                if (i === rowIndex) {
                  // Resetear valores a vacíos
                  return {
                    ...fila,
                    idParcial: null,
                    "INSUMO 1": "",
                    "INSUMO 2": "",
                    "EVALUACIÓN SUMATIVA": "",
                    "EVALUACIÓN MEJORAMIENTO": "",
                    "PROMEDIO": "",
                    "PONDERACIÓN 70%": "",
                    "PROMEDIO DE MEJORA": "",
                    "PROMEDIO SUMATIVAS": "",
                    "PONDERACIÓN 30%": "",
                    "NOTA PARCIAL": "",
                    [nombreColumnaExtra]: "-",
                    [nombreColumnaExtra1]: "-"
                  };
                }
                return fila;
              });
              
              setDatos(nuevosDatos);
              setDatosOriginales(JSON.parse(JSON.stringify(nuevosDatos)));
              
              // Remover de savedKeys
              if (savedKeys && makeKey) {
                const key = makeKey({
                  id_inscripcion: rowData.idInscripcion,
                  quimestre: obtenerEtiquetaQuimestre(),
                  parcial: obtenerEtiquetaParcial()
                });
                savedKeys.delete(key);
              }
            });
          })
          .catch((error) => {
            Swal.fire({
              icon: "error",
              title: "Error al eliminar",
              text: "No se pudo eliminar la calificación.",
            });
            ErrorMessage(error);
          });
      }
    });
  };

  return (
    <div id={idContenedor} className="container tabla-parciales-be">
      <HeaderTabla datosEncabezado={datosEncabezado} imagenIzquierda={"/ConservatorioNacional.png"} />
      {!isWithinRange && (
        <div className="alert alert-warning text-center screen-only">
          🕒 {rangoTexto || "Este parcial aún no está disponible para edición."}
        </div>
      )}
      <Tabla
        columnasAgrupadas={columnasAgrupadas}
        columnas={columnas}
        datos={datos}
        onChange={handleInputChange}
        columnasEditables={columnasEditables}
        columnasColorear={columnasEditables}
        inputsDisabled={inputsDisabled}
        onEditar={onEditar}
        onGuardar={handleGuardar}
        onEliminar={handleEliminar}
        rangoTexto={rangoTexto}
        isWithinRange={isWithinRange}
        globalEdit={forceEdit}
        soloLectura={soloLectura}
        esPorSolicitud={esPorSolicitud}
        esFilaDeshabilitada={esFilaDeshabilitada}
        editingRow={editingRow}
        setEditingRow={setEditingRow}
      />
    </div>
  );
}

export default ParcialBE;
