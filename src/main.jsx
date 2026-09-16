import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

const container = document.getElementById('root')

if (import.meta.env.DEV) {
  createRoot(container).render(tree)
} else {
  hydrateRoot(container, tree)
}
