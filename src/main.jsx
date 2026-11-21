import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { MemberAuthProvider } from './context/MemberAuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { InstallPromptProvider } from './context/InstallPromptContext'
import { NotificationProvider } from './context/NotificationContext'
import { HydrationProvider } from './context/HydrationContext'
import './index.css'
import ScrollRestoration from './components/layout/ScrollRestoration'
import { DialogHost } from './components/ui/Dialog'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollRestoration />
      <ThemeProvider>
        <InstallPromptProvider>
          <MemberAuthProvider>
            <NotificationProvider>
              <HydrationProvider>
                <App />
                <DialogHost />
              </HydrationProvider>
            </NotificationProvider>
          </MemberAuthProvider>
        </InstallPromptProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
