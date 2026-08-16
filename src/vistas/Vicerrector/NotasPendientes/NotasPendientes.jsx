import React,{useState} from 'react'
import MonitoreoHeader from './Components/MonitoreoHeader/MonitoreoHedaer.jsx';
import MonitoreoTabla from './Components/MonitoreoTabla/MonitoreoTabla.jsx';
import './NotasPendientes.css';

function NotasPendientes() {
    const [docentes, setDocentes] = useState([
        {
            id: 1,
            nombre: 'Juan Pérez',
            materia: 'Matemáticas',
            nivel: '1ro Básico Medio',
            pendientes: 5,
            notificacionActiva: false // Este es el bool para el Switch
        },
        {
            id: 2,
            nombre: 'Ana Torres',
            materia: 'Lenguaje',
            nivel: '2do Básico Superior',
            pendientes: 2,
            notificacionActiva: false
        }
    ]);

    // Cálculos dinámicos para el encabezado basados en los datos actuales
    const totalDocentesPendientes = docentes.filter(d => d.pendientes > 0).length;
    const totalAlumnosSinNota = docentes.reduce((acc, docente) => acc + docente.pendientes, 0);

    // Lógica simple para determinar el estado (puedes ajustarla luego)
    const estadoGeneral = totalAlumnosSinNota > 5 ? "Crítico" : "Estable";

    // Función para manejar el cambio del Switch
    const handleToggleNotificacion = (id) => {
        setDocentes(prevDocentes =>
            prevDocentes.map(docente =>
                docente.id === id
                    ? { ...docente, notificacionActiva: !docente.notificacionActiva }
                    : docente
            )
        );
    };

    return (
        <div className="contenedor-monitoreo">
            {/* Componente del Encabezado */}
            <MonitoreoHeader
                docentesPendientes={totalDocentesPendientes}
                alumnosSinNota={totalAlumnosSinNota}
                estado={estadoGeneral}
            />

            {/* Componente de la Tabla */}
            <div className="contenedor-lista mt-4">
                <MonitoreoTabla
                    docentes={docentes}
                    onToggleNotificacion={handleToggleNotificacion}
                />
            </div>
        </div>
    );
}

export default NotasPendientes