import React, { useState, useEffect } from "react";
import HeaderTabla from "../../components/HeaderTabla";
import Tabla from "../../components/Tabla";
import Swal from 'sweetalert2';
import axios from "axios";
import { ErrorMessage } from "../../Utils/ErrorMesaje";
import { calcularPromedioQuimestral, calcularPromedioComportamiento, calcularValoracionComportamiento, abreviarNivel } from "./Promedios";
import "./Parcial.css";

const Quimestral = ({ activo, onGuardarTodoFinished, onGuardarTodo, globalEdit, quimestreSeleccionado, parcial1Data, parcial2Data, actualizarDatosQuim, datosModulo, inputsDisabled, onEditar, isWithinRange, rangoTexto, forceEdit, soloLectura, esPorSolicitud, savedKeysQuim, makeKeyQuim, agregarSavedKeyQuim, editingRow, setEditingRow }) => {

  const idContenedor = `pdf-quimestral-quim${quimestreSeleccionado}`;

  // Estado que contendrá los datos combinados (por estudiante) provenientes de los parciales
  const [datos, setDatos] = useState([]);


  const obtenerEtiquetaQuimestre = () => {
    return quimestreSeleccionado === "1" ? "Q1" : "Q2";
  };

  function parseCampoNumerico(valor) {
    if (typeof valor === "string" && valor.trim() === "") {
      return null; // vacío
    }
    const parsed = parseFloat(valor);
    return isNaN(parsed) ? null : parsed;
  }

  const transformarDatosQuimestralParaGuardar = (datos) => {
    return datos.map((fila) => {
      return {
        id_inscripcion: fila.idInscripcion, // 👈 ojo con la nomenclatura
        examen: parseCampoNumerico(fila["Examen"]),
        quimestre: obtenerEtiquetaQuimestre(),
        "Promedio Completo": parseCampoNumerico(fila["Promedio Final"]),
        "Promedio Comportamiento Completo": parseCampoNumerico(fila["Promedio Comportamiento"])
      };
    });
  };

  const [datosOriginales, setDatosOriginales] = useState([]);

  const getInscripcionId = (row) => row?.id_inscripcion ?? row?.idInscripcion;
  const getPromedioParcial = (row) => {
    const value = row?.["Promedio Final"] ?? row?.["PROMEDIO PARCIAL"] ?? row?.promedioFinal ?? 0;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // Cada vez que lleguen datos de ambos parciales, se combinan
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    const esGrupoIndividual = datosModulo?.asignaciones && datosModulo.asignaciones.length > 0;

    if (esGrupoIndividual) {
      // Cargar datos de todas las asignaciones del grupo
      const promesasAsignaciones = datosModulo.asignaciones.map(asignacion => {
        const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${asignacion.ID}`;
        const urlQuimestrales = `${import.meta.env.VITE_URL_DEL_BACKEND}/quimestrales/asignacion/${asignacion.ID}`;
        return Promise.all([axios.get(urlInscripciones), axios.get(urlQuimestrales)])
          .then(([respEstudiantes, respQuimestrales]) => ({
            asignacion,
            estudiantes: respEstudiantes.data,
            quimestrales: respQuimestrales.data
          }));
      });

      Promise.all(promesasAsignaciones)
        .then(resultados => {
          const todosLosDatos = [];

          resultados.forEach(({ asignacion, estudiantes, quimestrales }) => {
            estudiantes.forEach(est => {
              const p1 = parcial1Data.find(p => String(getInscripcionId(p)) === String(est.idInscripcion)) || {};
              const p2 = parcial2Data.find(p => String(getInscripcionId(p)) === String(est.idInscripcion)) || {};
              const saved = quimestrales.find(q =>
                String(getInscripcionId(q)) === String(est.idInscripcion) &&
                q.quimestre === obtenerEtiquetaQuimestre()
              ) || {};

              const parcial1 = getPromedioParcial(p1);
              const parcial2 = getPromedioParcial(p2);
              const notaExamen = saved.examen ?? "";

              const { ponderacion70, ponderacion30, promedioFinal } = calcularPromedioQuimestral(parcial1, parcial2, notaExamen);

              const comportamientoP1 = p1["Promedio Comportamiento"];
              const comportamientoP2 = p2["Promedio Comportamiento"];
              const comportamientoTotal = calcularPromedioComportamiento(comportamientoP1, comportamientoP2);
              const comportamientoFinal = calcularValoracionComportamiento(comportamientoTotal);

              todosLosDatos.push({
                idInscripcion: est.idInscripcion,
                idQuimestral: saved.id,
                idAsignacion: asignacion.ID,
                "Nro": 0, // Se asignará después de ordenar
                "Nómina de Estudiantes": est.nombre,
                "Primer Parcial": parcial1.toFixed(2),
                "Segundo Parcial": parcial2.toFixed(2),
                "Ponderación 70%": ponderacion70.toFixed(2),
                "Examen": notaExamen,
                "Ponderación 30%": ponderacion30.toFixed(2),
                "Promedio Final": promedioFinal.toFixed(2),
                "Promedio Comportamiento": comportamientoTotal.toFixed(2),
                "Nivel": abreviarNivel(est.nivel),
                "Comportamiento Final": comportamientoFinal,
              });
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
          actualizarDatosQuim(todosLosDatos);
        })
        .catch(err => {
          ErrorMessage(err);
        });
    } else if (datosModulo?.ID) {
      // Lógica original para materias grupales
      const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${datosModulo.ID}`;
      const urlQuimestrales = `${import.meta.env.VITE_URL_DEL_BACKEND}/quimestrales/asignacion/${datosModulo.ID}`;

      Promise.all([axios.get(urlInscripciones), axios.get(urlQuimestrales)])
        .then(([respEstudiantes, respQuimestrales]) => {
          const estudiantes = respEstudiantes.data;
          const quimestrales = respQuimestrales.data;
          const nuevosDatos = estudiantes.map(est => {
            const p1 = parcial1Data.find(p => String(getInscripcionId(p)) === String(est.idInscripcion)) || {};
            const p2 = parcial2Data.find(p => String(getInscripcionId(p)) === String(est.idInscripcion)) || {};
            const saved = quimestrales.find(q =>
              String(getInscripcionId(q)) === String(est.idInscripcion) &&
              q.quimestre === obtenerEtiquetaQuimestre()
            ) || {};

            const parcial1 = getPromedioParcial(p1);
            const parcial2 = getPromedioParcial(p2);
            const notaExamen = saved.examen ?? "";

            const { ponderacion70, ponderacion30, promedioFinal } = calcularPromedioQuimestral(parcial1, parcial2, notaExamen);

            const comportamientoP1 = p1["Promedio Comportamiento"];
            const comportamientoP2 = p2["Promedio Comportamiento"];
            const comportamientoTotal = calcularPromedioComportamiento(comportamientoP1, comportamientoP2);
            const comportamientoFinal = calcularValoracionComportamiento(comportamientoTotal);

            return {
              idInscripcion: est.idInscripcion,
              idQuimestral: saved.id,
              "Nro": est.nro,
              "Nómina de Estudiantes": est.nombre,
              "Primer Parcial": parcial1.toFixed(2),
              "Segundo Parcial": parcial2.toFixed(2),
              "Ponderación 70%": ponderacion70.toFixed(2),
              "Examen": notaExamen,
              "Ponderación 30%": ponderacion30.toFixed(2),
              "Promedio Final": promedioFinal.toFixed(2),
              "Promedio Comportamiento": comportamientoTotal.toFixed(2),
              "Nivel": abreviarNivel(est.nivel),
              "Comportamiento Final": comportamientoFinal,
            };
          });
          setDatos(nuevosDatos);
          setDatosOriginales(JSON.parse(JSON.stringify(nuevosDatos)));
          actualizarDatosQuim(nuevosDatos);
        })
        .catch(err => {
          ErrorMessage(err);
        });
    }
  }, [datosModulo, parcial1Data, parcial2Data, quimestreSeleccionado]);

  useEffect(() => {
    // Sólo disparar cuando ya tengamos filas con cálculo listo
    if (!datos || datos.length === 0) return;

    // Filtra filas válidas (aquí todas tienen “Promedio Final” calculado)
    const datosCompletos = datos.filter(fila => fila["Promedio Final"] !== undefined && fila["Comportamiento Final"] !== undefined);

    if (typeof actualizarDatosQuim === "function" && datosCompletos.length > 0) {
      const datosTransformados = transformarDatosQuimestralParaGuardar(datosCompletos);
      actualizarDatosQuim(datosTransformados);
    }
  }, [datos, actualizarDatosQuim, quimestreSeleccionado]);

  // Función para manejar cambios en los inputs de la tabla (en este caso, solo para la columna "Examen")
  const handleInputChange = (rowIndex, columnName, value) => {
    // La validación de si está bloqueado ya se maneja en el atributo 'disabled' de los inputs
    // que considera editingRow, savedKeys y rangos de fecha correctamente

    const nuevosDatos = datos.map((fila, i) => {
      if (i === rowIndex) {
        let nuevaFila = { ...fila };

        if (columnName === "Examen") {
          if (value === "") {
            nuevaFila["Examen"] = "";
          } else if (!/^\d{0,2}(\.\d{0,2})?$/.test(value) || value > 10 || value < 0) {
            Swal.fire({
              icon: 'error',
              title: 'Error de Validación',
              text: 'El valor debe estar entre 0.00 y 10.00 con máximo dos decimales.',
              confirmButtonColor: '#3085d6',
            });
            return fila;
          } else {
            nuevaFila["Examen"] = value;
          }
        }

        // Recalcular la ponderación del examen y el promedio final
        const parcial1 = nuevaFila["Primer Parcial"];
        const parcial2 = nuevaFila["Segundo Parcial"];
        const { ponderacion30, promedioFinal } = calcularPromedioQuimestral(parcial1, parcial2, nuevaFila["Examen"]);

        nuevaFila["Ponderación 30%"] = ponderacion30.toFixed(2);
        nuevaFila["Promedio Final"] = promedioFinal.toFixed(2);

        return nuevaFila;
      }
      return fila;
    });
    setDatos(nuevosDatos);
  };

  const subtitulo = `ACTA DE RESUMEN DEL ${quimestreSeleccionado === "1" ? "PRIMER" : "SEGUNDO"} QUIMESTRE`;

  const determinarJornada = (horario) => {
    const horaInicio = horario.split("-")[0];
    const horaNumerica = parseInt(horaInicio.split(":")[0], 10);
    return horaNumerica < 12 ? "Matutina" : "Vespertina";
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
    { titulo: "RESUMEN DE APRENDIZAJES Y COMPORTAMIENTO", colspan: 9 },
  ];

  const columnas = [
    "Primer Parcial", "Segundo Parcial", "Ponderación 70%",
    "Examen", "Ponderación 30%", "Promedio Final", "Promedio Comportamiento", "Nivel", "Comportamiento Final"
  ];

  // Indicamos que la columna "Examen" es editable, similar a como se hace en el componente de Parcial
  const columnasEditables = ["Examen"];

  // Función que determina si una fila específica está deshabilitada
  const esFilaDeshabilitada = (row) => {
    // Si es soloLectura, siempre deshabilitado
    if (soloLectura) return true;

    // Si la fila está guardada (tiene idQuimestral), está deshabilitada
    // INCLUSO si forceEdit está activo (botón amarillo presionado)
    if (savedKeysQuim && row.idInscripcion) {
      const quim = quimestreSeleccionado; // "1" o "2"
      const rowKey = `${row.idInscripcion}-${quim}`;
      if (savedKeysQuim.has(rowKey)) {
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

  const handleGuardar = (
    rowIndex,
    rowData,
    onSuccessCallback,
    onErrorCallback,
    esMasivo = false
  ) => {

    console.log("🚀 [Quimestral] handleGuardar", { rowIndex, rowData, esMasivo });

    // 🔹 VALIDACIÓN
    if (!rowData["Examen"] || rowData["Examen"] === "") {

      if (!esMasivo) {
        Swal.fire({
          icon: "warning",
          title: "Faltan datos",
          text: "Debes ingresar la nota del examen antes de guardar.",
        });
      }

      onErrorCallback?.("validacion");
      return;
    }

    const examen = parseFloat(rowData["Examen"]);

    if (isNaN(examen) || examen < 0 || examen > 10) {

      if (!esMasivo) {
        Swal.fire({
          icon: "error",
          title: "Valor inválido",
          text: "La nota debe estar entre 0 y 10",
        });
      }

      onErrorCallback?.("validacion");
      return;
    }

    const body = {
      id_inscripcion: rowData.idInscripcion,
      quimestre: obtenerEtiquetaQuimestre(),
      examen,
    };

    console.log("📡 [Quimestral] body:", body);

    // 🔹 CREATE
    if (!rowData.idQuimestral) {
      axios.post(`${import.meta.env.VITE_URL_DEL_BACKEND}/quimestrales`, body)
        .then((response) => {

          console.log("✅ [Quimestral] creado:", response.data);

          if (!esMasivo) {
            Swal.fire({
              icon: "success",
              title: "Creado",
              text: "Guardado correctamente",
            });
          }

          const nuevoId = response.data?.ID || response.data?.id || response.data?.insertId || null;

          const copia = [...datos];
          copia[rowIndex] = { ...rowData, idQuimestral: nuevoId };
          setDatos(copia);

          const copiaOriginal = [...datosOriginales];
          copiaOriginal[rowIndex] = JSON.parse(JSON.stringify(copia[rowIndex]));
          setDatosOriginales(copiaOriginal);

          if (agregarSavedKeyQuim && makeKeyQuim) {
            const key = makeKeyQuim({
              id_inscripcion: rowData.idInscripcion,
              quimestre: obtenerEtiquetaQuimestre()
            });
            agregarSavedKeyQuim(key);
          }

          onSuccessCallback?.();
        })
        .catch((error) => {

          console.error("❌ [Quimestral] error create:", error);

          if (!esMasivo) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "No se pudo guardar",
            });
          }

          onErrorCallback?.(error);
        });

      return;
    }

    // 🔹 UPDATE
    const original = datosOriginales[rowIndex];
    const haCambiado = JSON.stringify(rowData) !== JSON.stringify(original);

    if (!haCambiado && !globalEdit) {
      console.log("⚠️ [Quimestral] sin cambios");

      onSuccessCallback?.(); // importante en masivo
      return;
    }

    axios.put(`${import.meta.env.VITE_URL_DEL_BACKEND}/quimestrales/${rowData.idQuimestral}`, body)
      .then(() => {

        console.log("✅ [Quimestral] actualizado");

        if (!esMasivo) {
          Swal.fire({
            icon: "success",
            title: "Actualizado",
          });
        }

        const copia = [...datosOriginales];
        copia[rowIndex] = JSON.parse(JSON.stringify(rowData));
        setDatosOriginales(copia);

        if (agregarSavedKeyQuim && makeKeyQuim) {
          const key = makeKeyQuim({
            id_inscripcion: rowData.idInscripcion,
            quimestre: obtenerEtiquetaQuimestre()
          });
          agregarSavedKeyQuim(key);

          setDatos([...datos]);
        }

        onSuccessCallback?.();
      })
      .catch((error) => {

        console.error("❌ [Quimestral] error update:", error);

        if (!esMasivo) {
          Swal.fire({
            icon: "error",
            title: "Error al actualizar",
          });
        }

        onErrorCallback?.(error);
      });
  };
  const handleGuardarAsync = (i, fila) => {
    return new Promise((resolve, reject) => {
      handleGuardar(i, fila, resolve, reject);
    });
  };
  useEffect(() => {
    if (activo && onGuardarTodo) {
      console.log("📌 Registrando handleGuardarTodo desde Quimestral");
      onGuardarTodo(handleGuardarTodo);
    }
  }, [activo, datos]);

  const handleGuardarTodo = async () => {


    // ✅ 2. GUARDADO TOTAL (solo si TODO está correcto)
    let errores = [];

    for (const [i, fila] of datos.entries()) {
      try {
        await handleGuardarAsync(i, fila);
      } catch {
        errores.push(i);
      }
    }

    // ✅ 3. RESULTADO FINAL
    if (errores.length === 0) {
      Swal.fire({
        icon: "success",
        title: "Guardado completo",
        text: "Todas las filas se guardaron correctamente ✅",
      });

      if (onGuardarTodoFinished) onGuardarTodoFinished();
    } else {
      Swal.fire({
        icon: "warning",
        title: "Filas incompletas",
        text: `Debes completar todas las calificaciones.`,
      });
    }
  };
  const handleEliminar = (rowIndex, rowData) => {
    if (!rowData.idQuimestral) {
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
      text: `¿Estás seguro de eliminar las calificaciones quimestrales de ${rowData["Nómina de Estudiantes"]}? Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${import.meta.env.VITE_URL_DEL_BACKEND}/quimestrales/${rowData.idQuimestral}`)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Eliminado",
              text: "Las calificaciones quimestrales se eliminaron correctamente.",
            }).then(() => {
              // Actualizar el estado local sin recargar
              const nuevosDatos = datos.map((fila, i) => {
                if (i === rowIndex) {
                  return {
                    ...fila,
                    idQuimestral: null,
                    "Examen": "",
                    "Promedio Quimestral": "",
                    "Examen Supletorio": ""
                  };
                }
                return fila;
              });

              setDatos(nuevosDatos);
              setDatosOriginales(JSON.parse(JSON.stringify(nuevosDatos)));

              // Remover de savedKeys
              if (savedKeysQuim && makeKeyQuim) {
                const key = makeKeyQuim({
                  id_inscripcion: rowData.idInscripcion,
                  quimestre: obtenerEtiquetaQuimestre()
                });
                savedKeysQuim.delete(key);
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
    <div id={idContenedor} className="container tabla-quimestral">
      <HeaderTabla
        datosEncabezado={datosEncabezado}
        imagenIzquierda={"/ConservatorioNacional.png"}
        imagenDerecha={"/Ministerio.png"}
      />
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
};

export default Quimestral;