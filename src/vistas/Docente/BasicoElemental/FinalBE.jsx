import React, { useState, useEffect, useMemo } from "react";
import HeaderTabla from "../../../components/HeaderTabla";
import Tabla from "../../../components/Tabla";
import axios from "axios";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import "../Parcial.css";

const FinalBE = ({ globalEdit, quim1Data, quim2Data, datosModulo, escala, editingRow, setEditingRow }) => {
  const [datos, setDatos] = useState([]);
  const idContenedor = `pdf-final`;

  // Convierte valor numérico a escala cualitativa o cuantitativa
  const convertirNota = (valor) => {
    const n = parseFloat(valor);
    if (isNaN(n)) return "";
    if (escala === "cuantitativa") {
      if (n >= 9) return "DA";
      if (n >= 7) return "AA";
      if (n >= 4) return "PA";
      return "NA";
    }
    // escala cualitativa
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
  };

  // Determina jornada (matutina/vespertina)
  const determinarJornada = (horario) => {
    const hora = parseInt(horario.split("-")[0].split(":")[0], 10);
    return hora < 12 ? "Matutina" : "Vespertina";
  };

  // Carga y combina datos de quimestres, sin examen supletorio
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const esGrupoIndividual = datosModulo?.asignaciones && datosModulo.asignaciones.length > 0;
    
    if (esGrupoIndividual) {
      // Caso individual: iterar sobre cada asignación
      const promesasAsignaciones = datosModulo.asignaciones.map(asignacion => {
        const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${asignacion.ID}`;
        return axios.get(urlInscripciones)
          .then(resp => ({ asignacion, estudiantes: resp.data }));
      });

      Promise.all(promesasAsignaciones)
        .then(resultados => {
          let nroGlobal = 1;
          const todosLosDatos = [];

          resultados.forEach(({estudiantes }) => {
            if (!estudiantes || estudiantes.length === 0) return;

            estudiantes.forEach(est => {
              const q1 = quim1Data.find(q => String(q.id_inscripcion) === String(est.idInscripcion)) || {};
              const q2 = quim2Data.find(q => String(q.id_inscripcion) === String(est.idInscripcion)) || {};
              const n1 = parseFloat(q1["Promedio Final"]) || 0;
              const n2 = parseFloat(q2["Promedio Final"]) || 0;
              const promedio = (n1 + n2) / 2;
              const estado = promedio >= 7 ? "Aprobado" : "Reprobado";

              todosLosDatos.push({
                idInscripcion: est.idInscripcion,
                Nro: nroGlobal++,
                "Nómina de Estudiantes": est.nombre,
                "Primer Quimestre": n1.toFixed(2),
                "Segundo Quimestre": n2.toFixed(2),
                "Promedio Final": promedio.toFixed(2),
                "Escala": convertirNota(promedio.toFixed(2)),
                "Estado": estado
              });
            });
          });

          // Ordenar alfabéticamente
          todosLosDatos.sort((a, b) => a["Nómina de Estudiantes"].localeCompare(b["Nómina de Estudiantes"]));
          // Reasignar números
          todosLosDatos.forEach((fila, i) => { fila.Nro = i + 1; });

          setDatos(todosLosDatos);
        })
        .catch(err => ErrorMessage(err));
    } else if (datosModulo?.ID) {
      // Caso grupal: usar ID directo
      const urlInscripciones = `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${datosModulo.ID}`;

      axios.get(urlInscripciones)
        .then(resp => {
          const estudiantes = resp.data;
          
          if (!estudiantes || estudiantes.length === 0) {
            setDatos([]);
            return;
          }
          
          const combinados = estudiantes.map(est => {
            const q1 = quim1Data.find(q => String(q.id_inscripcion) === String(est.idInscripcion)) || {};
            const q2 = quim2Data.find(q => String(q.id_inscripcion) === String(est.idInscripcion)) || {};
            const n1 = parseFloat(q1["Promedio Final"]) || 0;
            const n2 = parseFloat(q2["Promedio Final"]) || 0;
            const promedio = (n1 + n2) / 2;
            const estado = promedio >= 7 ? "Aprobado" : "Reprobado";
            return {
              idInscripcion: est.idInscripcion,
              Nro: est.nro,
              "Nómina de Estudiantes": est.nombre,
              "Primer Quimestre": n1.toFixed(2),
              "Segundo Quimestre": n2.toFixed(2),
              "Promedio Final": promedio.toFixed(2),
              "Escala": convertirNota(promedio.toFixed(2)),
              "Estado": estado
            };
          });
          setDatos(combinados);
        })
        .catch(err => ErrorMessage(err));
    }
  }, [datosModulo, quim1Data, quim2Data, escala]);

  // Header de la tabla
  const datosEncabezado = {
    titulo: "CONSERVATORIO NACIONAL DE MUSICA",
    subtitulo: "ACTA DE CALIFICACIONES - FINAL BE",
    info: {
      Profesor: datosModulo.docente || (datosModulo.asignaciones?.[0]?.docente),
      Asignatura: datosModulo.materia || datosModulo.nombreMateria,
      Curso: datosModulo.asignaciones ? `Niveles ${datosModulo.tipoNivel}` : datosModulo.año,
      Paralelo: datosModulo.asignaciones ? "Múltiples" : datosModulo.paralelo,
      "Año Lectivo": datosModulo.periodo || (datosModulo.asignaciones?.[0]?.periodo),
      Jornada: datosModulo.horario ? determinarJornada(datosModulo.horario) : (datosModulo.asignaciones?.[0]?.horario ? determinarJornada(datosModulo.asignaciones[0].horario) : "")
    }
  };

  // Columnas agrupadas y nombres
  const columnasAgrupadas = [
    { titulo: "", colspan: 2 },
    { titulo: "RESULTADOS FINALES", colspan: 4 },
    { titulo: "", colspan: 1 }
  ];
  const columnas = [
    "Primer Quimestre",
    "Segundo Quimestre",
    "Promedio Final",
    "Escala",
    "Estado"
  ];

  // Formatea filas con estilos condicionales
  const datosConEstilos = useMemo(() => {
    return datos.map(row => ({
      ...row,
      "Estado": row.Estado === "Aprobado"
        ? <span style={{ backgroundColor: "green", color: "#fff", padding: "2px 4px" }}>Aprobado</span>
        : <span style={{ backgroundColor: "red", color: "#fff", padding: "2px 4px" }}>Reprobado</span>
    }));
  }, [datos]);

  return (
    <div id={idContenedor} className="container tabla-final-be">
      <HeaderTabla datosEncabezado={datosEncabezado} imagenIzquierda="/ConservatorioNacional.png" />
      <Tabla
        habilitarTodasFilas={globalEdit}
        columnasAgrupadas={columnasAgrupadas}
        columnas={columnas}
        datos={datosConEstilos}
        columnasEditables={[]}
        inputsDisabled={true}
        soloLectura={true}
        editingRow={editingRow}
        setEditingRow={setEditingRow}
      />
    </div>
  );
};

export default FinalBE;
