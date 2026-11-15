
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Visitante from './pages/Visitante'
import Login from './pages/Login'
import Painel from './pages/Painel'
import Morador from './pages/Morador'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas */}
        <Route path="/" element={<Home />} />

        <Route
          path="/visitante/:codigo"
          element={<Visitante />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Painel administrativo: MASTER e SINDICO */}
        <Route
          element={
            <ProtectedRoute
              perfisPermitidos={['MASTER', 'SINDICO']}
            />
          }
        >
          <Route
            path="/painel"
            element={<Painel />}
          />
        </Route>

        {/* Painel pessoal: MORADOR */}
        <Route
          element={
            <ProtectedRoute
              perfisPermitidos={['MORADOR']}
            />
          }
        >
          <Route
            path="/morador"
            element={<Morador />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
