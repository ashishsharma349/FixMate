import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './Context/AuthContext.jsx'

 // ab jitne bi childs hoge iske un sab me authstate shared hogi
createRoot(document.getElementById('root')).render(
<BrowserRouter>
  <AuthProvider>
    <App/>
  </AuthProvider>
</BrowserRouter>
)
