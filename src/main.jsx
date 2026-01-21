import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n' // Initialize i18n before App
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
