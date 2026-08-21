import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProveedorSesion } from '@/app/sesion'
import { Marco } from '@/app/Marco'
import { Inicio } from '@/paginas/web/Inicio'
import { Producto } from '@/paginas/web/Producto'
import { FogonWeb } from '@/paginas/web/FogonWeb'
import { Precios } from '@/paginas/web/Precios'
import { Entrar } from '@/paginas/Entrar'
import { Cimientos } from '@/paginas/Cimientos'
import { Admin } from '@/paginas/Admin'
import { PanelInicio } from '@/paginas/apps/PanelInicio'
import { Inventario } from '@/paginas/apps/Despensa'
import { Chat, Competencia, Equipo, Negocio, Resenas } from '@/paginas/apps/Otras'
import { Ajustes } from '@/paginas/apps/Ajustes'
import { Documentos } from '@/paginas/apps/Documentos'
import { Servicio } from '@/paginas/apps/Servicio'
import { Cocina } from '@/paginas/apps/Cocina'

export function App() {
  return (
    <ProveedorSesion>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/producto" element={<Producto />} />
          <Route path="/fogon" element={<FogonWeb />} />
          <Route path="/precios" element={<Precios />} />
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
            <Route path="documentos" element={<Documentos />} />
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
