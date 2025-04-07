import React from 'react'
import Sidebar from './components/sidebar/Sidebar'
import Main from './components/main/Main.jsx'
import {Route, Routes } from 'react-router-dom'
import Loader from './components/Loader.jsx'


const App = () => {
  return (
    <>
    <Loader/>
    <Routes>
      <Route path="/" element={[<Sidebar/>,<Main/>]}/>
    </Routes>
    </>
  )
}

export default App