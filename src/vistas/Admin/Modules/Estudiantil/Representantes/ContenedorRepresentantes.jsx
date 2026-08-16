import React, { useState } from 'react';
import TablaEstudiantil from '../Estudiantes/TablaEstudiantes';
import { Eliminar } from '../../../../../Utils/CRUD/Eliminar';
import { Editar } from '../../../../../Utils/CRUD/Editar';
import "../../../Styles/Contenedor.css"



function ContenedorRepresentantes({ search, filtrar, data, setData, headers, columnsToShow, filterKey, apiEndpoint, CrearEntidad, PK, OnView}) {
  
  const [entityToUpdate, setEntityToUpdate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
 const [isDownloadOpen,setDownload]=useState(false)
 const token= localStorage.getItem("token")


  

  const toggleModal = (modal) => {
    if(modal==="download") return setDownload((prev)=>!prev)
    setIsModalOpen((prev) => !prev);
    setEntityToUpdate(null);
  };

  const handleSaveEntity = (newEntity) => {
    console.log("estoy llegando hasta aca")
    Editar(entityToUpdate, newEntity, `${API_URL}/${apiEndpoint}`, setData, setIsModalOpen, PK, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } });
  };

  const handleEdit = (entity) => {
    setEntityToUpdate(entity);
    setIsModalOpen(true);
  };

  const handleDelete = (entity) => {
    Eliminar(entity, `${API_URL}/${apiEndpoint}/eliminar`, entity[filterKey], setData, PK);
  };
  

  return (
    <div className='Contenedor-tabla'>
      <div className="filter-container">
        <input
          value={search}
          onChange={(e) => filtrar(e)}
          className="search-input"
          placeholder={`Filtrar por ${filterKey}`}
        />
       
        
      </div>

      {isModalOpen && (
        <CrearEntidad
          onCancel={toggleModal}
          entityToUpdate={entityToUpdate}
          onSave={handleSaveEntity}
        />
      )}
      {isDownloadOpen && (
            <DownloadFiles
              onCancel={()=>toggleModal("download")}
              setDownload={setDownload}
            />
      )}
      <TablaEstudiantil
        filteredData={data}
        OnEdit={handleEdit}
        OnDelete={handleDelete}
        OnView={OnView}
        headers={headers}
        columnsToShow={columnsToShow}
      />
    </div>
  );
}

export default ContenedorRepresentantes;