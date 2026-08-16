import React, { useEffect, useState } from 'react';
import Boton from '../../../../../components/Boton';
import '../../../Styles/CrearEntidad.css';
import FileUploader from '../../../../components/FileUploader.jsx';

function CrearRepresentante({ onCancel, entityToUpdate, onSave }) {
  const [nroCedula, setNroCedula] = useState("")
  const [primer_nombre, setPrimerNombre] = useState("");
  const [primer_apellido, setPrimerApellido] = useState("");
  const [segundo_nombre, setSegundoNombre] = useState("");
  const [segundo_apellido, setSegundoApellido] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [convencional, setConvencional] = useState("");
  const [emergencia, setEmergencia] = useState("");


  useEffect(() => {
    if (entityToUpdate) {
      setNroCedula(entityToUpdate.nroCedula || "");
      setPrimerNombre(entityToUpdate.primer_nombre || "");
      setPrimerApellido(entityToUpdate.primer_apellido || "");
      setSegundoNombre(entityToUpdate.segundo_nombre || "");
      setSegundoApellido(entityToUpdate.segundo_apellido || "");
      setCelular(entityToUpdate.celular || "");
      setEmail(entityToUpdate.email || "");
      setConvencional(entityToUpdate.convencional || "")
      setEmergencia(entityToUpdate.emergencia || "")
    }
  }, [entityToUpdate]);

  const [files, setFiles] = useState(() => ({
    croquis: entityToUpdate ? entityToUpdate.croquis : null,
    copiaCedula: entityToUpdate ? entityToUpdate.copiaCedula : null
  }));

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    setFiles((prevState) => ({
      ...prevState,
      [name]: files[0], // Solo se selecciona un archivo por input
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("copiaCedula", files.copiaCedula);
    formData.append("croquis", files.croquis);
    formData.append("nroCedula", nroCedula)
    console.log("esta era la cédula", nroCedula)
    formData.append("primer_nombre", primer_nombre)
    formData.append("primer_apellido", primer_apellido)
    formData.append("segundo_nombre", segundo_nombre)
    formData.append("segundo_apellido", segundo_apellido)
    formData.append("email", email)
    formData.append("celular", celular)
    formData.append("convencional", convencional)
    formData.append("emergencia", emergencia)

    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-representante">
        <h2 className="modal-title">{entityToUpdate ? 'Editar representante' : 'Agregar representante'}</h2>

        <form onSubmit={(e) => handleSubmit(e)} className="modal-form">
          <div className='rows'>
            <div className="form-group">
              <label htmlFor="nroCedula">Número de cédula:</label>
              <input required id="nroCedula" value={nroCedula} onChange={(e) => setNroCedula(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="celular">#Celular:</label>
              <input required id="celular" value={celular} onChange={(e) => setCelular(e.target.value)} />
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
            <div className="form-group">
              <label htmlFor="convencional">#Convencional :</label>
              <input required id="convencional" value={convencional} onChange={(e) => setConvencional(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="convencional">#Emergencia :</label>
              <input required id="emergencia" value={emergencia} onChange={(e) => setEmergencia(e.target.value)} />
            </div>
          </div>
          <div className='rows'>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input required id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className='form-group'>

            </div>
          </div>
          <div className='file-upload-container'>
            <FileUploader
              label="Copia de Cédula:"
              name="copiaCedula"
              currentFilePath={entityToUpdate?.cedula_PDF}
              onChange={handleFileChange}
              disabled={false}
              
            />
            <FileUploader
              label="Croquis:"
              name="croquis"
              currentFilePath={entityToUpdate?.croquis_PDF} // <-- Asumiendo que así se llame tu campo en la BD
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


export default CrearRepresentante