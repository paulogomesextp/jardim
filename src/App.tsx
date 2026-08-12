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
    <main className="app-shell">
      <GardenView />
    </main>
  )
}

export default App
