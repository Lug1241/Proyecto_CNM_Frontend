import React, { useState, useEffect } from 'react';
import MonitoreoHeader from './Components/MonitoreoHeader/MonitoreoHedaer.jsx';
import MonitoreoTabla from './Components/MonitoreoTabla/MonitoreoTabla.jsx';
import './NotasPendientes.css';

function NotasPendientes() {
    const [docentes, setDocentes] = useState([]);
    const [docentesOriginales, setDocentesOriginales] = useState([]); 
    const [busqueda, setBusqueda] = useState('');
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

    const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;

    // 1. CARGA INICIAL
    useEffect(() => {
        const fetchMonitoreoInicial = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/docente/monitoreo`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    const monitoreoMapeado = data.detalles.map(doc => ({
                        id: doc.nroCedula, 
                        nombre: doc.docente,
                        materia: doc.materia,
                        nivel: doc.nivel,
                        pendientes: doc.pendientes,
                        notificacionActiva: doc.habilitado,
                        dias: 1 
                    }));

                    setDocentes(monitoreoMapeado);
                    setDocentesOriginales(monitoreoMapeado); 
                }
            } catch (error) {
                console.error("Error al cargar monitoreo inicial:", error);
            }
        };

        fetchMonitoreoInicial();
    }, [API_URL]);

    // 2. BÚSQUEDA BLINDADA CONTRA RECARGAS
    const ejecutarBusqueda = async () => {
        if (!busqueda.trim()) {
            setDocentes(docentesOriginales);
            return;
        }

        // 🚨 FORZAMOS el vaciado de la tabla inmediatamente para confirmar visualmente que buscó
        setDocentes([]);
        setCargandoBusqueda(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/docente/get/nombre/${encodeURIComponent(busqueda.trim())}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                
                const docentesMapeados = data.map(doc => ({
                    id: doc.nroCedula, 
                    nombre: `${doc.primer_nombre || ''} ${doc.primer_apellido || ''}`.trim(),
                    materia: 'N/A (Búsqueda General)', 
                    nivel: 'N/A',
                    pendientes: 0, 
                    notificacionActiva: doc.habilitado || false, 
                    dias: 1 
                }));

                setDocentes(docentesMapeados);
            } else {
                // Si el backend dice "No encontrado" (404), mantenemos la tabla vacía
                setDocentes([]);
            }
        } catch (error) {
            console.error("Error al buscar docente:", error);
            alert("Error de conexión al buscar docente. Revisa la consola.");
            setDocentes([]); 
        } finally {
            setCargandoBusqueda(false);
        }
    };

    // Prevenimos el Enter en el input para que no recargue la página
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            ejecutarBusqueda();
        }
    };

    const handleLimpiarBusqueda = () => {
        setBusqueda('');
        setDocentes(docentesOriginales);
    };

    const totalDocentesPendientes = docentes.filter(d => d.pendientes > 0).length;
    const totalAlumnosSinNota = docentes.reduce((acc, docente) => acc + docente.pendientes, 0);
    const estadoGeneral = totalAlumnosSinNota > 50 ? "Crítico" : (totalAlumnosSinNota > 0 ? "Atención" : "Estable");

    const handleToggleNotificacion = async (idCedula) => {
        const docenteActual = docentes.find(d => d.id === idCedula);
        if (!docenteActual) return;

        const nuevoEstadoHabilitado = !docenteActual.notificacionActiva;
        let habilitado_hasta = null;

        if (nuevoEstadoHabilitado) {
            const diasAAgregar = parseInt(docenteActual.dias) || 1;
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() + diasAAgregar);
            habilitado_hasta = fechaLimite.toISOString(); 
        }

        const actualizarEstadoLocal = (lista) => 
            lista.map(doc => doc.id === idCedula ? { ...doc, notificacionActiva: nuevoEstadoHabilitado } : doc);

        setDocentes(actualizarEstadoLocal(docentes));
        setDocentesOriginales(actualizarEstadoLocal(docentesOriginales)); 

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/docente/editar/${idCedula}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    habilitado: nuevoEstadoHabilitado,
                    habilitado_hasta: habilitado_hasta
                })
            });

            if (!response.ok) throw new Error("Rechazado");
            
        } catch (error) {
            const revertirEstadoLocal = (lista) => 
                lista.map(doc => doc.id === idCedula ? { ...doc, notificacionActiva: !nuevoEstadoHabilitado } : doc);
            setDocentes(revertirEstadoLocal(docentes));
            setDocentesOriginales(revertirEstadoLocal(docentesOriginales));
        }
    };

    const handleDiasChange = (idCedula, dias) => {
        const actualizarDias = (lista) => 
            lista.map(doc => doc.id === idCedula ? { ...doc, dias } : doc);
        setDocentes(actualizarDias(docentes));
        setDocentesOriginales(actualizarDias(docentesOriginales));
    };

    return (
        <div className="contenedor-monitoreo">
            <MonitoreoHeader
                docentesPendientes={totalDocentesPendientes}
                alumnosSinNota={totalAlumnosSinNota}
                estado={estadoGeneral}
            />

            {/* Quitamos la etiqueta <form> para evitar recargas nativas */}
            <div className="buscador-personalizado d-flex gap-2">
                <input
                    type="text"
                    className="input-buscador form-control"
                    placeholder="Buscar docente general por nombre o apellido..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={handleKeyDown} 
                />
                <button 
                    type="button" // 👈 Clave para que no envíe formularios
                    onClick={ejecutarBusqueda} 
                    disabled={cargandoBusqueda} 
                    className="btn btn-primary btn-buscar-custom"
                >
                    <i className="bi bi-search"></i> Buscar
                </button>
                {busqueda && (
                    <button type="button" onClick={handleLimpiarBusqueda} className="btn btn-secondary btn-limpiar-custom">
                        <i className="bi bi-x-lg"></i>
                    </button>
                )}
            </div>

            <div className="contenedor-lista mt-4">
                <MonitoreoTabla
                    docentes={docentes}
                    onToggleNotificacion={handleToggleNotificacion}
                    onDiasChange={handleDiasChange}
                />
            </div>
        </div>
    );
}

export default NotasPendientes;