import React, { useEffect, useState } from 'react';
import Boton from '../../../../../components/Boton';
import DatePicker from 'react-datepicker';
import '../../../Styles/CrearEntidad.css';
import "react-datepicker/dist/react-datepicker.css";
import { convertirFecha } from '../../../../../Utils/Funciones';
import FileUploader from '../../../../components/FileUploader.jsx';


function CrearEstudiante({ onCancel, entityToUpdate, onSave, representante }) {
  const [nroCedula, setNroCedula] = useState("")
  const [primer_nombre, setPrimerNombre] = useState("");
  const [primer_apellido, setPrimerApellido] = useState("");
  const [segundo_nombre, setSegundoNombre] = useState("");
  const [segundo_apellido, setSegundoApellido] = useState("");
  const [genero, setGenero] = useState("")
  const [jornada, setJornada] = useState("")
  const [fecha_nacimiento, setFechaNacimiento] = useState("")
  const [grupo_etnico, setGrupoEtnico] = useState("")
  const [especialidad, setEspecialidad] = useState("")
  const [IER, setIER] = useState("")
  const [sector, setSector] = useState("")
  const [parroquia, setParroquia] = useState("")
  const [canton, setCanton] = useState("")
  const [nacionalidad, setNacionalidad] = useState("")
  const [nivel, setNivel] = useState("1ro Básico Elemental")
  const token = localStorage.getItem("token")

  useEffect(() => {
    if (entityToUpdate) {
      setNroCedula(entityToUpdate.nroCedula || "");
      setPrimerNombre(entityToUpdate.primer_nombre || "");
      setPrimerApellido(entityToUpdate.primer_apellido || "");
      setSegundoNombre(entityToUpdate.segundo_nombre || "");
      setSegundoApellido(entityToUpdate.segundo_apellido || "");
      setGenero(entityToUpdate.genero || "");
      setJornada(entityToUpdate.jornada || "")
      setFechaNacimiento(convertirFecha(entityToUpdate.fecha_nacimiento) || "")
      setGrupoEtnico(entityToUpdate.grupo_etnico || "")
      setEspecialidad(entityToUpdate.especialidad || "")
      setIER(entityToUpdate.IER || "")
      const palabras = entityToUpdate.direccion.split(" ")
      setSector(palabras[0] || "")
      setParroquia(palabras[1] || "")
      setCanton(palabras[2] || "")
      setNacionalidad(entityToUpdate.nacionalidad || "")
      setNivel(entityToUpdate.nivel || "")
    }
  }, [entityToUpdate]);


  const [files, setFiles] = useState({
    matricula_IER: entityToUpdate ? entityToUpdate.matricula_IER : null,
    copiaCedula: entityToUpdate ? entityToUpdate.copiaCedula : null
  });
  const handleFileChange = (event) => {
    const { name, files } = event.target;
    setFiles((prevState) => ({
      ...prevState,
      [name]: files[0], // Solo se selecciona un archivo por input
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const direccion = [sector, parroquia, canton].join(" ")

    console.log("fecha de nacimiento enviada a la base", fecha_nacimiento)
    const formData = new FormData();
    formData.append("copiaCedula", files.copiaCedula);
    formData.append("matricula_IER", files.matricula_IER);
    formData.append("nroCedula", nroCedula)
    formData.append("primer_nombre", primer_nombre)
    formData.append("primer_apellido", primer_apellido)
    formData.append("segundo_nombre", segundo_nombre)
    formData.append("segundo_apellido", segundo_apellido)
    formData.append("genero", genero)
    formData.append("jornada", jornada)
    formData.append("fecha_nacimiento", fecha_nacimiento)
    formData.append("grupo_etnico", grupo_etnico)
    formData.append("especialidad", especialidad)
    formData.append("IER", IER)
    formData.append("direccion", direccion)
    formData.append("nacionalidad", nacionalidad)
    formData.append("nivel", nivel)

    if (!entityToUpdate) {
      formData.append("nroCedula_representante", representante)
      onSave(formData, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } });
    } else {
      onSave(formData, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } })
    }


  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-estudiante">
        <h2 className="modal-title">{entityToUpdate ? 'Editar estudiante' : 'Agregar estudiante'}</h2>

        <form onSubmit={(e) => handleSubmit(e)} className="modal-form">
          <div className='rows'>
            <div className="form-group">
              <label htmlFor="nroCedula">Cédula/Pasaporte:</label>
              <input required id="nroCedula" value={nroCedula} onChange={(e) => setNroCedula(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="nacionalidad">Nacionalidad:</label>
              <input required id="nacionalidad" value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} />
            </div>
          </div>
          <div className='rows'>
            <div className="form-group">
              <label htmlFor="primer_nombre">Primer nombre:</label>
              <input required id="primer_nombre" value={primer_nombre} onChange={(e) => setPrimerNombre(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="primer_apellido">Primer apellido:</label>
              <input required id="primer_apellido" value={primer_apellido} onChange={(e) => setPrimerApellido(e.target.value)} />
            </div>
          </div>

          <div className='rows'>
            <div className="form-group">
              <label htmlFor="segundo_nombre">Segundo nombre:</label>
              <input required id="segundo_nombre" value={segundo_nombre} onChange={(e) => setSegundoNombre(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="segundo_apellido">Segundo apellido:</label>
              <input required id="segundo_apellido" value={segundo_apellido} onChange={(e) => setSegundoApellido(e.target.value)} />
            </div>

          </div>
          <div className='rows'>



          </div>
          <div className='rows'>

            <div className="form-group">
              <label htmlFor="jornada">Jornada :</label>
              <select required id="jornada" value={jornada} onChange={(e) => setJornada(e.target.value)}>
                <option value="" disabled selected>Selecciona una jornada</option>
                <option value="Matutina">Matutina</option>
                <option value="Vespertina">Vespertina</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="genero">Genero:</label>
              <select required id="genero" value={genero} onChange={(e) => setGenero(e.target.value)}>
                <option value="" disabled selected>Selecciona un genero</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>
          <div className='rows'>
            <div className="form-group">
              <label htmlFor="fecha_nacimiento">Fecha de nacimiento:</label>
              <DatePicker
                selected={fecha_nacimiento}
                onChange={(date) => setFechaNacimiento(date)}
                dateFormat="dd/MM/yyyy"
                className="input-field"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date()}
                openToDate={new Date(new Date().setFullYear(new Date().getFullYear() - 9))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="grupo_etnico">Grupo Etnico:</label>
              <select required id="genero" value={grupo_etnico} onChange={(e) => setGrupoEtnico(e.target.value)}>
                <option value="" disabled selected>Selecciona un grupo</option>
                <option value="Indígena">Indígena</option>
                <option value="Mestizo">Mestizo</option>
                <option value="Afro-descendiente">Afro-descendiente</option>
                <option value="Negro">Negro</option>
                <option value="Blanco">Blanco</option>
              </select>
            </div>
          </div>
          <div className='rows'>
            <div className="form-group">
              <label htmlFor="especialidad">Especialidad:</label>
              <input required id="especialidad" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="IER">Institución de eduación regular:</label>
              <input required id="IER" value={IER} onChange={(e) => setIER(e.target.value)} />
            </div>
          </div>
          <div className='rows'>

            <div className="form-group">
              <label htmlFor="nivel">Nivel:</label>
              <select required id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                <option value="1ro Básico Elemental" >1ro Básico Elemental</option>
                <option value="2do Básico Elemental">2do Básico Elemental</option>
                <option value="1ro Básico Medio">1ro Básico Medio</option>
                <option value="2do Básico Medio">2do Básico Medio</option>
                <option value="3ro Básico Medio">3ro Básico Medio</option>
                <option value="1ro Básico Superior">1ro Básico Superior</option>
                <option value="2do Básico Superior">2do Básico Superior</option>
                <option value="3ro Básico Superior">3ro Básico Superior</option>
                <option value="1ro Bachillerato">1ro Bachillerato</option>
                <option value="2do Bachillerato">2do Bachillerato</option>
                <option value="3ro Bachillerato">3ro Bachillerato</option>
                <option value="Graduado">Graduado</option>

              </select>
            </div>
          </div>
          <div className='rows'>
            <label htmlFor="direccion">Dirección:</label>
          </div>
          <div className='rows'>
            <div className='form-group-direccion'>
              <label htmlFor="">Sector: </label>
              <input required type="text" value={sector} onChange={(e) => setSector(e.target.value)} />
            </div>
            <div className='form-group-direccion'>
              <label htmlFor="">Parroquia: </label>
              <input required type="text" value={parroquia} onChange={(e) => setParroquia(e.target.value)} />
            </div>
            <div className='form-group-direccion'>
              <label htmlFor="">Canton: </label>
              <input required type="text" value={canton} onChange={(e) => setCanton(e.target.value)} />
            </div>


          </div>
          <div className="file-upload-container">
            <FileUploader
              label="Copia de Cédula:"
              name="copiaCedula"
              currentFilePath={entityToUpdate?.cedula_PDF} // <-- La ruta que te devuelve el backend
              onChange={handleFileChange}
              disabled={false}
              
            />

            <FileUploader
              label="Matrícula IER:"
              name="matricula_IER"
              currentFilePath={entityToUpdate?.matricula_IER_PDF} // <-- Asumiendo que así se llame tu campo en la BD
              onChange={handleFileChange}
              disabled={false}
              
            />
          </div>
          <div className='rows-botones'>
            <div className="botones">
              <button type='submit' className='boton-crear' >Guardar</button>
              <Boton texto="Cancelar" onClick={onCancel} estilo="boton-cancelar" />
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}


export default CrearEstudiante