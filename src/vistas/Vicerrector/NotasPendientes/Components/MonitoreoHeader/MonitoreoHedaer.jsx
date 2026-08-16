import React from 'react';
import { Row, Col } from 'react-bootstrap';

function MonitoreoHeader({ docentesPendientes, alumnosSinNota, estado }) {
  const colorEstado = estado === "Crítico" ? "text-danger" : "text-success";

  return (
    <div className="mb-4">
      <Row className="align-items-center g-3">
        
        {/* Título (Se adapta en móviles) */}
        <Col xs={12} lg={5}>
          <h2 className="fw-bold m-0" style={{ color: '#003F89' }}>
            <i className="bi bi-activity me-2"></i>Monitoreo Docente
          </h2>
        </Col>

        {/* Tarjeta de Estadísticas (Alineada a la derecha en PC, centro en móviles) */}
        <Col xs={12} lg={7}>
          <div className="bg-white p-3 rounded shadow-sm border d-flex justify-content-around align-items-center text-center flex-wrap">
            
            <div className="px-2">
              <div className="monitoreo-stats-label text-uppercase">Docentes Pendientes</div>
              <div className="monitoreo-stats-value text-dark">{docentesPendientes}</div>
            </div>
            
            <div className="d-none d-sm-block border-end h-50"></div> {/* Separador solo en PC */}
            
            <div className="px-2 mt-3 mt-sm-0">
              <div className="monitoreo-stats-label text-uppercase">Alumnos Sin Nota</div>
              <div className="monitoreo-stats-value text-dark">{alumnosSinNota}</div>
            </div>
            
            <div className="d-none d-sm-block border-end h-50"></div> {/* Separador solo en PC */}
            
            <div className="px-2 mt-3 mt-sm-0">
              <div className="monitoreo-stats-label text-uppercase">Estado</div>
              <div className={`monitoreo-stats-value ${colorEstado}`}>{estado}</div>
            </div>

          </div>
        </Col>

      </Row>
    </div>
  );
}

export default MonitoreoHeader;