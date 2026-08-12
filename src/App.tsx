import { useEffect, useState } from 'react'
import { inicializarDb } from './db/init'
import { GardenView } from './components/GardenView'
import './App.css'

function App() {
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    inicializarDb().then(() => setPronto(true))
  }, [])

  if (!pronto) return <p style={{ padding: 24 }}>A carregar o jardim...</p>

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#166534' }}>🌿 Jardim</h1>
      <GardenView />
    </main>
  )
}

export default App
