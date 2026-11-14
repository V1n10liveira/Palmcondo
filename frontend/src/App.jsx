
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Visitante from './pages/Visitante'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/visitante/:codigo"
          element={<Visitante />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
