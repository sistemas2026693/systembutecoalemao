import { useEffect, useState } from 'react'
import Landing from './components/Landing.jsx'
import CustomerApp from './customer/CustomerApp.jsx'
import KitchenApp from './kitchen/KitchenApp.jsx'

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export default function App() {
  const route = useHashRoute()

  if (route.startsWith('#/cozinha')) return <KitchenApp />
  if (route.startsWith('#/cardapio')) return <CustomerApp />
  return <Landing />
}
