import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { ErrorMessage } from '../../../../Utils/ErrorMesaje';
import Swal from 'sweetalert2';
import './Busqueda.css';

function Horarios({asignaciones, onRetirarInscripcion}) {
    
    const handleRetirarInscripcion = async (asignacion) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: `¿Desea retirar la inscripción de ${asignacion.Materia?.nombre}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#003F89',
            confirmButtonText: 'Sí, retirar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed && onRetirarInscripcion) {
            onRetirarInscripcion(asignacion);
        }
    };
    
    // Función para obtener el horario correcto por día
    const getHorarioPorDia = (asignacion, dia) => {
        if (asignacion.Asignacion?.rangoPorDia && asignacion.Asignacion.rangoPorDia[dia]) {
            return asignacion.Asignacion.rangoPorDia[dia];
        }
        return { horaInicio: asignacion.horaInicio, horaFin: asignacion.horaFin };
    };

    // Función para organizar las asignaciones por día de la semana
    const organizarPorDias = () => {
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const horarioPorDia = {};
        
        diasSemana.forEach(dia => {
            horarioPorDia[dia] = [];
        });

        asignaciones.forEach(asignacion => {
            if (asignacion && asignacion.dias) {
                asignacion.dias.forEach(dia => {
                    if (horarioPorDia[dia]) {
                        horarioPorDia[dia].push(asignacion);
                    }
                });
            }
        });

        return horarioPorDia;
    };

    const horarioOrganizado = organizarPorDias();

    if (!asignaciones || asignaciones.length === 0) {
        return null;
    }

    return (
        <div className="contenedor-horarios">
            <h3 className="titulo-horarios">Horario de Clases Inscritas</h3>
            
            <div className="contenedor-tabla-horarios">
                <table className="tabla-horarios">
                    <thead>
                        <tr>
                            <th className="encabezado-horarios">Día</th>
                            <th className="encabezado-horarios">Materia</th>
                            <th className="encabezado-horarios">Docente</th>
                            <th className="encabezado-horarios">Horario</th>
                            <th className="encabezado-horarios">Paralelo</th>
                            <th className="encabezado-horarios">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(horarioOrganizado).map(([dia, asignacionesDia]) => 
                            asignacionesDia.length > 0 ? (
                                asignacionesDia
                                    .sort((a, b) => getHorarioPorDia(a, dia).horaInicio.localeCompare(getHorarioPorDia(b, dia).horaInicio))
                                    .map((asignacion, index) => {
                                        const horarioDia = getHorarioPorDia(asignacion, dia);
                                        return (
                                    <tr key={`${dia}-${index}`}>
                                        <td className="celda-horarios dia-semana">{dia}</td>
                                        <td className="celda-horarios">{asignacion.Materia?.nombre || 'Sin materia'}</td>
                                        <td className="celda-horarios">
                                            {asignacion.Docente ? 
                                                `${asignacion.Docente.primer_nombre} ${asignacion.Docente.primer_apellido}` 
                                                : 'Sin docente'
                                            }
                                        </td>
                                        <td className="celda-horarios">{horarioDia.horaInicio} - {horarioDia.horaFin}</td>
                                        <td className="celda-horarios">{asignacion.paralelo}</td>
                                        <td className="celda-horarios">
                                            <i 
                                                className="bi bi-trash3 icono-retirar"
                                                onClick={() => handleRetirarInscripcion(asignacion)}
                                                title="Retirar inscripción"
                                            ></i>
                                        </td>
                                    </tr>
                                )})
                            ) : null
                        )}
                    </tbody>
                </table>
            </div>

            {/* Vista resumida por día */}
            <div className="resumen-semanal">
                <h4>Resumen Semanal</h4>
                <div className="grid-dias">
                    {Object.entries(horarioOrganizado).map(([dia, asignacionesDia]) => (
                        <div key={dia} className={`dia-container ${asignacionesDia.length > 0 ? 'con-clases' : 'sin-clases'}`}>
                            <div className="dia-titulo">{dia}</div>
                            <div className="dia-contenido">
                                {asignacionesDia.length > 0 ? (
                                    asignacionesDia
                                        .sort((a, b) => getHorarioPorDia(a, dia).horaInicio.localeCompare(getHorarioPorDia(b, dia).horaInicio))
                                        .map((asignacion, index) => {
                                            const horarioDia = getHorarioPorDia(asignacion, dia);
                                            return (
                                        <div key={index} className="clase-item">
                                            <span className="materia-nombre">{asignacion.Materia?.nombre}</span>
                                            <span className="docente-nombre">
                                                {asignacion.Docente ? 
                                                    `${asignacion.Docente.primer_nombre} ${asignacion.Docente.primer_apellido}` 
                                                    : 'Sin docente'
                                                }
                                            </span>
                                            <span className="horario-time">{horarioDia.horaInicio} - {horarioDia.horaFin}</span>
                                        </div>
                                    )})
                                ) : (
                                    <span className="sin-clases-texto">Sin clases</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Horarios