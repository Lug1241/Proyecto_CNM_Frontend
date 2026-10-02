import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Loading from "../../../components/Loading";
import Swal from "sweetalert2";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import { getModulos, transformModulesForLayout } from "../../getModulos";
import { PiBroomFill } from "react-icons/pi";
import { useAuth } from "../../../Utils/useAuth";
import "./MateriasPorPeriodo.css";

const nivelesMap = {
    "1ro BE": "1ro Básico Elemental",
    "2do BE": "2do Básico Elemental",
    "1ro BM": "1ro Básico Medio",
    "2do BM": "2do Básico Medio",
    "3ro BM": "3ro Básico Medio",
    "1ro BS": "1ro Básico Superior",
    "2do BS": "2do Básico Superior",
    "3ro BS": "3ro Básico Superior",
    "1ro BCH": "1ro Bachillerato",
    "2do BCH": "2do Bachillerato",
    "3ro BCH": "3ro Bachillerato",
};

function MateriasPorPeriodo() {
    const { idPeriodo } = useParams();
    const navigate = useNavigate();
    const auth = useAuth("Secretaria");
    const authRole = auth.usuario?.subRol || auth.usuario?.rol;
    const [usuario, setUsuario] = useState(null);
    const [modules, setModules] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [agrupadoPorNivel, setAgrupadoPorNivel] = useState({});
    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

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

        const modulosBase = getModulos(parsedUser.subRol, true);
        setModules(transformModulesForLayout(modulosBase));

        setLoading(true);
        axios
            .get(`${import.meta.env.VITE_URL_DEL_BACKEND}/asignacion/obtener/periodo_academico/${idPeriodo}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setAsignaciones(res.data.data);
                agruparPorNivelData(res.data.data);
            })
            .catch((err) => {
                ErrorMessage(err);
                Swal.fire("Error", "No se pudieron cargar las materias del período.", "error");
            })
            .finally(() => setLoading(false));
    }, [idPeriodo, navigate, auth.isAuthenticated, authRole]);

    const agruparPorNivelData = (data) => {
        const grupos = {};
        data.forEach((item) => {
            const nivel = item.Materia?.nivel || "Sin nivel";
            if (!grupos[nivel]) {
                grupos[nivel] = [];
            }
            grupos[nivel].push(item);
        });
        setAgrupadoPorNivel(grupos);
        // Configuramos la pestaña activa como la primera clave si aún no hay una seleccionada
        if (!activeTab && Object.keys(grupos).length > 0) {
            setActiveTab(Object.keys(grupos)[0]);
        }
    };

    const handleTabClick = (nivelKey) => {
        setActiveTab(nivelKey);
    };

    const handleSidebarNavigation = (path) => {
        setLoading(true);
        setTimeout(() => navigate(path), 800);
    };

    const filtrarPorDocente = (asignacionesList) => {
        if (!searchTerm.trim()) return asignacionesList;
        
        return asignacionesList.filter((asig) => {
            const nombreCompletoDocente = `${asig.Docente?.primer_nombre || ""} ${asig.Docente?.segundo_nombre || ""} ${asig.Docente?.primer_apellido || ""} ${asig.Docente?.segundo_apellido || ""}`
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();
            
            return nombreCompletoDocente.includes(searchTerm.toLowerCase().trim());
        });
    };

    const obtenerTodasLasMateriasFiltradas = () => {
        const todasLasMaterias = [];
        Object.entries(agrupadoPorNivel).forEach(([nivelKey, asignacionesList]) => {
            const filtradas = filtrarPorDocente(asignacionesList);
            todasLasMaterias.push(...filtradas);
        });
        return todasLasMaterias;
    };

    if (!auth.isAuthenticated || authRole !== "Secretaria") {
        return null;
    }

    if (loading) return <Loading />;

    return (
        <>
            <div className="container-fluid p-0 sticky-header">
                {usuario && <Header isAuthenticated={true} usuario={usuario} />}
            </div>
            <Layout modules={modules} onNavigate={handleSidebarNavigation}>
                <div className="content-container mt-3">
                    {/* Título y Buscador en la misma línea */}
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <h2 className="mb-0">Materias del Período</h2>
                        
                        {/* Buscador por docente */}
                        <div className="d-flex align-items-center gap-2" style={{ minWidth: "520px" }}>
                            <label className="mb-0 fw-semibold" style={{ whiteSpace: "nowrap" }}>Buscar:</label>
                            <div className="input-group flex-nowrap w-100">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ingrese el nombre del docente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Buscar docente"
                                />
                                <span className="input-group-text" style={{ background: "transparent", borderLeft: "0" }}>
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        title="Limpiar búsqueda"
                                        aria-label="Limpiar búsqueda"
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            padding: 0,
                                            lineHeight: 1,
                                            color: searchTerm ? "#333" : "#adb5bd",
                                            cursor: searchTerm ? "pointer" : "default"
                                        }}
                                    >
                                        <PiBroomFill size={20} />
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mostrar pestañas solo cuando no hay búsqueda */}
                    {!searchTerm.trim() && (
                    <div className="tabs-scroll-wrapper mb-3">
                        <ul className="nav nav-tabs flex-nowrap" role="tablist">
                            {Object.keys(agrupadoPorNivel).map((nivelKey) => (
                                <li className="nav-item" key={nivelKey}>
                                    <button
                                        className={`nav-link ${activeTab === nivelKey ? "active" : ""}`}
                                        onClick={() => handleTabClick(nivelKey)}
                                        type="button"
                                        role="tab"
                                    >
                                        {nivelesMap[nivelKey] || nivelKey}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    )}

                    {/* Vista cuando hay búsqueda activa: mostrar todas las materias de todos los niveles */}
                    {searchTerm.trim() ? (
                        <div className="mt-3">
                            {(() => {
                                const todasFiltradas = obtenerTodasLasMateriasFiltradas();
                                
                                if (todasFiltradas.length === 0) {
                                    return (
                                        <div className="alert alert-info" role="alert">
                                            <i className="bi bi-info-circle me-2"></i>
                                            No se encontraron materias con el docente "{searchTerm}".
                                        </div>
                                    );
                                }
                                
                                return (
                                    <>
                                        <p className="text-muted mb-3">
                                            <i className="bi bi-funnel-fill me-2"></i>
                                            Mostrando {todasFiltradas.length} resultado{todasFiltradas.length !== 1 ? 's' : ''}
                                        </p>
                                        <Row xs={1} md={2} lg={3} className="g-4">
                                            {todasFiltradas.map((asig) => {
                                                const nombreCompletoDocente = `${asig.Docente?.primer_nombre} ${asig.Docente?.segundo_nombre || ""} ${asig.Docente?.primer_apellido} ${asig.Docente?.segundo_apellido || ""}`.trim();

                                                return (
                                                    <Col key={asig.ID}>
                                                        <Card>
                                                            <Card.Body>
                                                                <Card.Title>{asig.Materia?.nombre}</Card.Title>
                                                                <Card.Subtitle className="mb-2 text-muted">
                                                                    {asig.Materia?.tipo} | Paralelo: {asig.paralelo}
                                                                </Card.Subtitle>
                                                                <Card.Text>
                                                                    <strong>Nivel:</strong> {nivelesMap[asig.Materia?.nivel] || asig.Materia?.nivel} <br />
                                                                    <strong>Horario:</strong> {asig.horaInicio} - {asig.horaFin} <br />
                                                                    <strong>Días:</strong> {asig.dias.join(", ")} <br />
                                                                    <strong>Docente:</strong> {nombreCompletoDocente} <br />
                                                                </Card.Text>
                                                                <div className="d-flex justify-content-between mt-3">
                                                                    <button
                                                                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                                        onClick={() =>
                                                                            navigate(`/secretaria/periodo/materias/estudiantes/${asig.ID}`, {
                                                                                state: {
                                                                                  ID: asig.ID,
                                                                                  materia: asig.Materia?.nombre,
                                                                                  docente: nombreCompletoDocente,
                                                                                  paralelo: asig.paralelo,
                                                                                  descripcionPeriodo: asig.Periodo_Academico?.descripcion,
                                                                                  horario: `${asig.horaInicio}-${asig.horaFin}`,
                                                                                  idPeriodo, 
                                                                                }
                                                                              })                                                                      
                                                                        }
                                                                    >
                                                                        <i className="bi bi-people-fill"></i> Ver Lista
                                                                    </button>

                                                                    <button
                                                                        className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                                                                        onClick={() =>
                                                                            navigate(`/secretaria/calificaciones/asignacion/${asig.ID}`, {
                                                                              state: {
                                                                                ID: asig.ID,
                                                                                materia: asig.Materia?.nombre,
                                                                                docente: nombreCompletoDocente,
                                                                                paralelo: asig.paralelo,
                                                                                periodo: asig.Periodo_Academico?.descripcion,
                                                                                horario: `${asig.horaInicio}-${asig.horaFin}`,
                                                                                idPeriodo,
                                                                                nivel: asig.Materia?.nivel,
                                                                                soloLectura: true, 
                                                                              }
                                                                            })
                                                                          }                                                                  
                                                                    >
                                                                        <i className="bi bi-journal-check"></i> Ver Calificaciones
                                                                    </button>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                    <div className="tab-content mt-3">
                        {Object.entries(agrupadoPorNivel).map(([nivelKey, asignacionesList]) => {
                            const asignacionesFiltradas = filtrarPorDocente(asignacionesList);
                            
                            return (
                            <div
                                className={`tab-pane fade ${activeTab === nivelKey ? "show active" : ""}`}
                                role="tabpanel"
                                key={nivelKey}
                            >
                                {asignacionesFiltradas.length === 0 ? (
                                    <div className="alert alert-info" role="alert">
                                        <i className="bi bi-info-circle me-2"></i>
                                        No se encontraron materias{searchTerm ? ` con el docente "${searchTerm}"` : ""} en este nivel.
                                    </div>
                                ) : (
                                    <Row xs={1} md={2} lg={3} className="g-4">
                                        {asignacionesFiltradas.map((asig) => {
                                        const nombreCompletoDocente = `${asig.Docente?.primer_nombre} ${asig.Docente?.segundo_nombre || ""} ${asig.Docente?.primer_apellido} ${asig.Docente?.segundo_apellido || ""}`.trim();

                                        return (
                                            <Col key={asig.ID}>
                                                <Card>
                                                    <Card.Body>
                                                        <Card.Title>{asig.Materia?.nombre}</Card.Title>
                                                        <Card.Subtitle className="mb-2 text-muted">
                                                            {asig.Materia?.tipo} | Paralelo: {asig.paralelo}
                                                        </Card.Subtitle>
                                                        <Card.Text>
                                                            <strong>Horario:</strong> {asig.horaInicio} - {asig.horaFin} <br />
                                                            <strong>Días:</strong> {asig.dias.join(", ")} <br />
                                                            <strong>Docente:</strong> {nombreCompletoDocente} <br />
                                                        </Card.Text>
                                                        <div className="d-flex justify-content-between mt-3">
                                                            <button
                                                                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                                onClick={() =>
                                                                    navigate(`/secretaria/periodo/materias/estudiantes/${asig.ID}`, {
                                                                        state: {
                                                                          ID: asig.ID,
                                                                          materia: asig.Materia?.nombre,
                                                                          docente: nombreCompletoDocente,
                                                                          paralelo: asig.paralelo,
                                                                          descripcionPeriodo: asig.Periodo_Academico?.descripcion,
                                                                          horario: `${asig.horaInicio}-${asig.horaFin}`,
                                                                          idPeriodo, 
                                                                        }
                                                                      })                                                                      
                                                                }
                                                            >
                                                                <i className="bi bi-people-fill"></i> Ver Lista
                                                            </button>

                                                            <button
                                                                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                                                                onClick={() =>
                                                                    navigate(`/secretaria/calificaciones/asignacion/${asig.ID}`, {
                                                                      state: {
                                                                        ID: asig.ID,
                                                                        materia: asig.Materia?.nombre,
                                                                        docente: nombreCompletoDocente,
                                                                        paralelo: asig.paralelo,
                                                                        periodo: asig.Periodo_Academico?.descripcion,
                                                                        horario: `${asig.horaInicio}-${asig.horaFin}`,
                                                                        idPeriodo,
                                                                        nivel: asig.Materia?.nivel,
                                                                        soloLectura: true, 
                                                                      }
                                                                    })
                                                                  }                                                                  
                                                            >
                                                                <i className="bi bi-journal-check"></i> Ver Calificaciones
                                                            </button>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        );
                                        })}
                                    </Row>
                                )}
                            </div>
                            );
                        })}
                    </div>
                    )}
                </div>
            </Layout>
        </>
    );
}

export default MateriasPorPeriodo;
