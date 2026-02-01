import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('[SkyCal] React starting at:', new Date().toISOString())

// Hide HTML fallback loader once React mounts
if (window.hideFallback) window.hideFallback()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
