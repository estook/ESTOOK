import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Cimientos } from '@/paginas/Cimientos'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/cimientos" element={<Cimientos />} />
        <Route path="*" element={<Navigate to="/cimientos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
