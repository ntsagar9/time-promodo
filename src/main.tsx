import '@fontsource-variable/geist/wght.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Tooltip from '@radix-ui/react-tooltip'
import App from './App'
import './styles/globals.css'
import './styles/themes.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Tooltip.Provider delayDuration={200}>
      <App />
    </Tooltip.Provider>
  </React.StrictMode>
)
