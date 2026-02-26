import React from 'react'
import { FaTrash } from 'react-icons/fa'; // Importar íconos
function TablaInscripciones({inscripciones,OnDelete}) {
    console.log("estas son las inscripciones en tabla",inscripciones)
  return (
    <div className="Contenedor-tabla">
                    {inscripciones.length === 0 ? (
                        <p className="no-registros">No hay registros disponibles.</p>
                    ) : (
                        <table className="tabla_registros">
                            <thead>
                                <tr>
                                    <th className='tabla-head'>Estudiante</th>
                                    <th className='tabla-head'>Nivel</th>
                                    <th className='tabla-head'>Materia</th>
                                    <th className='tabla-head'>Docente</th>
                                    <th className='tabla-head'>Día 1</th>
                                    <th className='tabla-head'>Día 2</th>
                                    <th className='tabla-head'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inscripciones.map((item, index) => (
                                    <tr key={index}>
                                        
                                        <td className='tabla-celda'>{`${item.Matricula.Estudiante.primer_nombre} ${item.Matricula.Estudiante.primer_apellido}`}</td>
                                        <td className='tabla-celda'>{item.Matricula.Estudiante.nivel}</td>
                                        <td className='tabla-celda'>{item.Asignacion.Materia.nombre}</td>
                                        <td className='tabla-celda'>{`${item.Asignacion.Docente.primer_nombre} ${item.Asignacion.Docente.primer_apellido}`}</td>
                                        <td className='tabla-celda'>{`${item.Asignacion.dias[0]} ${item.Asignacion.horaInicio}-${item.Asignacion.horaFin}`}</td>
                                        <td className='tabla-celda'>
                                            {item.Asignacion.hora1 && item.Asignacion.hora2 
                                                ? `${item.Asignacion.dias[1]} ${item.Asignacion.hora1}-${item.Asignacion.hora2}` 
                                                : "-"}
                                        </td>
                                        <td className='botones-icon'>
                                            <FaTrash
                                                size={20}
                                                className="icon delete-icon"
                                                onClick={()=>OnDelete(item)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
    
                    )}
    
    
    
                </div>
  )
}

export default TablaInscripciones