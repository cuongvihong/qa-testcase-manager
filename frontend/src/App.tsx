import { useEffect } from 'react'
import { MainPage } from './pages/MainPage'
import { useTestExplorer } from './store/testExplorer'

function App() {
  const loadInitial = useTestExplorer((s) => s.loadInitial)

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  return <MainPage />
}

export default App
