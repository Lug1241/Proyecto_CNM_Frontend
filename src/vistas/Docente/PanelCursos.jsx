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
                  const esNivelBE = (nivel) => nivel && nivel.includes("BE");
                  const normalizarTexto = (texto) => (texto || "").trim().replace(/\s+/g, " ").toLowerCase();

                  // 1️⃣ DEFINIMOS LOS NIVELES QUE REPRESENTAN AGRUPACIONES
                  // Basado en tu ENUM, estos son los que no tienen un año específico (1ro, 2do, 3ro)
                  const nivelesDeAgrupacion = [
                    "BCH", "BM", "BS", "BS BCH", "BE", "BM BS", "BM BS BCH"
                  ];

                  // 2️⃣ SEPARAMOS LOS CURSOS: ¿Se agrupan o van sueltos?
                  // Se agrupa SI es "individual" O SI su nivel pertenece a los niveles de agrupación
                  const cursosParaAgrupar = data.filter(c =>
                    (c.tipo || "grupal").toLowerCase() === "individual" || nivelesDeAgrupacion.includes(c.nivel)
                  );

                  // Va suelto SI es "grupal" Y NO es un nivel de agrupación
                  const cursosSueltos = data.filter(c =>
                    (c.tipo || "grupal").toLowerCase() === "grupal" && !nivelesDeAgrupacion.includes(c.nivel)
                  );

                  // 3️⃣ PROCESAMOS LOS SUELTOS (1 a 1, NUNCA se agrupan)
                  const tarjetasSueltas = cursosSueltos.map((curso, index) => ({
                    id: curso.id || `suelto_${normalizarTexto(curso.materia)}_${index}`,
                    titulo: `Curso: ${curso.materia || "Sin materia"}`,
                    descripcion: `Nivel: ${esNivelBE(curso.nivel) ? "BE" : "Superior"}\n${curso.nivel || curso.paralelo || ""}`,
                    link: "/profesor/panelcursos/calificaciones",
                    nivel: esNivelBE(curso.nivel) ? "BE" : "Superior",
                    tipo: "grupal",
                    asignaciones: [curso] // Mantenemos esto para que el click funcione con navigate
                  }));

                  // 4️⃣ PROCESAMOS LOS QUE SÍ SE AGRUPAN
                  const cursosAgrupadosMap = cursosParaAgrupar.reduce((acc, curso) => {
                    const nombreMateria = curso.materia || "Sin materia";
                    const tipoNivel = esNivelBE(curso.nivel) ? "BE" : "Superior";

                    // La llave ahora junta a todos los que tengan el mismo nombre y tipo de bloque
                    const key = `${normalizarTexto(nombreMateria)}_${tipoNivel}`;

                    if (!acc[key]) {
                      acc[key] = {
                        nombreMateria,
                        tipoNivel,
                        tipoOriginal: curso.tipo || "grupal", // Guardamos si originalmente era grupal/individual
                        asignaciones: []
                      };
                    }

                    acc[key].asignaciones.push(curso);
                    return acc;
                  }, {});

                  const tarjetasAgrupadas = Object.values(cursosAgrupadosMap).map(grupo => ({
                    id: `grupo_${normalizarTexto(grupo.nombreMateria)}_${grupo.tipoNivel}`,
                    titulo: `Curso: ${grupo.nombreMateria}`,
                    descripcion: `Nivel: ${grupo.tipoNivel}\n${grupo.asignaciones.length} asignación(es)`,
                    link: "/profesor/panelcursos/calificaciones",
                    nivel: grupo.tipoNivel,
                    tipo: grupo.tipoOriginal,
                    asignaciones: grupo.asignaciones
                  }));

                  // 5️⃣ UNIMOS LAS TARJETAS Y ACTUALIZAMOS EL ESTADO
                  setCursos([...tarjetasSueltas, ...tarjetasAgrupadas]);
                }
              })
              .catch((error) => {
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

    // Las materias INDIVIDUALES agrupadas entrarán aquí porque tienen el arreglo "asignaciones"
    if (modulo.asignaciones && modulo.asignaciones.length > 0) {
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

    // Las materias GRUPALES entrarán aquí e irán a pedir su info específica al backend
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