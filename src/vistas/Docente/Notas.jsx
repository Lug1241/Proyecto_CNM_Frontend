import { useState } from "react";
import { Tabs, Tab, Container } from "react-bootstrap";
import { useNavigate, useLocation } from 'react-router-dom';
import Parcial from "./Parcial";
import Quimestral from "./Quimestral";
import Final from "./Final";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";

function Notas({ usuario, modules, datosModulo, handleSidebarNavigation, handleExportPDF,
  forceEdit, inputsDisabled, estadoFechas, textoRangoFechas, activeMainTab, activeSubTabQuim1, activeSubTabQuim2, setActiveMainTab,
  setActiveSubTabQuim1, setActiveSubTabQuim2, parcial1Quim1Data, parcial2Quim1Data, parcial1Quim2Data, parcial2Quim2Data, quim1Data,
  quim2Data, finalData, handleActualizarParcial1Quim1, handleActualizarParcial2Quim1, handleActualizarParcial1Quim2, handleActualizarParcial2Quim2,
  handleActualizarQuim1, handleActualizarQuim2, handleActualizarFinal, handleEditarFila, soloLectura, getRangoValido, esPorSolicitud,
  savedKeys, savedKeysQuim, savedKeysFinal, makeKey, makeKeyQuim, makeKeyFinal, agregarSavedKey, agregarSavedKeyQuim, agregarSavedKeyFinal,
  editingRow, setEditingRow }) {

  // Determinar el activeModule según el rol del usuario
  const getActiveModule = () => {
    if (!usuario) return null;
    const esSecretaria = usuario.subRol?.toLowerCase() === "secretaria";
    return esSecretaria ? null : 1; // Secretaria: sin módulo activo, Profesor: módulo 1
  };
  const [isEditing, setIsEditing] = useState(false);
  const [guardarTodoFn, setGuardarTodoFn] = useState(null);
  const handleEnableEdit = () => {

    setIsEditing(true);
  }

  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>

      <Layout modules={modules} onNavigate={handleSidebarNavigation} activeModule={getActiveModule()}>
        <div className="content-container">
          <Container className="mt-4">
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
                <div>
                  {soloLectura && (
                    <button
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-3"
                      style={{ maxWidth: "120px" }}
                      onClick={() => {
                        const idPeriodo = datosModulo?.idPeriodo || (location.state && location.state.idPeriodo);
                        if (idPeriodo) navigate(`/secretaria/periodo/materias/${idPeriodo}`);
                        else navigate(-1);
                      }}
                      title="Volver"
                    >
                      <i className="bi bi-arrow-left-circle-fill"></i> Regresar
                    </button>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  {/* Botón Habilitar edición */}
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={handleEnableEdit}
                    title="Habilitar edición"

                  >
                    <i className="bi bi-pencil-fill"></i>
                  </button>

                  {/* Botón Guardar */}
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      console.log("🟢 Click en guardar");
                      console.log("📦 guardarTodoFn:", guardarTodoFn);

                      if (!guardarTodoFn) {
                        console.warn("❌ guardarTodoFn es NULL");
                        return;
                      }

                      guardarTodoFn();
                    }}
                    title="Guardar cambios"
                    disabled={!isEditing}
                  >
                    <i className="bi bi-save-fill"></i>
                  </button>

                  {/* Botón Exportar PDF */}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleExportPDF}
                    title="Exportar a PDF"
                  >
                    <i className="bi bi-file-earmark-pdf-fill"></i>
                  </button>


                </div>
              </div>

              <div className="text-center mb-0">
                <h2 className="mb-0">Gestión de Calificaciones</h2>
              </div>

            </div>
            {/* TABS PRINCIPALES */}
            <Tabs activeKey={activeMainTab} id="calificaciones-tabs" className="mb-3" fill onSelect={(k) => setActiveMainTab(k)}>
              {/* QUIMESTRE 1 */}
              <Tab eventKey="quimestre1" title="Quimestre 1">
                <Tabs activeKey={activeSubTabQuim1} className="mb-3" fill onSelect={(k) => setActiveSubTabQuim1(k)}>
                  <Tab eventKey="parcial1-quim1" title="Parcial 1 - Quim 1">
                    <Parcial
                      globalEdit={isEditing}
                      key="parcial1-quim1"
                      quimestreSeleccionado="1"
                      parcialSeleccionado="1"
                      actualizarDatosParcial={handleActualizarParcial1Quim1}
                      datosModulo={datosModulo}
                      activo={activeMainTab === "quimestre1" && activeSubTabQuim1 === "parcial1-quim1"}
                      inputsDisabled={inputsDisabled}
                      onEditar={handleEditarFila}
                      isWithinRange={getRangoValido("parcial1-quim1")}
                      rangoTexto={textoRangoFechas["parcial1-quim1"]}
                      forceEdit={forceEdit}
                      soloLectura={soloLectura}
                      esPorSolicitud={esPorSolicitud("parcial1-quim1")}
                      savedKeys={savedKeys}
                      makeKey={makeKey}
                      agregarSavedKey={agregarSavedKey}
                      editingRow={editingRow}
                      setEditingRow={setEditingRow}
                      onGuardarTodo={(fn) => setGuardarTodoFn(() => fn)}
                      onGuardarTodoFinished={() => setIsEditing(false)}
                    />
                  </Tab>

                  <Tab eventKey="parcial2-quim1" title="Parcial 2 - Quim 1">
                    <Parcial
                      globalEdit={isEditing}
                      key="parcial2-quim1"
                      quimestreSeleccionado="1"
                      parcialSeleccionado="2"
                      actualizarDatosParcial={handleActualizarParcial2Quim1}
                      datosModulo={datosModulo}
                      activo={activeMainTab === "quimestre1" && activeSubTabQuim1 === "parcial2-quim1"}
                      inputsDisabled={inputsDisabled}
                      onEditar={handleEditarFila}
                      isWithinRange={getRangoValido("parcial2-quim1")}
                      rangoTexto={textoRangoFechas["parcial2-quim1"]}
                      forceEdit={forceEdit}
                      soloLectura={soloLectura}
                      esPorSolicitud={esPorSolicitud("parcial2-quim1")}
                      savedKeys={savedKeys}
                      makeKey={makeKey}
                      agregarSavedKey={agregarSavedKey}
                      editingRow={editingRow}
                      setEditingRow={setEditingRow}
                      onGuardarTodo={(fn) => setGuardarTodoFn(() => fn)}
                      onGuardarTodoFinished={() => setIsEditing(false)}
                    />
                  </Tab>

                  <Tab eventKey="quimestral-quim1" title="Quimestre 1">
                    <Quimestral
                      globalEdit={isEditing}
                      key="quimestral-quim1"
                      quimestreSeleccionado="1"
                      activo={activeMainTab === "quimestre1" && activeSubTabQuim1 === "quimestral-quim1"}
                      parcial1Data={parcial1Quim1Data}
                      parcial2Data={parcial2Quim1Data}
                      actualizarDatosQuim={handleActualizarQuim1}
                      datosModulo={datosModulo}
                      inputsDisabled={inputsDisabled}
                      onEditar={handleEditarFila}
                      isWithinRange={getRangoValido("quimestral-quim1")}
                      rangoTexto={textoRangoFechas["quimestral-quim1"]}
                      forceEdit={forceEdit}
                      soloLectura={soloLectura}
                      esPorSolicitud={esPorSolicitud("quimestral-quim1")}
                      savedKeysQuim={savedKeysQuim}
                      makeKeyQuim={makeKeyQuim}
                      agregarSavedKeyQuim={agregarSavedKeyQuim}
                      editingRow={editingRow}
                      setEditingRow={setEditingRow}
                      onGuardarTodo={(fn) => setGuardarTodoFn(() => fn)}
                      onGuardarTodoFinished={() => setIsEditing(false)}
                    />
                  </Tab>
                </Tabs>
              </Tab>

              {/* QUIMESTRE 2 */}
              <Tab eventKey="quimestre2" title="Quimestre 2">
                <Tabs activeKey={activeSubTabQuim2} className="mb-3" fill onSelect={(k) => setActiveSubTabQuim2(k)}>
                  <Tab eventKey="parcial1-quim2" title="Parcial 1 - Quim 2">
                    <Parcial
                      globalEdit={isEditing}
                      key="parcial1-quim2"
                      quimestreSeleccionado="2"
                      parcialSeleccionado="1"
                      actualizarDatosParcial={handleActualizarParcial1Quim2}
                      datosModulo={datosModulo}
                      activo={activeMainTab === "quimestre2" && activeSubTabQuim2 === "parcial1-quim2"}
                      inputsDisabled={inputsDisabled}
                      onEditar={handleEditarFila}
                      isWithinRange={getRangoValido("parcial1-quim2")}
                      rangoTexto={textoRangoFechas["parcial1-quim2"]}
                      forceEdit={forceEdit}
                      soloLectura={soloLectura}
                      esPorSolicitud={esPorSolicitud("parcial1-quim2")}
                      savedKeys={savedKeys}
                      makeKey={makeKey}
                      agregarSavedKey={agregarSavedKey}
                      editingRow={editingRow}
                      setEditingRow={setEditingRow}
                      onGuardarTodo={(fn) => setGuardarTodoFn(() => fn)}
                      onGuardarTodoFinished={() => setIsEditing(false)}
                    />
                  </Tab>

                  <Tab eventKey="parcial2-quim2" title="Parcial 2 - Quim 2">
                    <Parcial
                      globalEdit={isEditing}
                      key="parcial2-quim2"
                      quimestreSeleccionado="2"
                      parcialSeleccionado="2"
                      actualizarDatosParcial={handleActualizarParcial2Quim2}
                      datosModulo={datosModulo}
                      activo={activeMainTab === "quimestre2" && activeSubTabQuim2 === "parcial2-quim2"}
                      inputsDisabled={inputsDisabled}
                      onEditar={handleEditarFila}
                      isWithinRange={getRangoValido("parcial2-quim2")}
                      rangoTexto={textoRangoFechas["parcial2-quim2"]}
                      forceEdit={forceEdit}
                      soloLectura={soloLectura}
                      esPorSolicitud={esPorSolicitud("parcial2-quim2")}
                      savedKeys={savedKeys}
                      makeKey={makeKey}
                      agregarSavedKey={agregarSavedKey}
                      editingRow={editingRow}
                      setEditingRow={setEditingRow}
                      onGuardarTodo={(fn) => setGuardarTodoFn(() => fn)}
                      onGuardarTodoFinished={() => setIsEditing(false)}
                    />
                  </Tab>

                  <Tab eventKey="quimestral-quim2" title="Quimestre 2">
                    <Quimestral
                    activo={activeMainTab === "quimestre2" && activeSubTabQuim2 === "quimestral-quim2"}
                      globalEdit={isEditing}
                      key="quimestral-quim2"
                      quimestreSeleccionado="2"
                      parcial1Data={parcial1Quim2Data}
                      parcial2Data={parcial2Quim2Data}
                      actualizarDatosQuim={handleActualizarQuim2}
                      datosModulo={datosModulo}
                      inputsDisabled={inputsDisabled}
                      onEditar={handleEditarFila}
                      isWithinRange={getRangoValido("quimestral-quim2")}
                      rangoTexto={textoRangoFechas["quimestral-quim2"]}
                      forceEdit={forceEdit}
                      soloLectura={soloLectura}
                      esPorSolicitud={esPorSolicitud("quimestral-quim2")}
                      savedKeysQuim={savedKeysQuim}
                      makeKeyQuim={makeKeyQuim}
                      agregarSavedKeyQuim={agregarSavedKeyQuim}
                      editingRow={editingRow}
                      setEditingRow={setEditingRow}
                      onGuardarTodo={(fn) => setGuardarTodoFn(() => fn)}
                      onGuardarTodoFinished={() => setIsEditing(false)}
                    />
                  </Tab>
                </Tabs>
              </Tab>

              {/* NOTA FINAL */}
              <Tab eventKey="notaFinal" title="Nota Final">
                <div className="tab-pane active">
                  <Final
                    globalEdit={isEditing}
                    key="notaFinal"
                    activo={activeMainTab === "notaFinal"}
                    quim1Data={quim1Data}
                    quim2Data={quim2Data}
                    datosModulo={datosModulo}
                    actualizarDatosFinal={handleActualizarFinal}
                    inputsDisabled={inputsDisabled}
                    onEditar={handleEditarFila}
                    isWithinRange={getRangoValido("notaFinal")}
                    rangoTexto={textoRangoFechas["notaFinal"]}
                    forceEdit={forceEdit}
                    soloLectura={soloLectura}
                    esPorSolicitud={esPorSolicitud("notaFinal")}
                    savedKeysFinal={savedKeysFinal}
                    makeKeyFinal={makeKeyFinal}
                    agregarSavedKeyFinal={agregarSavedKeyFinal}
                    editingRow={editingRow}
                    setEditingRow={setEditingRow}
                    onGuardarTodo={(fn) => setGuardarTodoFn(() => fn)}
                    onGuardarTodoFinished={() => setIsEditing(false)}
                  />
                </div>
              </Tab>
            </Tabs>
          </Container>
        </div>
      </Layout>
    </>
  );
}

export default Notas;