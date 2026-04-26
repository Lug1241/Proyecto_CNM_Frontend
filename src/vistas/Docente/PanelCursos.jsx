import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import Modulo from "../../components/Modulo";
import Loading from "../../components/Loading";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ErrorMessage } from "../../Utils/ErrorMesaje";
import { getModulos, transformModulesForLayout } from "../getModulos";
import Swal from "sweetalert2";
import { useAuth } from "../../Utils/useAuth";


function PanelCursos() {
  // Protección de ruta
  const auth = useAuth(["Profesor", "Administrador", "Vicerrector"]);


  // Si no está autenticado, no renderizar nada
  if (!auth.isAuthenticated) {
    return null;
  }

  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);

  const storedToken = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${storedToken}`
    }
  };
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      console.log("este es el usuario que quiero ver", parsedUser)
      setUsuario(parsedUser);

      const modulosBase = getModulos(parsedUser.subRol, true);
      setModules(transformModulesForLayout(modulosBase));

      // Paso 1: Verificar periodo académico activo
      axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/periodo_academico/activo`, config)
        .then((response) => {
          const periodoActivo = response.data;

          if (periodoActivo && periodoActivo.estado === "Activo") {
            // Paso 2: Obtener cursos si el periodo está activo
            axios
              .get(`${import.meta.env.VITE_URL_DEL_BACKEND}/asignacion/docente/${parsedUser.nroCedula}`, config)
              .then((response) => {
                const { data, message } = response.data;

                // ✅ Caso: no hay asignaciones (estado normal)
                if (Array.isArray(data) && data.length === 0) {
                  setCursos([]);

                  Swal.fire({
                    icon: "info",
                    title: "Sin asignaciones",
                    text: message || "Aún no tienes cursos asignados para el período activo.",
                    confirmButtonText: "Entendido",
                  });

                  return;
                }

                // ✅ Caso: sí hay asignaciones
                if (Array.isArray(data)) {
                  // Función para determinar si un nivel es BE o Superior
                  const esNivelBE = (nivel) => {
                    return nivel && nivel.includes("BE");
                  };

                  const normalizarTexto = (texto) => {
                    return (texto || "")
                      .trim()
                      .replace(/\s+/g, " ")
                      .toLowerCase();
                  };

                  // Agrupar materias por nombre, tipo y bloque de nivel (BE/Superior)
                  const materiasAgrupadas = data.reduce((acc, curso) => {
                    const nombreMateria = curso.materia || "Sin materia";
                    const tipoNivel = esNivelBE(curso.nivel) ? "BE" : "Superior";
                    const tipoCurso = curso.tipo || "grupal";
                    const key = `${normalizarTexto(nombreMateria)}_${tipoNivel}_${tipoCurso}`;

                    if (!acc[key]) {
                      acc[key] = {
                        nombreMateria,
                        tipoNivel,
                        tipoCurso,
                        asignaciones: []
                      };
                    }

                    acc[key].asignaciones.push(curso);
                    return acc;
                  }, {});

                  // Crear tarjetas agrupadas por materia/tipo/nivel
                  const cursosAgrupados = Object.values(materiasAgrupadas).map(grupo => ({
                    id: `grupo_${normalizarTexto(grupo.nombreMateria)}_${grupo.tipoNivel}_${grupo.tipoCurso}`,
                    titulo: `Curso: ${grupo.nombreMateria}`,
                    descripcion: `Nivel: ${grupo.tipoNivel}\n${grupo.asignaciones.length} asignación(es)`,
                    link: "/profesor/panelcursos/calificaciones",
                    nivel: grupo.tipoNivel,
                    tipo: grupo.tipoCurso,
                    asignaciones: grupo.asignaciones
                  }));

                  setCursos(cursosAgrupados);
                }
              })
              .catch((error) => {
                // ❌ Errores reales (401, 500, etc.)
                ErrorMessage(error);
                setCursos([]);
              });

          } else {
            Swal.fire({
              icon: "info",
              title: "Sin período activo",
              text: "No hay un período académico activo actualmente.",
            });
            setCursos([]);
          }
        })
        .catch((error) => {
          if (
            error.response &&
            error.response.status === 404 &&
            error.response.data?.message === "Periodo no encontrado"
          ) {
            Swal.fire({
              icon: "info",
              title: "Sin período activo",
              text: "No se ha encontrado un período académico activo.",
            });
          } else {
            ErrorMessage(error);
          }
          setCursos([]);
        });
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleModuloClick = (modulo) => {
    setLoading(true);

    // Si es una materia agrupada, manejar todas las asignaciones
    if (modulo.asignaciones && modulo.asignaciones.length > 0) {
      // Navegar con todas las asignaciones del grupo
      navigate("/profesor/panelcursos/calificaciones", { 
        state: {
          tipo: modulo.tipo,
          nombreMateria: modulo.titulo.replace("Curso: ", ""),
          tipoNivel: modulo.nivel,
          asignaciones: modulo.asignaciones
        }
      });
      return;
    }

    // Para materias grupales, funcionar como antes
    axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/asignacion/obtener/${modulo.id}`, config)
      .then((response) => {
        const moduloCompleto = {
          ...response.data,
          nivel: modulo.nivel
        };
        navigate("/profesor/panelcursos/calificaciones", { state: moduloCompleto });
      })
      .catch((error) => {
        ErrorMessage(error);
        setLoading(false);
        alert("Ocurrió un error al cargar los datos del módulo.");
      });
  };

  const handleSidebarNavigation = (path) => {
    setLoading(true);
    setTimeout(() => navigate(path), 800);
  };

  const iconoCurso = <BookOpen size={40} />;
  const cursosModulos = cursos.map((curso) => ({ ...curso, icono: iconoCurso }));

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>

      <Layout modules={modules} onNavigate={handleSidebarNavigation}>
        <div className="content-container">
          <h2 className="mb-4">Cursos</h2>
          {cursosModulos.length > 0 ? (
            <Modulo modulos={cursosModulos} onModuloClick={handleModuloClick} />
          ) : (
            <div className="alert alert-info">
              Aún no tienes cursos asignados para el período activo.
              <br />
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

export default PanelCursos;
