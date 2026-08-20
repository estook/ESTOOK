import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProveedorSesion } from '@/app/sesion'
import { Landing } from '@/paginas/Landing'
import { Entrar } from '@/paginas/Entrar'
import { Panel } from '@/paginas/Panel'
import { Cimientos } from '@/paginas/Cimientos'

export function App() {
  return (
    <ProveedorSesion>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/app" element={<Panel />} />
          <Route path="/diagnostico" element={<Cimientos />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProveedorSesion>
  )
}
