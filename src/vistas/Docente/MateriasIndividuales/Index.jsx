import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Layout from "../../../layout/Layout";
import Materias from "./Materias";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ErrorMessage } from "../../../Utils/ErrorMesaje";
import { getModulos, transformModulesForLayout } from "../../getModulos";
import { useAuth } from "../../../Utils/useAuth";

function Index() {
    // Protección de ruta
    const auth = useAuth(["Profesor", "Administrador", "Vicerrector", "Inspector"]);
    
    

    const [usuario, setUsuario] = useState(null);
    const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
    const [periodo,setPeriodo]=useState("")
    const token = localStorage.getItem("token")
    const [inscripciones, setInscripciones] = useState([])
    const [limit, setLimit] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate()
    
    const [width, setWidth] = useState(window.innerWidth);
    // ✅ Detectar cambio de tamaño de pantalla
   
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ✅ Establecer límite de resultados según resolución
    useEffect(() => {

        const isLaptop = width <= 1822;
        setLimit(isLaptop ? 13 : 21);
    }, [width]);
    useEffect(() => {
        const storedUser = localStorage.getItem("usuario");
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser || (parsedUser.subRol !== "Profesor" && parsedUser.subRol !== "Administrador" && parsedUser.subRol !== "Vicerrector" && parsedUser.subRol !== "Inspector")) {
            navigate("/");
        } else {
            setUsuario(parsedUser);
            console.log("este es el parseUser",parsedUser)

        }
    }, [API_URL, navigate]);
    useEffect(() => {
  
      axios.get(`${API_URL}/periodo_academico/activo`, {
          headers: { Authorization: `Bearer ${token}` },
      })
          .then(response => {
              setPeriodo(response.data);
          })
          .catch(error => {
              ErrorMessage(error)

          });
  }, [API_URL, token]);
    useEffect(() => {
        if (usuario && periodo) {
          
          axios.get(`${API_URL}/inscripcion/obtener/docente/${usuario.nroCedula}/${periodo.ID}?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(res => {
            console.log("estas son las inscripciones de un docente", res);
            setInscripciones(res.data.data);
          })
          .catch(err => {
            ErrorMessage(err);
          });
        }
      }, [usuario,periodo]); 
 // Si no está autenticado, no renderizar nada
    if (!auth.isAuthenticated) {
        return null;
    }


    return (
        <div className="section-container">
            {/* Encabezado */}
            <div className="container-fluid p-0">
                {usuario && <Header isAuthenticated={true} usuario={usuario} />}
            </div>
            <Layout modules={transformModulesForLayout(getModulos("Profesor", true))}>
                {console.log("asqui va el usuario", usuario)}
                {usuario && (
                    <Materias docente={usuario} inscripciones={inscripciones} setInscripciones={setInscripciones} periodo={periodo} page={page} totalPages={totalPages} setPage={setPage}/>
                )}
            </Layout>
        </div>
    )
}

export default Index