import React from 'react'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ErrorMessage } from '../../../Utils/ErrorMesaje';
import AutoCompleteInput from '../../Admin/Modules/Configuration/Cursos/AutoCompleteInput';
import Boton from '../../../components/Boton';
import SelectorHoraMinuto from '../../Admin/Modules/Configuration/Cursos/SelectorHoraMinuto';



function CrearCursoIndividual({ onCancel, onSave, periodo, docente, modoEdicion = false, datosIniciales = null }) {
  const [asignatura, setAsignatura] = useState("");
  const [asignaturas, setAsignaturas] = useState([])
  const [dia1, setDia1] = useState("")
  const [dia2, setDia2] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [hora1, setHora1] = useState(null)
  const [hora2, setHora2] = useState(null)
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const token=localStorage.getItem("token")
  
  useEffect(() => {
    axios.get(`${API_URL}/materia/individual`,{headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        setAsignaturas(response.data);
      })
      .catch(error => {
        ErrorMessage(error);
      })
  }, []);

  useEffect(() => {
    if (modoEdicion && datosIniciales) {
      setAsignatura(datosIniciales.Materia);
      setDia1(datosIniciales.dias?.[0] || "");
      setDia2(datosIniciales.dias?.[1] || "");
      setHoraInicio(datosIniciales.horaInicio || "");
      setHoraFin(datosIniciales.horaFin || "");
      setHora1(datosIniciales.hora1 || null);
      setHora2(datosIniciales.hora2 || null);
    }
  }, [modoEdicion, datosIniciales]);
 

  const handleSubmit = () => {

    try {
      if (!periodo) {
        throw new Error("No se ha seleccionado un periodo");
      }
      let dias
      if (dia1 === "") {
        dias = [dia2]
      }
      else if (dia2 === "") {
        dias = [dia1]
      }
      else {
        dias = [dia1, dia2]
      }
      if(dia1===dia2){
        throw new Error("Los días deben ser diferentes")
      }
      const newAsignacion = { hora1,hora2,horaInicio, horaFin, dias, ID_periodo_academico: Number(periodo), nroCedula_docente: docente.nroCedula, ID_materia: asignatura.ID, cupos: 1 };
      onSave(newAsignacion)
    } catch (error) {
      ErrorMessage(error)
    }

  };

  return (
    <div className="modal-overlay">
      <div className='modal-container'>
        <h2 className='modal-title'>{modoEdicion ? "Editar curso" : "Agregar curso"}</h2>
        <div className="modal-form">
          <div className='rows'>

            <div className="form-group">
              <label htmlFor="asignaturas">Asignatura:</label>
              <AutoCompleteInput inputValue={asignatura} setInputValue={setAsignatura} opciones={asignaturas} key1="nombre" key2="nivel" />
            </div>
          </div>
          <div className='rows'>

            
            <div className="form-group">
              <label htmlFor="Dia1">Día 1:</label>
              <select id="Dia1" value={dia1} onChange={(e) => setDia1(e.target.value)}>
                <option value="">Selecciona un día</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miercóles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
              </select>
            </div>
            <div className='form-group'>
              <label htmlFor="">Horar inicio:</label>
              <SelectorHoraMinuto
                              value={horaInicio}
                              onChange={(e) => setHoraInicio(e.target.value)}
                              min="07:00"
                              max="19:00"
                            />

            </div>
            <div className='form-group'>
              <label htmlFor="">Horar fin:</label>
              <SelectorHoraMinuto
                              value={horaFin}
                              onChange={(e) => setHoraFin(e.target.value)}
                              min="07:00"
                              max="19:00"
                            />

            </div>

          </div>
          <div className='rows'>
    
            <div className="form-group">
              <label htmlFor="Dia2">Día 2:</label>
              <select id="Dia2" value={dia2} onChange={(e) => setDia2(e.target.value)}>
                <option value="">Selecciona un día</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miercóles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
              </select>
            </div>
            <div className='form-group'>
              <label htmlFor="">Horar inicio:</label>
              <SelectorHoraMinuto
                              value={hora1}
                              onChange={(e) => setHora1(e.target.value)}
                              min="07:00"
                              max="19:00"
                            />

            </div>
            <div className='form-group'>
              <label htmlFor="">Horar fin:</label>
              <SelectorHoraMinuto
                              value={hora2}
                              onChange={(e) => setHora2(e.target.value)}
                              min="07:00"
                              max="19:00"
                            />

            </div>
            

          </div>
        </div>

        <div className="botones">
          <Boton texto="Guardar" onClick={() => handleSubmit()} estilo="boton-crear" />
          <Boton texto="Cancelar" onClick={onCancel} estilo="boton-cancelar" />
        </div>
      </div>

    </div>
  );
}

export default CrearCursoIndividual