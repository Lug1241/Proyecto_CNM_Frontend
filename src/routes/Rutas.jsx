import React from 'react'
import Login from '../vistas/Login/Login.jsx';
import { Routes, Route } from 'react-router-dom';
import Inicio from '../vistas/Inicio.jsx';
import Periodos_Academicos from '../vistas/Admin/Modules/Configuration/PeriodosAcedémicos/Index.jsx'
import Calificaciones from '../vistas/Docente/Calificaciones.jsx';
import Asignaguras from "../vistas/Admin/Modules/Configuration/Asignaturas/Index.jsx"
import Docentes from "../vistas/Admin/Modules/Configuration/Docentes/Index.jsx"
import Representante from '../vistas/Representante/index.jsx'
import Estudiantes from '../vistas/Admin/Modules/Estudiantil/Estudiantes/Index.jsx'
import PanelCursos from '../vistas/Docente/PanelCursos.jsx';
import ListaEstudiantes from '../vistas/Representante/modulos/listaEstudiantes.jsx';
import VerDatosRepresentante from '../vistas/Representante/modulos/VerDatosRepresentante.jsx';
import VerDatosEstudiante from '../vistas/Representante/modulos/VerDatosEstudiante.jsx';
import Cursos from '../vistas/Admin/Modules/Configuration/Cursos/Index.jsx'
import Matriculacion from '../vistas/Admin/Modules/Matriculacion/Index.jsx';
import Horarios from '../vistas/Admin/Modules/Matriculacion/Horario.jsx'
import Inscripcion from '../vistas/Admin/Modules/Estudiantil/Registro/Index.jsx'
import Representantes from '../vistas/Admin/Modules/Estudiantil/Representantes/Index.jsx'
import AgregarFechas from '../vistas/Vicerrector/FechasNotas/AgregarFechas.jsx';
import ChangePassword_Representante from '../vistas/Representante/modulos/ChangePassword/Index.jsx';
import ChangePassword_Admin from '../vistas/Admin/Modules/ChangePassword/Index.jsx';
import GestionEscolar from '../vistas/Secretaria/GestionEscolar/GestionEscolar.jsx';
import MateriasPorPeriodo from '../vistas/Secretaria/GestionEscolar/MateriasPorPeriodo.jsx';
import ListadoCursos from '../vistas/Secretaria/GestionEscolar/ListadoCursos.jsx';
import BuscarMaterias from '../vistas/Admin/Modules/Matriculacion/BuscarMaterias/Index.jsx';
import ChangePassword_Profesor from '../vistas/Docente/ChangePassword/Index.jsx';
import ChangePassword_Secretaria from '../vistas/Secretaria/ChangePassword/Index.jsx';
import ChangePassword_Vicerrector from '../vistas/Vicerrector/ChangePassword/Index.jsx';
import InscripcionRepresentante from '../../src/vistas/Representante/modulos/Matriculacion/Index.jsx'
import Solicitudes from '../vistas/Vicerrector/AgendaSolicitudes/Index.jsx'
import SolicitudesDocente from '../vistas/Docente/Solicitudes/Index.jsx';
import Distributivo from '../vistas/Vicerrector/Distributivo/Index.jsx'
import InformacionEstudiantil from '../vistas/Secretaria/InformacionEstudiantil/InformacionEstudiantil.jsx';
import FechasProcesos from '../vistas/Secretaria/FechasProcesos/FechasProcesos.jsx';
import VerificarCorreo from '../vistas/Recover-Password/VerificarCorreo/Index.jsx';
import ResetPassword from '../vistas/Recover-Password/ResetPassword/Index.jsx';
import VerCalificacionesEstudiante from '../vistas/Representante/modulos/VerCalificacionesEstudiante.jsx';
import MatriculaIndividual from '../vistas/Docente/Matriculacion/Index.jsx';
import MateriasIndividuales from '../vistas/Docente/MateriasIndividuales/Index.jsx'
import DistributivoIndividual from '../vistas/Admin/Modules/Matriculacion/MateriasIndividuales/Index.jsx'
import InscripcionesIndividuales from '../vistas/Docente/Matriculacion/Inscripciones/Index.jsx';
import CursosVacios from '../vistas/Admin/Modules/Configuration/CursosSinMatricula/Index.jsx'
import Reportes from '../vistas/Secretaria/Reportes/Reportes.jsx';
import ListadoEstudiantes from '../vistas/Secretaria/Reportes/ListadoEstudiantes.jsx';
import ReporteEstudiante from '../vistas/Secretaria/Reportes/ReporteEstudiante.jsx';
import ReporteGeneral from '../vistas/Secretaria/Reportes/ReporteGeneral.jsx';
//import InformacionEstudiantes from '../vistas/Secretaria/InformacionEstudiantil/Estudiantes/Index.jsx';
import RutaProtegida from '../vistas/Login/RutaProtegida.jsx';
import NotasPendientes from '../vistas/Vicerrector/NotasPendientes/Index.jsx';
import DocentesInspector from '../vistas/Inspector/Docentes/Index.jsx';

