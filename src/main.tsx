import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Añade un componente de carga para mejorar la experiencia de usuario
const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-green-500"></div>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>
);