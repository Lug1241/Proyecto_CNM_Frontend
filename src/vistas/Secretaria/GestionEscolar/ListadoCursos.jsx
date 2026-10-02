import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../../../components/Header";
import HeaderTabla from "../../../components/HeaderTabla";
import Tabla from "../../../components/Tabla";
import Loading from "../../../components/Loading";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import { exportarListadoAPDF } from "./FuncionesParaListados";
import { useAuth } from "../../../Utils/useAuth";

function ListadoCursos() {
  const { id_asignacion } = useParams();
  const navigate = useNavigate();
  const auth = useAuth("Secretaria");
  const authRole = auth.usuario?.subRol || auth.usuario?.rol;
  const location = useLocation();
  const datosModulo = location.state || JSON.parse(sessionStorage.getItem("datosModulo") || "{}");

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState([]);
  const [idPeriodo, setIdPeriodo] = useState(null);

  const determinarJornada = (horario) => {
    if (!horario) return "-";
    const horaInicio = horario.split("-")[0];
    const horaNumerica = parseInt(horaInicio.split(":")[0], 10);
    return horaNumerica < 12 ? "Matutina" : "Vespertina";
  };

  useEffect(() => {
      if (!auth.isAuthenticated || authRole !== "Secretaria") {
        return;
      }

    const storedUser = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUsuario(parsedUser);

    if (location.state) {
      sessionStorage.setItem("datosModulo", JSON.stringify(location.state));
    }

    axios
      .get(`${import.meta.env.VITE_URL_DEL_BACKEND}/inscripcion/asignacion/${id_asignacion}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setEstudiantes(res.data || []);
        if (datosModulo.idPeriodo) {
          setIdPeriodo(datosModulo.idPeriodo);
        } else {
          console.warn("No se encontró idPeriodo en datosModulo");
        }
      })
      .catch(ErrorMessage)
      .finally(() => setLoading(false));
  }, [id_asignacion, navigate, auth.isAuthenticated, authRole]);

  const columnas = []; // Solo usamos Nro y Nómina (que el componente Tabla ya incluye)

  const tablaFormateada = estudiantes.map((e) => ({
    "Nro": e.nro,
    "Nómina de Estudiantes": e.nombre,
  }));


  const datosEncabezado = {
    titulo: "CONSERVATORIO NACIONAL DE MUSICA",
    subtitulo: "LISTADO DE ESTUDIANTES",
    info: {
      "Profesor": datosModulo.docente,
      "Asignatura": datosModulo.materia,
      "Año Lectivo": datosModulo.descripcionPeriodo,
      "Paralelo": datosModulo.paralelo,
      "Jornada": determinarJornada(datosModulo.horario),
    },
  };

  if (!auth.isAuthenticated || authRole !== "Secretaria") {
    return null;
  }

  if (loading) return <Loading />;

  return (
    <>
      {usuario && <Header isAuthenticated={true} usuario={usuario} />}

      <div id="contenido-exportable" className="container content-container mt-3">
        {/* Barra superior con Regresar a la izquierda y Exportaciones a la derecha */}
        <div className="d-flex justify-content-between align-items-center mb-3 no-print">
          {/* Botón Regresar */}
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-3"
            style={{ maxWidth: "120px" }}
            onClick={() => navigate(`/secretaria/periodo/materias/${idPeriodo}`)}
          >
            <i className="bi bi-arrow-left-circle-fill"></i> Regresar
          </button>

          {/* Botón Exportar */}
          <div className="d-flex align-items-center gap-2">
            <span className="label-text">Exportaciones:</span>
            <button
              className="btn btn-danger btn-sm"
              onClick={() =>
                exportarListadoAPDF(
                  tablaFormateada,            // [{ Nro, "Nómina de Estudiantes" }, ...]
                  {
                    ...datosEncabezado,
                    logoIzq: "/ConservatorioNacional.png", // ← tu imagen de la izquierda
                    // logoDer: "/OtroLogo.png",           // ← opcional
                  },
                  `ListadoEstudiantes_${datosModulo.materia}_${datosModulo.paralelo}.pdf`
                )
              }
              title="Exportar a PDF (1 columna, multipágina, con estilos y logo)"
            >
              <i className="bi bi-file-earmark-pdf-fill"></i>
            </button>
          </div>
        </div>

        <HeaderTabla
          datosEncabezado={datosEncabezado}
          imagenIzquierda={"/ConservatorioNacional.png"}
        />

        <Tabla
          columnas={columnas}
          columnasAgrupadas={null}
          datos={tablaFormateada}
          mostrarEditar={false}
          mostrarGuardar={false}
          clasePersonalizada="tabla-listado"
        />
      </div>
    </>
  );
}

export default ListadoCursos;
