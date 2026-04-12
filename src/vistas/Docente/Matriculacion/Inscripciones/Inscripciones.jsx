import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { ErrorMessage } from "../../../../Utils/ErrorMesaje";
import { useLocation } from "react-router-dom";
import { Card, Row, Col } from "react-bootstrap";
import Horario from "./Horario";
import { useNavigate } from "react-router-dom";
import CrearCursoIndividual from "../CrearCursoIndividual";
import "../../../components/BuscarEstudiante.css";
import "./Inscripciones.css";
import { FaEdit, FaTrash } from "react-icons/fa";

function Inscripciones({ asignaciones, docente, periodo, setAsignaciones }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const token = localStorage.getItem("token");
  const { estudiante, matricula } = location.state || {};

  // Refs para el manejo responsivo
  const wrapRef = useRef(null);
  const footerRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Cálculo de altura para el contenedor principal
  useEffect(() => {
    const setMatricHeight = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - rect.top;
      const minHeight = window.innerWidth <= 768 ? 200 : 300;
      const finalHeight = Math.max(availableHeight - 20, minHeight);

      document.documentElement.style.setProperty(
        "--matric-h",
        `${finalHeight}px`,
      );
    };

    const timeout1 = setTimeout(setMatricHeight, 50);
    const timeout2 = setTimeout(setMatricHeight, 200);

    const onResize = () => {
      clearTimeout(window.matricResizeTimeout);
      window.matricResizeTimeout = setTimeout(() => {
        setMatricHeight();
      }, 100);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(window.matricResizeTimeout);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [asignaciones, inscripciones]);

  // Calcular altura del footer para reservar espacio
  useEffect(() => {
    const setFooterHeight = () => {
      const h = footerRef.current ? footerRef.current.offsetHeight : 0;
      const paddedHeight = h > 0 ? h + 16 : 0;
      document.documentElement.style.setProperty(
        "--footer-h",
        `${paddedHeight}px`,
      );
    };

    const timeout = setTimeout(setFooterHeight, 50);

    const ro = new ResizeObserver(() => {
      clearTimeout(window.footerResizeTimeout);
      window.footerResizeTimeout = setTimeout(setFooterHeight, 100);
    });

    if (footerRef.current) ro.observe(footerRef.current);

    return () => {
      clearTimeout(timeout);
      clearTimeout(window.footerResizeTimeout);
      ro.disconnect();
    };
  }, [inscripciones]);

  // Asegurar que el botón sea visible cuando se agregue una nueva inscripción
  useEffect(() => {
    // Solo hacer scroll si se agregó una inscripción recientemente
    // No hacer scroll en la carga inicial
    if (inscripciones.length > 0 && footerRef.current && wrapRef.current) {
      if (!isInitialLoad.current) {
        // Si no es la carga inicial, hacer scroll hacia abajo para mostrar el botón
        setTimeout(() => {
          const wrapper = wrapRef.current;
          if (wrapper) {
            wrapper.scrollTop = wrapper.scrollHeight;
          }
        }, 200);
      } else {
        // Marcar que ya pasó la carga inicial
        isInitialLoad.current = false;
      }
    }
  }, [inscripciones.length]); // Cambiar dependencia a solo la longitud

  // Asegurar que al cargar el componente siempre empiece arriba
  useEffect(() => {
    if (wrapRef.current) {
      wrapRef.current.scrollTop = 0;
    }
  }, []); // Solo en mount

  const obtenerInscripciones = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/inscripcion/obtener/matricula/${matricula}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setInscripciones(response.data);
    } catch (error) {
      ErrorMessage(error);
    }
  };
  useEffect(() => {
    obtenerInscripciones();
  }, []);

  const Inscribir = async (asignacion) => {
    try {
      await axios.post(
        `${API_URL}/inscripcion/crear`,
        {
          ID_matricula: matricula,
          ID_asignacion: asignacion.ID,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAsignaciones((prevData) =>
        prevData.map((item) =>
          item.ID === asignacion.ID
            ? { ...item, cupos: item.cupos - 1 }
            : item
        )
      );
      Swal.fire({
        icon: "success",
        title: "Inscripción exitosa",
        iconColor: "#218838",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#003F89",
      });
      obtenerInscripciones();
    } catch (error) {
      ErrorMessage(error);
    }
  };
  const FinalizarMatriculas = () => {
    Swal.fire({
      icon: "success",
      title: `Matricula con exitosa`,
      iconColor: "#218838",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#003F89",
    });
    navigate("/profesor/matricula");
  };
  const handleCrearAsignacion = (asignacion) => {
    axios
      .post(`${API_URL}/asignacion/crear`, asignacion, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAsignaciones((prevData) => [...prevData, res.data]);
        Swal.fire({
          icon: "success",
          title: "Datos creados con éxito",
          iconColor: "#218838",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#003F89",
        });
        setIsModalOpen(false);
      })
      .catch((error) => {
        ErrorMessage(error);
      });
  };

  const handleEditar = (asig) => {
    setAsignacionEditando(asig);
    setIsEditModalOpen(true);
  };

  const handleEliminar = (asig) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el curso permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API_URL}/asignacion/eliminar/${asig.ID}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => {
            setAsignaciones((prevData) =>
              prevData.filter((item) => item.ID !== asig.ID)
            );
            Swal.fire({
              icon: "success",
              title: "Eliminado!",
              text: "El curso ha sido eliminado.",
              iconColor: "#218838",
              confirmButtonText: "Entendido",
              confirmButtonColor: "#003F89",
            });
          })
          .catch((error) => {
            ErrorMessage(error);
          });
      }
    });
  };

  const handleActualizarAsignacion = (asignacionActualizada) => {
    axios
      .put(`${API_URL}/asignacion/editar/${asignacionEditando.ID}`, asignacionActualizada, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAsignaciones((prevData) =>
          prevData.map((item) =>
            item.ID === asignacionEditando.ID ? res.data : item
          )
        );
        Swal.fire({
          icon: "success",
          title: "Actualizado!",
          text: "El curso ha sido actualizado.",
          iconColor: "#218838",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#003F89",
        });
        setIsEditModalOpen(false);
        setAsignacionEditando(null);
      })
      .catch((error) => {
        ErrorMessage(error);
      });
  };
  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };
  return (
    <div ref={wrapRef} className="gcd-wrapper">
      
      <div className="gcd-actions-bar">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </div>
      
      <h1 className="gcd-title">
        Matricula de {estudiante.primer_nombre} {estudiante.primer_apellido}
      </h1>

      {/* Botón Crear Curso */}
      <div className="gcd-actions-bar">
        <button className="gcd-btn-add" onClick={toggleModal}>
          Crear Curso
        </button>
      </div>

      {isModalOpen && (
        <CrearCursoIndividual
          onCancel={toggleModal}
          onSave={handleCrearAsignacion}
          docente={docente}
          periodo={periodo.ID}
        />
      )}

      {isEditModalOpen && (
        <CrearCursoIndividual
          onCancel={() => {
            setIsEditModalOpen(false);
            setAsignacionEditando(null);
          }}
          onSave={handleActualizarAsignacion}
          docente={docente}
          periodo={periodo.ID}
          modoEdicion={true}
          datosIniciales={asignacionEditando}
        />
      )}

      {/* Área de Cards (Flujo natural) */}
      <div className="gcd-cards-area">
        {asignaciones.length === 0 ? (
          <p className="text-muted fst-italic">
            No existen cursos libres para este docente
          </p>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-3">
            {asignaciones.map((asig) => {
              const nombreCompletoDocente =
                `${asig.Docente?.primer_nombre} ${asig.Docente?.primer_apellido}`.trim();
              return (
                <Col key={asig.ID}>
                  <Card
                    className="gcd-card-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => Inscribir(asig)}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="gcd-card-title me-2">
                          {asig.Materia?.nombre}
                        </div>
                        {asig.nroCedula_docente === docente.nroCedula && (
                          <div className="d-flex gap-2">
                            <FaEdit
                              size={16}
                              style={{ cursor: "pointer", color: "#007bff" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditar(asig);
                              }}
                              title="Editar"
                            />
                            <FaTrash
                              size={16}
                              style={{ cursor: "pointer", color: "#dc3545" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminar(asig);
                              }}
                              title="Eliminar"
                            />
                          </div>
                        )}
                      </div>

                      <Row style={{ fontSize: "0.85rem" }}>
                        <Col xs={6}>
                          <strong className="d-block text-dark">
                            Horario:
                          </strong>
                          <span className="text-muted">
                            {asig.dias?.[0] && (
                              <>
                                {asig.dias[0]} {asig.horaInicio} -{" "}
                                {asig.horaFin}
                              </>
                            )}

                            {asig.dias?.[1] && (
                              <>
                                <br />
                                {asig.dias[1]} {asig.hora1} - {asig.hora2}
                              </>
                            )}
                          </span>
                        </Col>
                        <Col xs={6}>
                          <strong className="d-block text-dark">
                            Detalles:
                          </strong>
                          <span className="text-muted">
                            Paralelo: {asig.paralelo} <br />
                            Nivel: {asig.Materia?.nivel}
                          </span>
                        </Col>
                        <Col xs={12} className="mt-2 pt-2 border-top">
                          <small className="text-secondary fst-italic">
                            <i className="bi bi-person-fill me-1"></i>
                            {nombreCompletoDocente}
                          </small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Horario (Scroll Horizontal) */}
      <div className="gcd-horario-panel">
        {inscripciones.length > 0 && (
          // Div interno para forzar el ancho y activar scroll horizontal
          <div className="gcd-horario-wrapper-inner">
            <Horario
              materiasSeleccionadas={inscripciones}
              setMateriasSeleccionadas={setInscripciones}
              jornada={estudiante.jornada}
              nivel={estudiante.nivel}
              setAsignaciones={setAsignaciones}
              docente={docente}
            />
          </div>
        )}
      </div>

      {/* Botón Finalizar (Al final de la página, sin tapar nada) */}
      {inscripciones.length > 0 && (
        <div ref={footerRef} className="gcd-footer-static">
          <button className="gcd-btn-finish" onClick={FinalizarMatriculas}>
            Finalizar Matrícula
          </button>
        </div>
      )}
    </div>
  );
}

export default Inscripciones;
