import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export default function Dashboard() {
 return (
   <div className="flex bg-green-50 min-h-screen">
     <Sidebar />
     <div className="ml-64 flex-1 p-6">
       <header className="mb-6">
         <div className="max-w-7xl mx-auto">
          
           <p className="text-green-600 mt-1">
             RIOJA NATURE PHARMA - Gestión y planificación de actividades
           </p>
         </div>
       </header>
       <main className="bg-white rounded-lg shadow-lg">
         <Outlet />
       </main>
     </div>
   </div>
 );
}