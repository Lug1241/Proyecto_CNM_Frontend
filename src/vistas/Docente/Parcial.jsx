import React, { useState, useEffect, useRef } from "react";
import HeaderTabla from "../../components/HeaderTabla";
import Tabla from "../../components/Tabla";
import axios from "axios";
import { ErrorMessage } from "../../Utils/ErrorMesaje";
import Swal from 'sweetalert2';
import "./Parcial.css";
import { calcularPromedioParcial, calcularSumaComportamiento, calcularValoracionComportamiento, abreviarNivel } from "./Promedios"

function Parcial({ onGuardarTodoFinished, onGuardarTodo, globalEdit, quimestreSeleccionado, parcialSeleccionado, actualizarDatosParcial, datosModulo, inputsDisabled, onEditar, isWithinRange, rangoTexto, forceEdit, soloLectura, esPorSolicitud, savedKeys, makeKey, agregarSavedKey, editingRow, setEditingRow, activo }) {
  // ID dinámico: pdf-parcial1-quim1, pdf-parcial2-quim1, pdf-parcial1-quim2, etc.
  const idContenedor = `pdf-parcial${parcialSeleccionado}-quim${quimestreSeleccionado}`;
  console.log("Renderizando Parcial.jsx con ID:", idContenedor);
  const subtitulo = `ACTA DE CALIFICACIONES ${parcialSeleccionado === "1" ? "PRIMER" : "SEGUNDO"} PARCIAL - ${quimestreSeleccionado === "1" ? "PRIMER" : "SEGUNDO"} QUIMESTRE`;

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
    { titulo: "Evaluación de Aprendizajes", colspan: 6 },
    { titulo: "Evaluación del Comportamiento", colspan: 13 },
  ];

  const columnas = [
    "INSUMO 1", "INSUMO 2", "PONDERACIÓN 70%", "EVALUACIÓN SUMATIVA", "PONDERACIÓN 30%", "PROMEDIO PARCIAL",
    "RESPETO Y CONSIDERACION", "VALORACION DE LA DIVERSIDAD", "CUMPLIMIENTO DE LAS NORMA DE CONVIVENCIA",
    "CUIDADO  DEL PATRIMONIO INSTITUCIONAL", "RESPETO A LA PROPIEDAD AJENA", "PUNTUALIDAD Y ASISTENCIA", "HONESTIDAD ",
    "PRESENTACION PERSONAL (LIMPIEZA Y UNIFORME)", "PARTICIPACION COMUNITARIA", "RESPONSABILIDAD ", "PROMEDIO COMPORTAMIENTO",
    "NIVEL", "VALORACION"
  ];

  const [datos, setDatos] = useState([]);

  // Definir qué columnas son editables en Parciales
  const columnasEditables = [
    "INSUMO 1", "INSUMO 2", "EVALUACIÓN SUMATIVA",
    "RESPETO Y CONSIDERACION", "VALORACION DE LA DIVERSIDAD", "CUMPLIMIENTO DE LAS NORMA DE CONVIVENCIA",
    "CUIDADO  DEL PATRIMONIO INSTITUCIONAL", "RESPETO A LA PROPIEDAD AJENA", "PUNTUALIDAD Y ASISTENCIA", "HONESTIDAD ",
    "PRESENTACION PERSONAL (LIMPIEZA Y UNIFORME)", "PARTICIPACION COMUNITARIA", "RESPONSABILIDAD "
  ];
  const columnasComportamiento = [
    "RESPETO Y CONSIDERACION", "VALORACION DE LA DIVERSIDAD", "CUMPLIMIENTO DE LAS NORMA DE CONVIVENCIA",
    "CUIDADO  DEL PATRIMONIO INSTITUCIONAL", "RESPETO A LA PROPIEDAD AJENA", "PUNTUALIDAD Y ASISTENCIA", "HONESTIDAD ",
    "PRESENTACION PERSONAL (LIMPIEZA Y UNIFORME)", "PARTICIPACION COMUNITARIA", "RESPONSABILIDAD "
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
      const comportamiento = columnasComportamiento.map((col) => {
        const parsed = parseInt(fila[col]);
        return isNaN(parsed) ? null : parsed;
      });

      return {
        id_inscripcion: fila.idInscripcion,
        insumo1: parseCampoNumerico(fila["INSUMO 1"]),
        insumo2: parseCampoNumerico(fila["INSUMO 2"]),
        evaluacion: parseCampoNumerico(fila["EVALUACIÓN SUMATIVA"]),
        comportamiento, // array con valores numéricos o null
        quimestre: obtenerEtiquetaQuimestre(),
        parcial: obtenerEtiquetaParcial(),
        "Promedio Final": parseCampoNumerico(fila["PROMEDIO PARCIAL"]),
        "Promedio Comportamiento": parseCampoNumerico(fila["PROMEDIO COMPORTAMIENTO"])
      };
    });
  };

  const esFilaDeshabilitada = (row) => {
    // Si es soloLectura, siempre deshabilitado
    if (soloLectura) return true;

    // Si la fila está guardada (tiene idParcial), está deshabilitada
    // INCLUSO si forceEdit está activo (botón amarillo presionado)
    if (savedKeys && row.idInscripcion) {
      // Construir la clave manualmente usando los valores correctos
      const quim = quimestreSeleccionado; // "1" o "2"
      const parc = parcialSeleccionado; // "1" o "2"
      const rowKey = `${row.idInscripcion}-${quim}-${parc}`;
      if (savedKeys.has(rowKey)) {
        return true; // Bloqueada incluso con forceEdit
      }
    }

    // Si forceEdit está activo y la fila NO está guardada, la desbloqueamos
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

    const datosCompletos = datos.filter(fila => fila["PROMEDIO PARCIAL"] !== undefined);

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

        // Validar que Insumo 1, Insumo 2 y Evaluación Sumativa acepten solo valores entre 0.00 y 10.00
        if (["INSUMO 1", "INSUMO 2", "EVALUACIÓN SUMATIVA"].includes(columnName)) {
          if (value === "") {
            nuevaFila[columnName] = ""; // Permitir borrar el dato
          } else if (!/^\d{0,2}(\.\d{0,2})?$/.test(value) || value > 10 || value < 0) {
            Swal.fire({
              icon: 'error',
              title: 'Error de Validación',
              text: 'El valor debe estar entre 0.00 y 10.00 con máximo dos decimales.',
              confirmButtonColor: '#3085d6',
            });
            return fila; // No actualizar si el valor es inválido
          } else {
            nuevaFila[columnName] = value;
          }
        }

        // Validar que las columnas de comportamiento solo acepten 0 o 1
        else if (columnasComportamiento.includes(columnName)) {
          if (value === "") {
            nuevaFila[columnName] = ""; // Permitir borrar el dato
          } else if (value !== "0" && value !== "1") {
            Swal.fire({
              icon: 'error',
              title: 'Error de Validación',
              text: 'Solo se permite ingresar 0 o 1 en este campo.',
              confirmButtonColor: '#3085d6',
            });
            return fila; // No actualizar si el valor no es 0 o 1
          } else {
            nuevaFila[columnName] = value;
          }
        }

        // Cálculo de suma de comportamiento
        const sumaComportamiento = calcularSumaComportamiento(nuevaFila, columnasComportamiento);
        const { ponderacion70, ponderacion30, promedioParcial } = calcularPromedioParcial(
          nuevaFila["INSUMO 1"],
          nuevaFila["INSUMO 2"],
          nuevaFila["EVALUACIÓN SUMATIVA"]
        );

        // Actualizar los valores en la fila
        return {
          ...nuevaFila,
          "PONDERACIÓN 70%": ponderacion70.toFixed(2),
          "PONDERACIÓN 30%": ponderacion30.toFixed(2),
          "PROMEDIO PARCIAL": promedioParcial.toFixed(2),
          "PROMEDIO COMPORTAMIENTO": sumaComportamiento, // Para la sección de comportamiento
          "VALORACION": calcularValoracionComportamiento(sumaComportamiento),
        };
      }
      return fila;
    });

    setDatos(nuevosDatos);
  };

  const safe = (val) => (val === 0 || val === "0") ? "0" : (val !== undefined && val !== null ? val : "");

  const calcularDatosFila = (fila) => {
    const sumaComportamiento = calcularSumaComportamiento(fila, columnasComportamiento);
    const { ponderacion70, ponderacion30, promedioParcial } = calcularPromedioParcial(
      fila["INSUMO 1"],
      fila["INSUMO 2"],
      fila["EVALUACIÓN SUMATIVA"]
    );

    return {
      ...fila,
      "PONDERACIÓN 70%": ponderacion70.toFixed(2),
      "PONDERACIÓN 30%": ponderacion30.toFixed(2),
      "PROMEDIO PARCIAL": promedioParcial.toFixed(2),
      "PROMEDIO COMPORTAMIENTO": sumaComportamiento,
      "VALORACION": calcularValoracionComportamiento(sumaComportamiento),
    };
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    // ✅ Soporte para materias agrupadas (múltiples asignaciones)
    const esGrupoIndividual = datosModulo?.asignaciones && datosModulo.asignaciones.length > 0;

    if (esGrupoIndividual) {
      // Cargar datos de todas las asignaciones del grupo
      const promesasAsignaciones = datosModulo.asignaciones.map(asignacion => {
        const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${asignacion.ID}`;
        const urlParciales = `${import.meta.env.VITE_URL_DEL_BACKEND}/parciales/asignacion/${asignacion.ID}`;
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
                "RESPETO Y CONSIDERACION": safe(parcialGuardado?.comportamiento?.[0]),
                "VALORACION DE LA DIVERSIDAD": safe(parcialGuardado?.comportamiento?.[1]),
                "CUMPLIMIENTO DE LAS NORMA DE CONVIVENCIA": safe(parcialGuardado?.comportamiento?.[2]),
                "CUIDADO  DEL PATRIMONIO INSTITUCIONAL": safe(parcialGuardado?.comportamiento?.[3]),
                "RESPETO A LA PROPIEDAD AJENA": safe(parcialGuardado?.comportamiento?.[4]),
                "PUNTUALIDAD Y ASISTENCIA": safe(parcialGuardado?.comportamiento?.[5]),
                "HONESTIDAD ": safe(parcialGuardado?.comportamiento?.[6]),
                "PRESENTACION PERSONAL (LIMPIEZA Y UNIFORME)": safe(parcialGuardado?.comportamiento?.[7]),
                "PARTICIPACION COMUNITARIA": safe(parcialGuardado?.comportamiento?.[8]),
                "RESPONSABILIDAD ": safe(parcialGuardado?.comportamiento?.[9]),
                "PONDERACIÓN 70%": "",
                "PONDERACIÓN 30%": "",
                "PROMEDIO PARCIAL": "",
                "PROMEDIO COMPORTAMIENTO": "",
                "NIVEL": abreviarNivel(est.nivel),
                "VALORACION": ""
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
      // Lógica original para materias grupales (una sola asignación)
      const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${datosModulo.ID}`;
      const urlParciales = `${import.meta.env.VITE_URL_DEL_BACKEND}/parciales/asignacion/${datosModulo.ID}`;

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
              "RESPETO Y CONSIDERACION": safe(parcialGuardado?.comportamiento?.[0]),
              "VALORACION DE LA DIVERSIDAD": safe(parcialGuardado?.comportamiento?.[1]),
              "CUMPLIMIENTO DE LAS NORMA DE CONVIVENCIA": safe(parcialGuardado?.comportamiento?.[2]),
              "CUIDADO  DEL PATRIMONIO INSTITUCIONAL": safe(parcialGuardado?.comportamiento?.[3]),
              "RESPETO A LA PROPIEDAD AJENA": safe(parcialGuardado?.comportamiento?.[4]),
              "PUNTUALIDAD Y ASISTENCIA": safe(parcialGuardado?.comportamiento?.[5]),
              "HONESTIDAD ": safe(parcialGuardado?.comportamiento?.[6]),
              "PRESENTACION PERSONAL (LIMPIEZA Y UNIFORME)": safe(parcialGuardado?.comportamiento?.[7]),
              "PARTICIPACION COMUNITARIA": safe(parcialGuardado?.comportamiento?.[8]),
              "RESPONSABILIDAD ": safe(parcialGuardado?.comportamiento?.[9]),
              "PONDERACIÓN 70%": "",
              "PONDERACIÓN 30%": "",
              "PROMEDIO PARCIAL": "",
              "PROMEDIO COMPORTAMIENTO": "",
              "NIVEL": abreviarNivel(est.nivel),
              "VALORACION": ""
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

  const handleGuardar = (
    rowIndex,
    rowData,
    onSuccessCallback,
    onErrorCallback,
    esMasivo = false
  ) => {

    console.log("🟡 [handleGuardar] INICIO", {
      rowIndex,
      idParcial: rowData.idParcial,
      esMasivo
    });

    // 🔹 1. VALIDACIÓN
    const camposVacios = [];

    if (!rowData["INSUMO 1"] || rowData["INSUMO 1"] === "") camposVacios.push("Insumo 1");
    if (!rowData["INSUMO 2"] || rowData["INSUMO 2"] === "") camposVacios.push("Insumo 2");
    if (!rowData["EVALUACIÓN SUMATIVA"] || rowData["EVALUACIÓN SUMATIVA"] === "") camposVacios.push("Evaluación Sumativa");

    columnasComportamiento.forEach(col => {
      if (rowData[col] === "" || rowData[col] === null || rowData[col] === undefined) {
        camposVacios.push(col);
      }
    });

    if (camposVacios.length > 0) {
      console.warn("🔴 [handleGuardar] VALIDACIÓN FALLIDA", camposVacios);

      if (!esMasivo) {
        Swal.fire({
          icon: "warning",
          title: "Faltan datos",
          text: `Debes completar campos`,
        });
      }

      onErrorCallback?.("validacion");
      return;
    }

    console.log("🟢 [handleGuardar] VALIDACIÓN OK");

    // 🔹 2. BODY
    const comportamiento = columnasComportamiento.map((col) =>
      parseInt(rowData[col]) || 0
    );

    const body = {
      id_inscripcion: rowData.idInscripcion,
      insumo1: parseFloat(rowData["INSUMO 1"]),
      insumo2: parseFloat(rowData["INSUMO 2"]),
      evaluacion: parseFloat(rowData["EVALUACIÓN SUMATIVA"]),
      comportamiento,
      quimestre: obtenerEtiquetaQuimestre(),
      parcial: obtenerEtiquetaParcial(),
    };

    console.log("📤 [handleGuardar] BODY:", body);

    // 🔹 3. CREATE
    if (!rowData.idParcial) {
      console.log("🆕 [handleGuardar] CREANDO (POST)");

      axios
        .post(`${import.meta.env.VITE_URL_DEL_BACKEND}/parciales`, body)
        .then((response) => {
          console.log("✅ [POST OK]", response.data);

          if (!esMasivo) {
            Swal.fire({
              icon: "success",
              title: "Guardado",
              text: "La calificación se guardó correctamente ✅",
            });
          }

          onSuccessCallback?.();
        })
        .catch((error) => {
          console.error("❌ [POST ERROR]", error.response?.data || error);
          onErrorCallback?.(error);
        });

      return;
    }

    // 🔹 4. UPDATE
    console.log("✏️ [handleGuardar] ACTUALIZANDO (PUT)");

    axios
      .put(`${import.meta.env.VITE_URL_DEL_BACKEND}/parciales/${rowData.idParcial}`, body)
      .then(() => {
        console.log("✅ [PUT OK]");

        if (!esMasivo) {
          Swal.fire({
            icon: "success",
            title: "Actualizado",
            text: "La calificación se actualizó correctamente ✅",
          });
        }

        onSuccessCallback?.();
      })
      .catch((error) => {
        console.error("❌ [PUT ERROR]", error.response?.data || error);
        onErrorCallback?.(error);
      });
  };
  useEffect(() => {
    if (activo && onGuardarTodo) {
      console.log("📌 Registrando handleGuardarTodo desde Parcial:", idContenedor);
      onGuardarTodo(handleGuardarTodo);
    }
  }, [activo, datos]);

  const handleGuardarTodo = async () => {

    console.log("🚀 [handleGuardarTodo] INICIO");

    // 🔴 VALIDACIÓN GLOBAL
    const hayIncompletos = datos.some((fila, i) => {

      const incompleto =
        !fila["INSUMO 1"] ||
        !fila["INSUMO 2"] ||
        !fila["EVALUACIÓN SUMATIVA"] ||
        columnasComportamiento.some(col =>
          fila[col] === "" || fila[col] === null || fila[col] === undefined
        );

      if (incompleto) {
        console.warn("🔴 Fila incompleta:", i, fila);
      }

      return incompleto;
    });

    if (hayIncompletos) {
      console.error("⛔ [handleGuardarTodo] BLOQUEADO por datos incompletos");

      Swal.fire({
        icon: "warning",
        title: "Filas incompletas",
        text: `Debes completar todas las calificaciones.`,
      });

      return;
    }

    console.log("🟢 [handleGuardarTodo] VALIDACIÓN GLOBAL OK");

    let errores = [];

    for (const [i, fila] of datos.entries()) {
      console.log("➡️ Guardando fila:", i);

      try {
        await new Promise((resolve, reject) => {
          handleGuardar(i, fila, resolve, reject, true);
        });

        console.log("✅ Fila guardada:", i);

      } catch (err) {
        console.error("❌ Error en fila:", i, err);
        errores.push(i);
      }
    }

    console.log("📊 Resultado final:", { errores });

    if (errores.length === 0) {
      Swal.fire({
        icon: "success",
        title: "Guardado completo",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Errores al guardar",
      });
    }

    onGuardarTodoFinished?.();
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
          .delete(`${import.meta.env.VITE_URL_DEL_BACKEND}/parciales/${rowData.idParcial}`)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Eliminado",
              text: "Las calificaciones se eliminaron correctamente.",
            }).then(() => {
              // Actualizar el estado local sin recargar la página
              // 1. Remover la fila eliminada del array de datos
              const nuevosDatos = datos.map((fila, i) => {
                if (i === rowIndex) {
                  // Resetear los valores de esta fila a vacíos
                  return {
                    ...fila,
                    idParcial: null,
                    "INSUMO 1": "",
                    "INSUMO 2": "",
                    "EVALUACIÓN SUMATIVA": "",
                    "PONDERACIÓN 70%": "",
                    "PONDERACIÓN 30%": "",
                    "PROMEDIO PARCIAL": "",
                    ...columnasComportamiento.reduce((acc, col) => ({ ...acc, [col]: "" }), {}),
                    "PROMEDIO COMPORTAMIENTO": "",
                    "NIVEL": "",
                    "VALORACION": ""
                  };
                }
                return fila;
              });

              setDatos(nuevosDatos);
              setDatosOriginales(JSON.parse(JSON.stringify(nuevosDatos)));

              // 2. Remover de savedKeys
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
    <div id={idContenedor} className="container tabla-parciales">
      <HeaderTabla datosEncabezado={datosEncabezado} imagenIzquierda={"/ConservatorioNacional.png"} />
      {!isWithinRange && (
        <div className="alert alert-warning text-center screen-only">
          🕒 {rangoTexto || "Este parcial aún no está disponible para edición."}
        </div>
      )}
      <Tabla
        habilitarTodasFilas={globalEdit}
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

export default Parcial;