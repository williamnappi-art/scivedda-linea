import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LineaApp from './LineaApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LineaApp />
  </StrictMode>,
)
