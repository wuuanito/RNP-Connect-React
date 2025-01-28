import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
 const location = useLocation();
 const { user, logout } = useAuth();
 const [isOpen, setIsOpen] = useState(false);

 const isActive = (path: string) => location.pathname === path;

 const toggleSidebar = () => {
   setIsOpen(!isOpen);
 };

 const menuItems = [
   { path: '/dashboard', icon: '🏠', text: 'Inicio' },
   { path: '/dashboard/administracion', icon: '📊', text: 'Administración' },
   { path: '/dashboard/calidad', icon: '✓', text: 'Control de Calidad' },
   { path: '/dashboard/compras', icon: '🛍️', text: 'Compras' },
   { path: '/dashboard/informatica', icon: '💻', text: 'Informática' },
   { path: '/dashboard/internacional', icon: '🌍', text: 'Internacional' },
   { path: '/dashboard/logistica', icon: '🚛', text: 'Logística' },
   { path: '/dashboard/mantenimiento', icon: '🔨', text: 'Mantenimiento' },
   { path: '/dashboard/tecnica', icon: '🔧', text: 'Oficina Técnica' },
   { path: '/dashboard/prevencion', icon: '🛡️', text: 'Prevención' },
   { path: '/dashboard/rrhh', icon: '👥', text: 'RRHH' },
   { path: '/dashboard/laboratorio', icon: '🧬', text: 'Laboratorio' },
 ];

 return (
   <>
     {/* Botón de menú móvil */}
     <button 
       onClick={toggleSidebar} 
       className="md:hidden fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-md"
     >
       {isOpen ? '✕' : '☰'}
     </button>

     {/* Sidebar para desktop y móvil */}
     <div className={`
       fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-green-800 to-green-900 text-white 
       transform transition-transform duration-300 ease-in-out
       ${isOpen ? 'translate-x-0' : '-translate-x-full'}
       md:translate-x-0 z-40
     `}>
       <div className="p-4 bg-green-900 flex items-center justify-between">
         <h2 className="text-xl font-bold">RNP CONNECT</h2>
         <button 
           onClick={toggleSidebar} 
           className="md:hidden text-white text-2xl"
         >
           ✕
         </button>
       </div>

       {/* Usuario info */}
       <div className="p-4 bg-green-900/50">
         <div className="flex items-center space-x-3">
           <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
             {user?.email?.[0].toUpperCase()}
           </div>
           <div>
             <p className="text-sm font-medium truncate max-w-[200px]">{user?.email}</p>
             <p className="text-xs text-green-300">{user?.role}</p>
           </div>
         </div>
       </div>

       <nav className="flex-1 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-green-700">
         {menuItems.map(({ path, icon, text }) => (
           <Link
             key={path}
             to={path}
             className={`
               flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-2 transition-colors duration-200 
               ${isActive(path)
                 ? 'bg-green-600 text-white'
                 : 'text-green-100 hover:bg-green-700'
               }
             `}
             onClick={() => {
               // Cierra el menú en dispositivos móviles después de seleccionar una opción
               if (window.innerWidth < 768) {
                 setIsOpen(false);
               }
             }}
           >
             <span className="mr-3">{icon}</span>
             {text}
           </Link>
         ))}
       </nav>

       {/* Botón cerrar sesión */}
       <button
         onClick={logout}
         className="m-4 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center w-[calc(100%-2rem)]"
       >
         <span className="mr-2">🚪</span>
         Cerrar sesión
       </button>
     </div>

     {/* Overlay para móviles cuando el menú está abierto */}
     {isOpen && (
       <div 
         onClick={() => setIsOpen(false)} 
         className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
       ></div>
     )}
   </>
 );
}