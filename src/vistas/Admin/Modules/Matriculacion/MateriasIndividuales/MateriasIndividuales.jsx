import { useState, useEffect } from 'react'
import axios from 'axios'
import TablaInscripciones from './TablaInscripciones'
import { ErrorMessage } from '../../../../../Utils/ErrorMesaje'
import Paginación from '../../../Components/Paginación'
import Loading from '../../../../../components/Loading'
import Swal from 'sweetalert2'

function MateriasIndividuales() {
    const [periodo, setPeriodo] = useState("")
    const [periodos, setPeriodos] = useState([])
    const [loading, setLoading] = useState(false)
    const [nivel, setNivel] = useState("")
    const [inscripciones, setInscripciones] = useState([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState("")
    const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
    const token = localStorage.getItem("token")
    const [search, setSearch] = useState('')
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
        axios.get(`${API_URL}/periodo_academico/obtener`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                setPeriodos(res.data.data)
            })
            .catch(err => {
                ErrorMessage(err)
            })
    }, [])
    useEffect(() => {
        if (periodo && nivel) {

            axios.get(`${API_URL}/inscripcion/obtener/nivel/${periodo}/${nivel}?page=${page}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(res => {
                    setInscripciones(res.data.data);
                    console.log("esto llego de base", res)
                    setTotalPages(res.data.totalPages);
                    setLoading(false)
                })
                .catch(err => {
                    ErrorMessage(err)
                })
        }

    }, [periodo, nivel, page, limit])

    const filteredData = Array.isArray(inscripciones)

        ? inscripciones.filter((item) => {

            const value = item?.Asignacion?.Docente?.primer_nombre;
            return typeof value === "string"
                ? value.toLowerCase().includes(search.toLowerCase())
                : false;
        })
        : [];
    const handleDelete = (inscripcion) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `También se quitara la inscripción del horario`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Primero eliminar la inscripción
                axios.delete(`${API_URL}/inscripcion/eliminar/${inscripcion.ID}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then(() => {
                    // Si удачно, eliminar la asignación
                    return axios.delete(`${API_URL}/asignacion/eliminar/${inscripcion.Asignacion.ID}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                })
                .then(() => {
                    // Actualizar el estado local
                    setInscripciones((prevData) =>
                        prevData.filter((d) => d.ID !== inscripcion.ID)
                    );
                    
                    Swal.fire({
                        icon: "success",
                        title: "Eliminado!",
                        text: `La inscripción ha sido eliminada.`,
                        iconColor: "#218838",
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#003F89",
                    });
                })
                .catch((error) => {
                    ErrorMessage(error)
                });
            }
        });

    }
    return (
        <div className='Contenedor-general'>
            {!periodo && (
                <label className="label-error">
                    *Se requiere un periodo
                </label>
            )}
            <div className='filtros'>

                <div className='form-group'>

                    <select
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="input-field"
                    >
                        <option value="">Seleccione un periodo</option>
                        {periodos.map((periodo) => (
                            <option key={periodo.ID} value={periodo.ID}>
                                {periodo.descripcion}
                            </option>
                        ))}
                    </select>


                </div>
                <div className='form-group'>
                    <select
                        onChange={(e) => setNivel(e.target.value)}
                        className="input-field"
                    >
                        <option value="">Selecciona un nivel</option>
                        <option value="1ro BE">1ro BE</option>
                        <option value="2do BE">2do BE</option>
                        <option value="1ro BM">1ro BM</option>
                        <option value="2do BM">2do BM</option>
                        <option value="3ro BM">3ro BM</option>
                        <option value="1ro BS">1ro BS</option>
                        <option value="2do BS">2do BS</option>
                        <option value="3ro BS">3ro BS</option>
                        <option value="1ro BCH">1ro BCH</option>
                        <option value="2do BCH">2do BCH</option>
                        <option value="3ro BCH">3ro BCH</option>
                        <option value="BCH">BCH</option>
                        <option value="BM">BM</option>
                        <option value="BS">BS</option>
                        <option value="BS BCH">BS BCH</option>
                    </select>
                </div>
                <div className="form-group">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                        placeholder={`Nombre del docente`}
                    />

                </div>
            </div>

            {loading ? <Loading /> : <TablaInscripciones
                inscripciones={filteredData}
                OnDelete={handleDelete}
                headers={Headers}

            />
            }
            {Paginación && filteredData.length > 0 && <Paginación totalPages={totalPages} page={page} setPage={setPage} />}
        </div>
    )
}

export default MateriasIndividuales