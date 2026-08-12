import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Loading from "../../../components/Loading";
import HeaderTabla from "../../../components/HeaderTabla";
import Swal from "sweetalert2";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import { getModulos, transformModulesForLayout } from "../../getModulos";
import { calcularPromedioFinalNormal } from "./Promedio";
import { calcularPromedioFinalBE } from "./PromedioBe";

// NUEVO
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ReporteEstudiante() {
  const { estudiante, esBE } = useLocation().state || {};
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [materiasQuim, setMateriasQuim] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [modules, setModules] = useState([]);
  const [tabActiva, setTabActiva] = useState("q1");
  const [nivelHistorico, setNivelHistorico] = useState(estudiante?.nivel || "");

  // ---- ref para el certificado completo ----
  const certificadoRef = useRef(null);

  const obtenerCualitativa = (n) => {
    if (n >= 9) return "Domina los aprendizajes requeridos";
    if (n >= 7) return "Alcanza los aprendizajes requeridos";
    if (n > 4) return "Está próximo a alcanzar los aprendizajes requeridos";
    return "No alcanza los aprendizajes requeridos";
  };

  useEffect(() => {
    if (!estudiante?.idMatricula) {
      Swal.fire("Error", "No encontramos la matrícula del estudiante.", "error");
      return navigate("/secretaria/reportes");
    }

    const su = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");
    if (!su || !token) return navigate("/");
    const u = JSON.parse(su);
    setUsuario(u);
    setModules(transformModulesForLayout(getModulos(u.subRol, true)));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const fetchNotas = async () => {
      try {
        const { data: inscData } = await axios.get(
          `${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/obtener/matricula/${estudiante.idMatricula}`
        );
        if (inscData.length > 0) {
          // Ajusta esta ruta según la estructura exacta de tu JSON del backend
          const matriculaInfo = inscData[0]?.Matricula;
          if (matriculaInfo) {
            setNivelHistorico(matriculaInfo.nivel);

          }
        }
        const resultados = [];
        const resultadosQuim = [];
        for (const insc of inscData) {
          if (esBE) {
            const { data: parciales } = await axios.get(
              `${import.meta.env.VITE_URL_DEL_BACKEND}/parcialesbe/asignacion/${insc.ID_asignacion}`
            );
            const { data: quimestrales } = await axios.get(
              `${import.meta.env.VITE_URL_DEL_BACKEND}/quimestralesbe/asignacion/${insc.ID_asignacion}`
            );

            const { promedioFinal, detalle } = calcularPromedioFinalBE(
              parciales,
              quimestrales,
              insc.ID
            );

            resultados.push({
              Asignatura: insc.Asignacion?.Materia?.nombre || "—",
              "Promedio Final": promedioFinal?.toFixed(2) || "—",
              "Calificación Cualitativa": promedioFinal
                ? obtenerCualitativa(promedioFinal)
                : "—",
            });

            resultadosQuim.push({
              Asignatura: insc.Asignacion?.Materia?.nombre || "—",
              "Prom. Q1": detalle?.q1Final?.toFixed(2) ?? "—",
              "Cuali. Q1": detalle?.q1Final ? obtenerCualitativa(detalle.q1Final) : "—",
              "Prom. Q2": detalle?.q2Final?.toFixed(2) ?? "—",
              "Cuali. Q2": detalle?.q2Final ? obtenerCualitativa(detalle.q2Final) : "—",
            });
          } else {
            const { data: parciales } = await axios.get(
              `${import.meta.env.VITE_URL_DEL_BACKEND}/parciales/asignacion/${insc.ID_asignacion}`
            );
            const { data: quimestrales } = await axios.get(
              `${import.meta.env.VITE_URL_DEL_BACKEND}/quimestrales/asignacion/${insc.ID_asignacion}`
            );
            const { data: finales } = await axios.get(
              `${import.meta.env.VITE_URL_DEL_BACKEND}/finales/asignacion/${insc.ID_asignacion}`
            );

            const { promedioFinal, detalle } = calcularPromedioFinalNormal(
              parciales,
              quimestrales,
              finales,
              insc.ID
            );

            // Buscamos si existe un registro de supletorio guardado para esta inscripción específica
            const supletorioGuardado = finales.find(f => f.idInscripcion === insc.ID);
            const tieneSupletorio = supletorioGuardado?.examenRecuperacion ?? supletorioGuardado?.examen_recuperacion ?? "";

            const obtenerEstadoDinamico = (nota, supletorio) => {
              if (nota >= 7) return "Aprobado";
              // Si tiene un supletorio registrado pero la nota final sigue siendo menor a 7, significa que reprobó el supletorio
              if (supletorio !== "") return "Reprobado";
              if (nota >= 4) return "Supletorio";
              return "Reprobado";
            };

            resultados.push({
              Asignatura: insc.Asignacion?.Materia?.nombre || "—",
              "Promedio Final": promedioFinal?.toFixed(2) || "—",
              "Calificación Cualitativa": promedioFinal
                ? obtenerEstadoDinamico(promedioFinal, tieneSupletorio)
                : "—",
            });

            resultadosQuim.push({
              Asignatura: insc.Asignacion?.Materia?.nombre || "—",
              "Prom. Q1": detalle?.finalQ1?.toFixed(2) ?? "—",
              "Cuali. Q1": detalle?.finalQ1 ? obtenerCualitativa(detalle.finalQ1) : "—",
              "Prom. Q2": detalle?.finalQ2?.toFixed(2) ?? "—",
              "Cuali. Q2": detalle?.finalQ2 ? obtenerCualitativa(detalle.finalQ2) : "—",
            });
          }
        }

        setMaterias(resultados);
        setMateriasQuim(resultadosQuim);
      } catch (err) {
        ErrorMessage(err);
        Swal.fire("Error", "No se pudo calcular la nota final.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, [estudiante, navigate, esBE]);

  if (loading) return <Loading />;

  const datosEncabezado = {
    titulo: "CONSERVATORIO NACIONAL DE MÚSICA",
    subtitulo: "CERTIFICADO DE PROMOCIÓN",
    info: {
      Estudiante: estudiante.nombre,
      Cédula: estudiante.cedula,
      Nivel: nivelHistorico,
      "Año Lectivo": estudiante.anioLectivo,
    },
  };

  const columnas = ["Asignatura", "Promedio Final", "Calificación Cualitativa"];

  // ---- Exportar a PDF ----
  const handleExportPDF = async () => {
    if (!certificadoRef.current) return;

    try {
      // 1) Clonar el certificado y renderizarlo en un contenedor oculto
      const original = certificadoRef.current;
      const clonedContent = original.cloneNode(true);
      const tempContainer = document.createElement("div");

      const renderWidth = 1000;   // ancho fijo para la captura
      const renderScale = 3;      // calidad

      tempContainer.style.width = `${renderWidth}px`;
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.background = "#ffffff";

      document.body.appendChild(tempContainer);
      tempContainer.appendChild(clonedContent);

      // Aseguramos que el clon use todo el ancho del contenedor fijo
      clonedContent.style.width = "100%";
      clonedContent.style.boxSizing = "border-box";

      // pequeña pausa para que el navegador pinte estilos
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 2) Captura con html2canvas sobre el CLON, con tamaño controlado
      const canvas = await html2canvas(clonedContent, {
        scale: renderScale,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: renderWidth,
        width: renderWidth,
        scrollX: 0,
        scrollY: 0,
      });

      // limpiamos el DOM temporal
      document.body.removeChild(tempContainer);

      // 3) Generar PDF A4 vertical con tamaño estable
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 20;
      const marginTop = 25;

      const maxWidth = pageWidth - marginX * 2;
      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // si algún día se pasa mucho en alto, lo recortamos un poco
      if (imgHeight > pageHeight - marginTop * 2) {
        imgHeight = pageHeight - marginTop * 2;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = marginTop;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`Certificado-${estudiante?.nombre || "estudiante"}.pdf`);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo generar el PDF.", "error");
    }
  };

  return (
    <>
      <div className="container-fluid p-0 sticky-header">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>
      <Layout modules={modules}>
        <div className="content-container mt-3">

          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            {/* Botón regresar a la izquierda */}
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-3"
              style={{ maxWidth: "120px" }}
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left-circle-fill"></i> Regresar
            </button>

            {/* Exportaciones a la derecha */}
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold">Exportaciones:</span>
              <button
                className="btn btn-danger btn-sm btn-export-pdf d-flex align-items-center justify-content-center"
                onClick={handleExportPDF}
                title="Exportar certificado a PDF"
              >
                <i className="bi bi-filetype-pdf"></i>
              </button>
            </div>
          </div>

          {/* certificado completo */}
          <div className="certificado-container" ref={certificadoRef}>
            <HeaderTabla
              datosEncabezado={datosEncabezado}
              imagenIzquierda="/ConservatorioNacional.png"
              imagenDerecha="/Ministerio.png"
            />

            {/* Pestañas Q1 / Q2 / Final */}
            <ul className="nav nav-tabs mt-3 mb-0">
              <li className="nav-item">
                <button
                  className={`nav-link ${tabActiva === "q1" ? "active" : ""}`}
                  onClick={() => setTabActiva("q1")}
                  type="button"
                >
                  Quimestre 1
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${tabActiva === "q2" ? "active" : ""}`}
                  onClick={() => setTabActiva("q2")}
                  type="button"
                >
                  Quimestre 2
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${tabActiva === "final" ? "active" : ""}`}
                  onClick={() => setTabActiva("final")}
                  type="button"
                >
                  Reporte Final
                </button>
              </li>
            </ul>

            <div className="tabla-certificado">
              {tabActiva === "final" && (
                <table className="table table-bordered text-center">
                  <thead className="table-primary">
                    <tr>{columnas.map((c, i) => <th key={i}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {materias.map((m, i) => (
                      <tr key={i}>
                        <td>{m.Asignatura}</td>
                        <td>{m["Promedio Final"]}</td>
                        <td>{m["Calificación Cualitativa"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tabActiva === "q1" && (
                <table className="table table-bordered text-center">
                  <thead className="table-primary">
                    <tr>
                      <th>Asignatura</th>
                      <th>Promedio Q1</th>
                      <th>Calificación Cualitativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiasQuim.map((m, i) => (
                      <tr key={i}>
                        <td>{m.Asignatura}</td>
                        <td>{m["Prom. Q1"]}</td>
                        <td>{m["Cuali. Q1"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tabActiva === "q2" && (
                <table className="table table-bordered text-center">
                  <thead className="table-primary">
                    <tr>
                      <th>Asignatura</th>
                      <th>Promedio Q2</th>
                      <th>Calificación Cualitativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiasQuim.map((m, i) => (
                      <tr key={i}>
                        <td>{m.Asignatura}</td>
                        <td>{m["Prom. Q2"]}</td>
                        <td>{m["Cuali. Q2"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </Layout>

    </>
  );
}

export default ReporteEstudiante;
