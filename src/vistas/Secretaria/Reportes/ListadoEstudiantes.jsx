import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Loading from "../../../components/Loading";
import { Table, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import { InfoMessage } from "../../../Utils/InfoMessage";
import { getModulos, transformModulesForLayout } from "../../getModulos";
import "./ListadoEstudiantes.css";

function ListadoEstudiantes() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const estadoDesdeStorage = JSON.parse(sessionStorage.getItem("estadoReporte") || "{}");

    const nivelFromState = location.state?.nivel || estadoDesdeStorage.nivel;
    const idPeriodoFromState = location.state?.idPeriodo || estadoDesdeStorage.idPeriodo;
    const nivelFromURL = decodeURIComponent(location.pathname.split("/").pop());
    const idPeriodoFromURL = searchParams.get("idPeriodo");

    const nivel = nivelFromState || nivelFromURL;
    const idPeriodo = idPeriodoFromState || idPeriodoFromURL;

    const [estudiantes, setEstudiantes] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const descripcionPeriodoFromState = location.state?.descripcionPeriodo || estadoDesdeStorage.descripcionPeriodo;

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

    useEffect(() => {
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

        if (!nivel || !idPeriodo) {
            Swal.fire("Error", "No se pudo determinar el nivel o el período.", "error");
            setLoading(false);
            return;
        }

        axios
            .get(`${import.meta.env.VITE_URL_DEL_BACKEND}/estudiante/matricula/${nivelesMap[nivel]}/periodo/${idPeriodo}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const estudiantesOrdenados = (res.data || []).sort((a, b) => {
                    const apellidoA = `${a.primer_apellido} ${a.segundo_apellido || ""}`.toLowerCase();
                    const apellidoB = `${b.primer_apellido} ${b.segundo_apellido || ""}`.toLowerCase();
                    return apellidoA.localeCompare(apellidoB);
                });
                setEstudiantes(estudiantesOrdenados);
            })
            .catch((err) => {
                const status = err?.response?.status;

                if (status === 404) {
                    setEstudiantes([]);
                    InfoMessage({
                    title: "Sin estudiantes",
                    text: "No hay estudiantes registrados para este nivel.",
                    });
                    return;
                }

                ErrorMessage(err);
            }).finally(() => setLoading(false));
    }, [nivel, idPeriodo, navigate]);

    const handleSidebarNavigation = (path) => {
        setLoading(true);
        setTimeout(() => navigate(path), 800);
    };

    const handleVerNotas = async (est) => {
        const token = localStorage.getItem("token");
        try {
            const resMatriculas = await axios.get(`${import.meta.env.VITE_URL_DEL_BACKEND}/matricula/estudiante/${est.ID}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const periodoActual = parseInt(idPeriodo);
            const ultimaMatricula = resMatriculas.data.find(m => m.ID_periodo_academico === periodoActual);

            if (!ultimaMatricula) {
                Swal.fire("Error", "No se encontró la matrícula del estudiante para este período.", "error");
                return;
            }


            const esBE = ultimaMatricula.nivel?.toLowerCase().includes("elemental");

            navigate(`/secretaria/reportes/estudiante/${est.ID}`, {
                state: {
                    estudiante: {
                        idEstudiante: est.ID,
                        nombre: `${est.primer_apellido} ${est.segundo_apellido || ""} ${est.primer_nombre} ${est.segundo_nombre || ""}`,
                        cedula: est.nroCedula,
                        idMatricula: ultimaMatricula.ID,
                        nivel: ultimaMatricula.nivel,
                        anioLectivo: descripcionPeriodoFromState,
                    },
                    esBE,
                },
            });

        } catch (error) {
            ErrorMessage(error);
        }
    };
    if (loading) return <Loading />;

    return (
        <>
            <div className="container-fluid p-0 sticky-header">
                {usuario && <Header isAuthenticated={true} usuario={usuario} />}
            </div>
            <Layout modules={modules} onNavigate={handleSidebarNavigation}>
                <div className="content-container mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <h2 className="titulo-nivel m-0">Listado de Estudiantes - {nivel}</h2>
                        <button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-3"
                            style={{ maxWidth: "120px" }}
                            onClick={() => navigate(`/secretaria/reportes`)}
                        >
                            <i className="bi bi-arrow-left-circle-fill"></i> Regresar
                        </button>
                    </div>
                    {estudiantes.length > 0 ? (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th style={{ width: "50px" }}>No.</th>
                                    <th className="col-nombre">Apellidos y Nombres</th>
                                    <th style={{ width: "150px" }}>Cédula</th>
                                    <th style={{ width: "130px" }}>Jornada</th>
                                    <th style={{ width: "80px" }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estudiantes.map((est, idx) => (
                                    <tr key={est.ID}>
                                        <td>{idx + 1}</td>
                                        <td>{`${est.primer_apellido} ${est.segundo_apellido} ${est.primer_nombre} ${est.segundo_nombre || ""}`}</td>
                                        <td>{est.nroCedula}</td>
                                        <td>{est.jornada}</td>
                                        <td>
                                            <Button
                                                className="btn-icon"
                                                size="sm"
                                                onClick={() => handleVerNotas(est)}
                                                title="Ver notas"
                                            >
                                                <i className="bi bi-eye me-1"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <p className="text-muted">No hay estudiantes registrados para este nivel.</p>
                    )}
                </div>
            </Layout>
        </>
    );
}

export default ListadoEstudiantes;