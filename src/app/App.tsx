import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Cimientos } from '@/paginas/Cimientos'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/cimientos" element={<Cimientos />} />
        <Route path="*" element={<Navigate to="/cimientos" replace />} />
      </Routes>
    </HashRouter>
  )
}
