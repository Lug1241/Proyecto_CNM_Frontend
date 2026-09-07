import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Busqueda from "./Busqueda";
import { useNavigate } from "react-router-dom";
import { getModulos,transformModulesForLayout} from "../../getModulos";


function Index() {

  const [usuario, setUsuario] = useState(null);
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const navigate = useNavigate()
  const [modulos,setModulos]=useState([])
  

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const parsedUser = JSON.parse(storedUser);

    if (!parsedUser || (parsedUser.subRol !== "Profesor"&& parsedUser.subRol !== "Administrador" && parsedUser.subRol !== "Vicerrector" && parsedUser.subRol !== "Inspector")) {
      navigate("/");
    } else {
      setUsuario(parsedUser);
    setModulos(getModulos(parsedUser.subRol,true))
      
    }
  }, [API_URL, navigate]);

  return (
    <div className="section-container">
      {/* Encabezado */}
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>
      <Layout modules={transformModulesForLayout(modulos)} activeModule={3}>
        <Busqueda/>
      </Layout>
    </div>
  )
}

export default Index