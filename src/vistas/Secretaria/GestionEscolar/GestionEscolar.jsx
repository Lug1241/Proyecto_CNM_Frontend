import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Modulo from "../../../components/Modulo";
import Loading from "../../../components/Loading";
import { NotebookTabs } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { getModulos, transformModulesForLayout } from "../../getModulos";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import { useAuth } from "../../../Utils/useAuth";

function GestionEscolar() {
  const navigate = useNavigate();
  const auth = useAuth("Secretaria")
  const authRole = auth.usuario?.subRol || auth.usuario?.rol;
  const [usuario, setUsuario] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    if (!auth.isAuthenticated || authRole !== "Secretaria") {
      return;
    }

    const storedUser = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUsuario(parsedUser);

    const modulosBase = getModulos(parsedUser.subRol, true);
    setModules(transformModulesForLayout(modulosBase));

    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_URL_DEL_BACKEND}/periodo_academico/obtener`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      .then((response) => {
        setPeriodos(response.data.data);
      })
      .catch((error) => {
        ErrorMessage(error);
        Swal.fire("Error", "Ocurrió un error al obtener los periodos académicos.", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, auth.isAuthenticated, authRole]);

  const handleModuloClick = (modulo) => {
    navigate(`/secretaria/periodo/materias/${modulo.id}`, { state: modulo });
  };

  const handleSidebarNavigation = (path) => {
    setLoading(true);
    setTimeout(() => navigate(path), 800);
  };

  const icono = <NotebookTabs size={40} />;
  const modulosData = [...periodos]
  .sort((a, b) => {
    const añoA = parseInt(a.descripcion.split("-")[0]);
    const añoB = parseInt(b.descripcion.split("-")[0]);
    return añoA - añoB;
  })
  .map((periodo) => ({
    id: periodo.ID,
    // aquí incluimos el icono HTML directamente
    titulo: (
      <>
        <i className="bi bi-calendar-event-fill me-2"></i>Periodo: {periodo.descripcion}
      </>
    ),
    descripcion: `Estado: ${periodo.estado}`,
    link: `/secretaria/periodo/materias/${periodo.ID}`,
    icono: icono, // sigue usando el ícono grande que tienes al centro
  }));

  if (!auth.isAuthenticated || authRole !== "Secretaria") {
    return null;
  }

  if (loading) return <Loading />;

  return (
    <>
      <div className="container-fluid p-0">
        {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      </div>
      <Layout modules={modules} onNavigate={handleSidebarNavigation}>
        <div className="content-container">
          <h2 className="mb-4">Gestión Escolar - Periodos Académicos</h2>
          <Modulo modulos={modulosData} />
        </div>
      </Layout>
    </>
  );
}

export default GestionEscolar;
