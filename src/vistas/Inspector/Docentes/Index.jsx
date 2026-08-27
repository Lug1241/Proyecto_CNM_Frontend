import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import Layout from '../../../layout/Layout.jsx';
import Header from '../../../components/Header.jsx';
import Loading from '../../../components/Loading.jsx';
import { getModulos, transformModulesForLayout } from '../../getModulos.jsx';
import { useAuth } from '../../../Utils/useAuth';
import { ErrorMessage } from '../../../Utils/ErrorMesaje';
import Docentes from './Docentes.jsx';

function Index() {

  const auth = useAuth("Inspector");
  
  const [usuario, setUsuario] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const navigate = useNavigate()
  

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser || parsedUser.subRol !== "Inspector") {
      navigate("/")
    }
    setUsuario(parsedUser);
    // Configurar módulos del Inspector
    setModules(transformModulesForLayout(getModulos(parsedUser.subRol, true)));
  }, [API_URL, navigate]);
  
  useEffect(() => {
    
  }, [])
  
   if (!auth.isAuthenticated) {
    return <ErrorMessage message="No tienes permisos para acceder a esta página" />;
  }
  const handleSidebarNavigation = (path) => {
    setLoading(true);
    setTimeout(() => navigate(path), 800);
  };

  return (
    <div className="section-container">
      {/* Encabezado */}
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>
      <Layout modules={modules} onNavigate={handleSidebarNavigation}>
        {loading ? <Loading /> : <Docentes  />}
      </Layout>
    </div>
  )
}

export default Index