function Rutas() {
  return (
    <Routes>
      {/* 🚪 Rutas públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/request-recover-password" element={<VerificarCorreo />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* 🔒 Rutas protegidas (requieren login y respetan debeCambiarPassword) */}
      <Route element={<RutaProtegida />}>
        <Route path="/inicio" element={<Inicio />} />

        {/* ADMINISTRADOR */}
        <Route path="/admin/periodos" element={<Periodos_Academicos />} />
        <Route path="/admin/asignaturas" element={<Asignaguras />} />
        <Route path="/admin/docentes" element={<Docentes />} />
        <Route path="/admin/estudiantes" element={<Estudiantes />} />
        <Route path="/admin/cursos" element={<Cursos />} />
        <Route path="/admin/matriculacion" element={<Matriculacion />} />
        <Route path="/admin/horarios" element={<Horarios />} />
        <Route path="/admin/inscripcion" element={<Inscripcion />} />
        <Route path="/admin/representantes" element={<Representantes />} />
        <Route path="/admin/password" element={<ChangePassword_Admin />} />
        <Route path="/admin/buscar_materias" element={<BuscarMaterias />} />
        <Route path="/admin/asignacionesIndividuales" element={<DistributivoIndividual />} />
        <Route path="/admin/cursos_vacios" element={<CursosVacios />} />
        <Route path="/admin/panelcursos/calificaciones" element={<Calificaciones />} />
        <Route path="/admin/panelcursos" element={<PanelCursos />} />

        {/* DOCENTE - Profesor */}
        <Route path="/profesor/panelcursos/calificaciones" element={<Calificaciones />} />
        <Route path="/profesor/panelcursos" element={<PanelCursos />} />
        <Route path="/profesor/password" element={<ChangePassword_Profesor />} />
        <Route path="/profesor/solicitudes" element={<SolicitudesDocente />} />
        <Route path="/profesor/matricula" element={<MatriculaIndividual />} />
        <Route path="/profesor/materias" element={<MateriasIndividuales />} />
        <Route path="/profesor/inscripciones" element={<InscripcionesIndividuales />} />

        {/* REPRESENTANTE */}
        <Route path="/representante" element={<Representante />} />
        <Route path="/representante/estudiantes" element={<ListaEstudiantes />} />
        <Route path="/representante/perfil" element={<VerDatosRepresentante />} />
        <Route path="/representante/password" element={<ChangePassword_Representante />} />
        <Route path="/estudiante/perfil" element={<VerDatosEstudiante />} />
        <Route path="/representante/inscripcion" element={<InscripcionRepresentante />} />
        <Route path="/representante/calificaciones" element={<VerCalificacionesEstudiante />} />

        {/* VICERRECTOR */}
        <Route path="/vicerrector/reportes" element={<AgregarFechas />} />
        <Route path="/vicerrector/password" element={<ChangePassword_Vicerrector />} />
        <Route path="/vicerrector/distributivo" element={<Distributivo />} />
        <Route path="/vicerrector/solicitudes" element={<Solicitudes />} />
        <Route path="/vicerrector/panelcursos/calificaciones" element={<Calificaciones />} />
        <Route path="/vicerrector/panelcursos" element={<PanelCursos />} />
        <Route path="/vicerrector/notas-pendientes" element={<NotasPendientes />} />

        {/* SECRETARIA */}
        <Route path="/secretaria/administracion-escolar" element={<GestionEscolar />} />
        <Route path="/secretaria/periodo/materias/:idPeriodo" element={<MateriasPorPeriodo />} />
        <Route path="/secretaria/periodo/materias/estudiantes/:id_asignacion" element={<ListadoCursos />} />
        <Route path="/secretaria/calificaciones/asignacion/:asigId" element={<Calificaciones />} />
        <Route path="/secretaria/password" element={<ChangePassword_Secretaria />} />
        <Route path="/secretaria/informacion" element={<InformacionEstudiantil />} />
        <Route path="/secretaria/informacion/representantes" element={<Representantes />} />
        <Route path="/secretaria/informacion/estudiantes" element={<Estudiantes />} />
        <Route path="/secretaria/informacion/inscripcion" element={<Inscripcion />} />
        <Route path="/secretaria/procesos" element={<FechasProcesos />} />
        <Route path="/secretaria/matriculacion" element={<Matriculacion />} />
        <Route path="/secretaria/horarios" element={<Horarios />} />
        <Route path="/secretaria/buscar_materias" element={<BuscarMaterias />} />
        <Route path="/secretaria/asignacionesIndividuales" element={<DistributivoIndividual />} />
        <Route path="/secretaria/reportes" element={<Reportes />} />
        <Route path="/secretaria/reportes/nivel/:nivel" element={<ListadoEstudiantes />} />
        <Route path="/secretaria/reportes/estudiante/:idEstudiante" element={<ReporteEstudiante />} />
        <Route path="/secretaria/reportes/resumen/:nivel" element={<ReporteGeneral />} />

        {/* INSPECTOR */}
        <Route path="/inspector/docentes" element={<DocentesInspector />} />
      </Route>
    </Routes>
  )
}

export default Rutas;