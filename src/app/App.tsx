import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProveedorSesion } from '@/app/sesion'
import { Marco } from '@/app/Marco'
import { Landing } from '@/paginas/Landing'
import { Entrar } from '@/paginas/Entrar'
import { Cimientos } from '@/paginas/Cimientos'
import { Admin } from '@/paginas/Admin'
import { PanelInicio } from '@/paginas/apps/PanelInicio'
import { Inventario } from '@/paginas/apps/Despensa'
import { Ajustes, Chat, Competencia, Equipo, Negocio, Resenas } from '@/paginas/apps/Otras'
import { Servicio } from '@/paginas/apps/Servicio'
import { Cocina } from '@/paginas/apps/Cocina'

export function App() {
  return (
    <ProveedorSesion>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/app" element={<Marco />}>
            <Route index element={<PanelInicio />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="cocina" element={<Cocina />} />
            <Route path="servicio" element={<Servicio />} />
            <Route path="equipo" element={<Equipo />} />
            <Route path="negocio" element={<Negocio />} />
            <Route path="competencia" element={<Competencia />} />
            <Route path="resenas" element={<Resenas />} />
            <Route path="chat" element={<Chat />} />
            <Route path="ajustes" element={<Ajustes />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
          <Route path="/diagnostico" element={<Cimientos />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProveedorSesion>
  )
}
