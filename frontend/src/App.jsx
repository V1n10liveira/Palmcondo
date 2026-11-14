
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Visitante from './pages/Visitante'
import Login from './pages/Login'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
