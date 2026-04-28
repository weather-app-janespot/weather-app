import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' // Tailwind base styles + CSS custom properties
import App from './App'

// Mount the React app into the #root div defined in index.html.
// StrictMode enables additional runtime warnings during development.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
