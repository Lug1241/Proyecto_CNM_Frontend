import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './BannerNotas.css'

const ICONOS = {
  suave:      '📋',
  fuerte:     '⚠️',
  critico:    '🔴',
  bloqueante: '🚨',
}

const MENSAJES = {
  suave:      (n, d) => `Tienes ${n} ingreso(s) de notas pendiente(s). El período cierra en ${d} días.`,
  fuerte:     (n, d) => `Quedan ${d} días para el cierre. Aún tienes ${n} ingreso(s) de notas sin completar.`,
  critico:    (n, d) => `¡Atención! Solo ${d} días para el cierre del período. Tienes ${n} ingreso(s) pendiente(s).`,
  bloqueante: (n, d) => `¡Urgente! El período cierra en ${d} día(s) y tienes ${n} ingreso(s) de notas sin completar.`,
}

const BannerNotas = () => {
  const [datos, setDatos] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const API_URL = import.meta.env.VITE_URL_DEL_BACKEND || 'http://localhost:8000'

    axios
      .get(`${API_URL}/alertas/notas-faltantes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.tiene_faltantes) {
          setDatos(res.data)
        }
      })
      .catch(() => {
        // silencioso: si falla el endpoint no rompemos la vista
      })
  }, [])

  if (!datos) return null

  const { severidad, total_faltantes, dias_restantes } = datos

  return (
    <div className={`banner-notas ${severidad}`}>
      <span className="banner-notas__icon">{ICONOS[severidad]}</span>
      <span className="banner-notas__texto">
        {MENSAJES[severidad](total_faltantes, dias_restantes)}
      </span>
    </div>
  )
}

export default BannerNotas
