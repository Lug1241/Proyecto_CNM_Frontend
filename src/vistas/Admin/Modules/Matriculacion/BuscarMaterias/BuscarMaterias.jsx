import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ErrorMessage } from '../../../../../Utils/ErrorMesaje';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Row, Col } from "react-bootstrap";
import Horario from '../Horario';
import '../../../../components/BuscarEstudiante.css';
import '../../../Styles/Inscripcion.css';

function BuscarMaterias() {
  const [asignatura, setAsignatura] = useState('');
  const [buscarAsignacion, setBucarAsignacion] = useState(false);
  const [asignaciones, setAsignaciones] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const token = localStorage.getItem("token");
  const { periodo, estudiante, matricula } = location.state || {};

  // ▶ contenedor con scroll interno
  const wrapRef = useRef(null);
  const footerRef = useRef(null);

  // Calcula la altura disponible para el contenedor con scroll interno
  useEffect(() => {
    const updateHeight = () => {
      if (!wrapRef.current) return;
      // distancia del wrapper al borde superior del viewport
      const top = wrapRef.current.getBoundingClientRect().top;
      // alto visible disponible desde ese punto
      const availableHeight = window.innerHeight - top - 8; // 8px de respiro

      // Asegurar una altura mínima razonable en pantallas pequeñas
      const minHeight = window.innerWidth <= 768 ? 400 : 360;
      const h = Math.max(minHeight, availableHeight);

      document.documentElement.style.setProperty('--matric-h', `${h}px`);
    };

    // Múltiples intentos para asegurar cálculo correcto
    updateHeight();
    const timeout1 = setTimeout(updateHeight, 100);
    const timeout2 = setTimeout(updateHeight, 300);

    const onResize = () => {
      clearTimeout(window.matricResizeTimeout);
      window.matricResizeTimeout = setTimeout(() => {
        requestAnimationFrame(updateHeight);
      }, 100);
    };

    window.addEventListener('resize', onResize);
    // si tu layout cambia alturas al hacer scroll del body, re-calcula
    window.addEventListener('scroll', onResize, { passive: true });

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(window.matricResizeTimeout);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
    };
  }, [asignaciones, inscripciones]); // Recalcular cuando cambie el contenido

  // Calcular altura del footer para reservar espacio
  useEffect(() => {
    const setFooterHeight = () => {
      const h = footerRef.current ? footerRef.current.offsetHeight : 0;
      const paddedHeight = h > 0 ? h + 16 : 0;
      document.documentElement.style.setProperty('--footer-h', `${paddedHeight}px`);
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
  }, [inscripciones]); // Recalcular cuando cambien las inscripciones

  // Asegurar que el botón sea visible cuando haya contenido
  useEffect(() => {
    if (inscripciones.length > 0 && footerRef.current && wrapRef.current) {
      setTimeout(() => {
        const wrapper = wrapRef.current;
        if (wrapper) {
          // Hacer scroll hacia abajo para mostrar el botón
          wrapper.scrollTop = wrapper.scrollHeight;
        }
      }, 200);
    }
  }, [inscripciones]);

  const obtenerInscripciones = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/inscripcion/obtener/matricula/${matricula}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInscripciones(data);
    } catch (error) {
      ErrorMessage(error);
    }
  };
  useEffect(() => { obtenerInscripciones(); }, []);

  const HandleBuscarAsignaturas = async () => {
    setBucarAsignacion(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/asignacion/obtener/materias/${periodo.ID}/${estudiante.nivel}/${asignatura}/${estudiante.jornada}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
        setAsignaciones(data);
    } catch (error) {
      ErrorMessage(error);
    }
  };

  const Inscribir = async (asig) => {
    try {
      await axios.post(
        `${API_URL}/inscripcion/crear`,
        { ID_matricula: matricula, ID_asignacion: asig.ID },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        icon: "success",
        title: "Inscripción exitosa",
        iconColor: "#218838",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#003F89",
      });
      await obtenerInscripciones();
      await HandleBuscarAsignaturas();
    } catch (error) {
      ErrorMessage(error);
    }
  };

  const FinalizarMatriculas = () => {
    const storedUser = JSON.parse(localStorage.getItem("usuario"));
    const subRol = storedUser?.subRol;
    const rutaFinal = subRol === "Secretaria" ? "/secretaria/matriculacion" : "/admin/matriculacion";
    Swal.fire({
      icon: "success",
      title: "Registro exitoso",
      iconColor: "#218838",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#003F89",
    });
    navigate(rutaFinal);
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

      {/* --- BARRA DE BÚSQUEDA FORZADA EN UNA SOLA LÍNEA --- */}
      <div style={{
        display: 'flex',           // Activa la fila
        alignItems: 'center',      // Centra verticalmente
        gap: '10px',               // Espacio entre elementos
        flexWrap: 'nowrap',        // PROHIBIDO bajar de línea
        width: '100%',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>

        {/* 1. Label */}
        <label style={{
          margin: 0,
          fontWeight: 'bold',
          whiteSpace: 'nowrap' // Que no se rompa el texto
        }}>
          Materia:
        </label>

        {/* 2. Input */}
        <input
          type="text"
          placeholder="Escribe el nombre..."
          value={asignatura ?? ''}
          onChange={(e) => setAsignatura(e.target.value)}
          style={{
            flexGrow: 1,       // Ocupa todo el espacio libre
            margin: 0,
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px'
          }}
        />

        {/* 3. Botón */}
        <button
          onClick={HandleBuscarAsignaturas}
          style={{
            width: 'auto',     // El ancho justo del texto
            margin: 0,
            padding: '8px 20px',
            backgroundColor: '#0d6efd',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Buscar
        </button>

        {/* 4. Link Malla */}
        <a
          href="/public/Malla.pdf"
          download
          style={{
            marginLeft: 'auto', // Se empuja a la derecha si sobra espacio
            color: '#d32f2f',
            textDecoration: 'none',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            fontSize: '0.9rem',
            border: '1px solid #d32f2f',
            padding: '5px 10px',
            borderRadius: '4px'
          }}
        >
          <i className="bi bi-download"></i> Descargar MALLA
        </a>

      </div>

       {/* Área de Cards (Flujo natural) */}
                  <div className="gcd-cards-area">
                      {asignaciones.length === 0 ? (
                          <p className="text-muted fst-italic">No existen cursos libres para este docente</p>
                      ) : (
                          <Row xs={1} md={2} lg={3} className="g-3">
                              {asignaciones.map((asig) => {
                                  const nombreCompletoDocente = `${asig.Docente?.primer_nombre} ${asig.Docente?.primer_apellido}`.trim();
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
                                                      <span className="badge bg-light text-primary border flex-shrink-0">
                                                          Cupos: {asig.cupos}
                                                      </span>
                                                  </div>
      
                                                  <Row style={{ fontSize: '0.85rem' }}>
                                                      <Col xs={6}>
                                                          <strong className="d-block text-dark">Horario:</strong>
                                                          <span className="text-muted">
                                                              {asig.dias?.join(", ")} <br />
                                                              {asig.horaInicio} - {asig.horaFin}
                                                          </span>
                                                      </Col>
                                                      <Col xs={6}>
                                                          <strong className="d-block text-dark">Detalles:</strong>
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

      {/* --- REUTILIZAMOS EL CONTENEDOR DE HORARIO --- */}
      <div className="gcd-horario-panel">
        {inscripciones.length > 0 && (
          <div style={{ minWidth: '800px' }}> {/* El fix del scroll horizontal */}
            <Horario
              materiasSeleccionadas={inscripciones}
              setMateriasSeleccionadas={setInscripciones}
              jornada={estudiante.jornada}
              nivel={estudiante.nivel}
              setAsignaciones={setAsignaciones}
            />
          </div>
        )}
      </div>

      {/* --- REUTILIZAMOS EL FOOTER ESTÁTICO --- */}
      {inscripciones.length > 0 && (
        <div ref={footerRef} className='gcd-footer-static'>
          <button className="gcd-btn-finish" onClick={FinalizarMatriculas}>Finalizar</button>
        </div>
      )}

    </div>
  );
}

export default BuscarMaterias;
