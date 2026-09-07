import React, { useState, useEffect } from "react";
import Header from "../../../../../components/Header";
import Layout from '../../../../../layout/Layout'
import BuscarTutor from "./BuscarTutor";
import { moduloInicio, modulesEstudiantesBase, construirModulosConPrefijo } from "../../../Components/Modulos"
import { useNavigate } from "react-router-dom";

function Index() {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const [modulos, setModulos] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser || parsedUser.subRol !== "Administrador" && parsedUser.subRol !== "Secretaria") {
      navigate("/inicio");
    }
    setUsuario(parsedUser);
    const modulosDinamicos = [
      moduloInicio,
      ...construirModulosConPrefijo(parsedUser.subRol, modulesEstudiantesBase)
    ];
    setModulos(modulosDinamicos);
  }, [API_URL, navigate]);

  return (
    <div className="section-container">
      {/* Encabezado */}
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>
      <Layout modules={modulos}>
        <BuscarTutor />

      </Layout>
    </div>
  )
}

export default Index