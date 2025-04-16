import './App.css'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import MemeMyFace from './pages/MemeMyFace'

function App() {
  return (
    <div className='App'>
        <Routes>
          <Route element={<Home />} path='/'/>
          <Route element={<MemeMyFace />} path='/mememyface'/>
        </Routes>
    </div>
  )
}

export default App
