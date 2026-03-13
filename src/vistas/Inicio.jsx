// Inicio.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Modulo from "../components/Modulo"; // O el componente que uses para mostrar los módulos
import { getModulos } from "./getModulos";
import { useAuth } from "../Utils/useAuth";
import BannerNotas from "../components/BannerNotas";

const Inicio = () => {
  // Protección de ruta - sin rol específico porque es para todos los usuarios autenticados
  const auth = useAuth();
  
  // Si no está autenticado, no renderizar nada
  if (!auth.isAuthenticated) {
    return null;
  }

  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [modulos, setModulos] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      if (!["Profesor", "Vicerrector", "Secretaria","Administrador"].includes(parsedUser.subRol)) {
        navigate("/");
        return;
      }
      setUsuario(parsedUser);
      // No incluimos "Inicio" porque ya estamos en la vista Inicio
      setModulos(getModulos(parsedUser.subRol, false));
    }
  }, [navigate]);

  const handleModuloClick = (modulo) => {
    // Ejemplo de navegación
    navigate(modulo.link);
  };

 

  return (
    <div>
      {usuario && <Header isAuthenticated={true} usuario={usuario} />}
      {['Profesor', 'Vicerrector', 'Administrador'].includes(usuario?.subRol) && <BannerNotas />}
      <h2 style={{ textAlign: "left", marginLeft: "20px" }}>Módulos</h2>
      <Modulo modulos={modulos} onModuloClick={handleModuloClick} />
    </div>
  );
};

export default Inicio;
