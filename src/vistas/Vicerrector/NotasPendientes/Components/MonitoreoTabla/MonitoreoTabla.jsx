import React from 'react';
import { Table, Form } from 'react-bootstrap';

function MonitoreoTabla({ docentes, onToggleNotificacion, onDiasChange }) {
    if (docentes.length === 0) {
        return <p className="text-muted text-center mt-4">No hay docentes pendientes por monitorear.</p>;
    }
    return (
        <div className="tabla-contenedor-card">
            <div className="table-responsive"> {/* <-- Clave para pantallas pequeñas */}
                <Table hover className="align-middle tabla-monitoreo mb-0">
                    <thead>
                        <tr>
                            <th>Docente</th>
                            <th>Materia</th>
                            <th>Nivel</th>
                            <th className="text-center">Pendientes</th>
                            <th className="text-center" style={{ width: '150px' }}>Acción</th>
                            <th className="text-center">Dias</th>
                        </tr>
                    </thead>
                    <tbody>
                        {docentes.map((docente) => (
                            <tr key={docente.id}>
                                <td className="fw-semibold">{docente.nombre}</td>
                                <td>{docente.materia}</td>
                                <td>{docente.nivel}</td>
                                <td className="text-center">
                                    <span className="badge-pendientes">
                                        {docente.pendientes}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex justify-content-center">
                                        <Form.Check
                                            type="switch"
                                            id={`switch-docente-${docente.id}`}
                                            checked={docente.notificacionActiva}
                                            onChange={() => onToggleNotificacion(docente.id)}
                                            label={docente.notificacionActiva ? "Habilitado" : "Inhabilitado"}
                                            className={docente.notificacionActiva ? "text-primary fw-semibold" : "text-muted"}
                                        />
                                    </div>

                                </td>
                                <td>
                                    <div className="d-flex justify-content-center">
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={docente.dias || 1} 
                                            onChange={(e) => onDiasChange(docente.id, parseInt(e.target.value) || 1)}
                                            disabled={docente.notificacionActiva}
                                            className="form-control-sm text-center"
                                            style={{ maxWidth: '70px' }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

export default MonitoreoTabla;