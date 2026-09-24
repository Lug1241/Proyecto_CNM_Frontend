import { Home, User, Users, Key, BookOpen } from "lucide-react";
import { RiLockPasswordFill } from "react-icons/ri";

// Módulos del representante
export const modulosRepresentante = [
  {
    name: "Inicio",
    icon: "🏠",
    path: "/representante"
  },
  {
    name: "Mi información",
    icon: "👤",
    path: "/representante/perfil"
  },
  {
    name: "Mis estudiantes",
    icon: "🧑‍🤝‍🧑",
    path: "/representante/estudiantes"
  },
  {
    name: "Matriculación",
    icon: "📝",
    path: "/representante/inscripcion"
  },
  {
    name: "Cambiar contraseña",
    icon: "🔐",
    path: "/representante/password"
  }
];

export default modulosRepresentante;
