import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@google/model-viewer'
import './index.css'
import App from './App.jsx'

// model-viewer defaults to Google's CDN for the Draco decoder — self-host it
// instead so Draco-compressed models still load on networks that block that CDN.
window.ModelViewerElement = window.ModelViewerElement || {}
window.ModelViewerElement.dracoDecoderLocation = `${window.location.origin}/draco/`

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
