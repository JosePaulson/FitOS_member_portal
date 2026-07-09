import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { MemberAuthProvider } from './context/MemberAuthContext'
import { ThemeProvider }      from './context/ThemeContext'
import { InstallPromptProvider } from './context/InstallPromptContext'
import { NotificationProvider }  from './context/NotificationContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <InstallPromptProvider>
          <MemberAuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </MemberAuthProvider>
        </InstallPromptProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
