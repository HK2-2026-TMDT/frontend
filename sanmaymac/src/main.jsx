import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

// sockjs-client expects Node's `global` in browser bundles
if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
