import { useState, useEffect } from "react";
import axios from "axios";
import TablaInscripciones from "./TablaInscripciones";
import { ErrorMessage } from "../../../../../Utils/ErrorMesaje";
import Paginación from "../../../Components/Paginación";
import Loading from "../../../../../components/Loading";
import Swal from "sweetalert2";
import Boton from "../../../../../components/Boton";
import SelectorHoraMinuto from "../../Configuration/Cursos/SelectorHoraMinuto";
import AutoCompleteInput from "../../Configuration/Cursos/AutoCompleteInput";
import { useNavigate } from "react-router-dom";
import "../../../Styles/Inscripcion.css";

function MateriasIndividuales() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("");
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nivel, setNivel] = useState("");
  const [inscripciones, setInscripciones] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState("");
  const API_URL = import.meta.env.VITE_URL_DEL_BACKEND;
  const token = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [width, setWidth] = useState(window.innerWidth);

  const [isEditing, setIsEditing] = useState(false);
  const [inscripcionEditando, setInscripcionEditando] = useState(null);
  const [editForm, setEditForm] = useState({
    docente: null,
    materia: null,
    dia1: "",
    dia2: "",
    horaInicio: "",
    horaFin: "",
    hora1: "",
    hora2: "",
  });
  const [docentes, setDocentes] = useState([]);
  const [materiasIndividuales, setMateriasIndividuales] = useState([]);
  // ✅ Detectar cambio de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Establecer límite de resultados según resolución
  useEffect(() => {
    const isLaptop = width <= 1822;
    setLimit(isLaptop ? 13 : 21);
  }, [width]);

  useEffect(() => {
    axios
      .get(`${API_URL}/periodo_academico/obtener`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPeriodos(res.data.data);
      })
      .catch((err) => {
        ErrorMessage(err);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/docente/obtener`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDocentes(res.data.data || res.data);
      })
      .catch((err) => {
        ErrorMessage(err);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/materia/individual`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMateriasIndividuales(res.data);
      })
      .catch((err) => {
        ErrorMessage(err);
      });
  }, []);
  useEffect(() => {
    if (periodo && nivel) {
      axios
        .get(
          `${API_URL}/inscripcion/obtener/nivel/${periodo}/${nivel}?page=${page}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        .then((res) => {
          setInscripciones(res.data.data);
          setTotalPages(res.data.totalPages);
          setLoading(false);
        })
        .catch((err) => {
          ErrorMessage(err);
        });
    }
  }, [periodo, nivel, page, limit]);

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
      title: "¿Estás seguro?",
      text: `También se quitara la inscripción del horario`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        // Primero eliminar la inscripción
        axios
          .delete(`${API_URL}/inscripcion/eliminar/${inscripcion.ID}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => {
            // Si удачно, eliminar la asignación
            return axios.delete(
              `${API_URL}/asignacion/eliminar/${inscripcion.Asignacion.ID}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
          })
          .then(() => {
            // Actualizar el estado local
            setInscripciones((prevData) =>
              prevData.filter((d) => d.ID !== inscripcion.ID),
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
            ErrorMessage(error);
          });
      }
    });
  };

  const handleEdit = (inscripcion) => {
    const asignacion = inscripcion.Asignacion;
    const dias = asignacion.dias || [];

    const docenteObj = docentes.find(
      (d) => d.nroCedula === asignacion.nroCedula_docente,
    );
    const materiaObj = materiasIndividuales.find(
      (m) => m.ID === asignacion.ID_materia,
    );

    setEditForm({
      docente: docenteObj || {
        nroCedula: asignacion.nroCedula_docente,
        primer_nombre: inscripcion.Asignacion.Docente?.primer_nombre,
        primer_apellido: inscripcion.Asignacion.Docente?.primer_apellido,
      },
      materia: materiaObj || asignacion.Materia,
      dia1: dias[0] || "",
      dia2: dias[1] || "",
      horaInicio: asignacion.horaInicio || "",
      horaFin: asignacion.horaFin || "",
      hora1: asignacion.hora1 || "",
      hora2: asignacion.hora2 || "",
    });
    setInscripcionEditando(inscripcion);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    try {
      if (!periodo) {
        throw new Error("No se ha seleccionado un periodo");
      }
      if (!editForm.docente) {
        throw new Error("Debe seleccionar un docente");
      }
      if (!editForm.materia) {
        throw new Error("Debe seleccionar una materia");
      }

      let dias = [];
      if (editForm.dia1 && editForm.dia2) {
        if (editForm.dia1 === editForm.dia2) {
          throw new Error("Los días deben ser diferentes");
        }
        dias = [editForm.dia1, editForm.dia2];
      } else if (editForm.dia1) {
        dias = [editForm.dia1];
      } else if (editForm.dia2) {
        dias = [editForm.dia2];
      }

      const dataUpdate = {
        horaInicio: editForm.horaInicio,
        horaFin: editForm.horaFin,
        hora1: editForm.hora1 || null,
        hora2: editForm.hora2 || null,
        dias: dias,
        nroCedula_docente: editForm.docente.nroCedula,
        ID_materia: editForm.materia.ID,
        ID_periodo_academico: Number(periodo),
      };

      await axios.put(
        `${API_URL}/asignacion/editar/${inscripcionEditando.Asignacion.ID}`,
        dataUpdate,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setInscripciones((prevData) =>
        prevData.map((item) => {
          if (item.ID === inscripcionEditando.ID) {
            return {
              ...item,
              Asignacion: {
                ...item.Asignacion,
                ...dataUpdate,
                Materia: editForm.materia,
                Docente: editForm.docente,
              },
            };
          }
          return item;
        }),
      );

      setIsEditing(false);
      setInscripcionEditando(null);

      Swal.fire({
        icon: "success",
        title: "Actualizado!",
        text: `La inscripción ha sido actualizada.`,
        iconColor: "#218838",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#003F89",
      });
    } catch (error) {
      ErrorMessage(error);
    }
  };

  return (
    <div className="Contenedor-general">
        
      <div className="gcd-actions-bar">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </div>

      {!periodo && (
        <label className="label-error">*Se requiere un periodo</label>
      )}
      <div className="filtros">
        <div className="form-group">
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
        <div className="form-group">
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

      {loading ? (
        <Loading />
      ) : (
        <TablaInscripciones
          inscripciones={filteredData}
          OnDelete={handleDelete}
          OnEdit={handleEdit}
        />
      )}
      {Paginación && filteredData.length > 0 && (
        <Paginación totalPages={totalPages} page={page} setPage={setPage} />
      )}

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2 className="modal-title">Editar Curso Individual</h2>
            <div className="modal-form">
              <div className="rows">
                <div className="form-group">
                  <label>
                    <strong>Estudiante:</strong>{" "}
                    {inscripcionEditando?.Matricula?.Estudiante?.primer_nombre}{" "}
                    {
                      inscripcionEditando?.Matricula?.Estudiante
                        ?.primer_apellido
                    }
                  </label>
                </div>
              </div>
              <div className="rows">
                <div className="form-group">
                  <label htmlFor="editDocente">Docente:</label>
                  <AutoCompleteInput
                    inputValue={editForm.docente}
                    setInputValue={(val) =>
                      setEditForm({ ...editForm, docente: val })
                    }
                    opciones={docentes}
                    key1="primer_nombre"
                    key2="primer_apellido"
                    placeholder="Seleccione docente"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editMateria">Materia:</label>
                  <AutoCompleteInput
                    inputValue={editForm.materia}
                    setInputValue={(val) =>
                      setEditForm({ ...editForm, materia: val })
                    }
                    opciones={materiasIndividuales}
                    key1="nombre"
                    key2="nivel"
                    placeholder="Seleccione materia"
                  />
                </div>
              </div>
              <div className="rows">
                <div className="form-group">
                  <label htmlFor="editDia1">Día 1:</label>
                  <select
                    id="editDia1"
                    value={editForm.dia1}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dia1: e.target.value })
                    }
                  >
                    <option value="">Selecciona un día</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Horario inicio:</label>
                  <SelectorHoraMinuto
                    value={editForm.horaInicio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, horaInicio: e.target.value })
                    }
                    min="07:00"
                    max="19:00"
                  />
                </div>
                <div className="form-group">
                  <label>Horario fin:</label>
                  <SelectorHoraMinuto
                    value={editForm.horaFin}
                    onChange={(e) =>
                      setEditForm({ ...editForm, horaFin: e.target.value })
                    }
                    min="07:00"
                    max="19:00"
                  />
                </div>
              </div>
              <div className="rows">
                <div className="form-group">
                  <label htmlFor="editDia2">Día 2:</label>
                  <select
                    id="editDia2"
                    value={editForm.dia2}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dia2: e.target.value })
                    }
                  >
                    <option value="">Selecciona un día</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Horario inicio:</label>
                  <SelectorHoraMinuto
                    value={editForm.hora1}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hora1: e.target.value })
                    }
                    min="07:00"
                    max="19:00"
                  />
                </div>
                <div className="form-group">
                  <label>Horario fin:</label>
                  <SelectorHoraMinuto
                    value={editForm.hora2}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hora2: e.target.value })
                    }
                    min="07:00"
                    max="19:00"
                  />
                </div>
              </div>
            </div>
            <div className="botones">
              <Boton
                texto="Guardar"
                onClick={handleUpdate}
                estilo="boton-crear"
              />
              <Boton
                texto="Cancelar"
                onClick={() => setIsEditing(false)}
                estilo="boton-cancelar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MateriasIndividuales;
