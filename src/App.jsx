import './App.css'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'

function App() {
  return (
    <div className='App'>
        <Routes>
          <Route element={<Home />} path='/'/>
        </Routes>
    </div>
  )
}

export default App
