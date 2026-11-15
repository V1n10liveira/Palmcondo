
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Visitante from './pages/Visitante'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/visitante/:codigo"
          element={<Visitante />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/painel"
            element={<div>Painel em construção.</div>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
