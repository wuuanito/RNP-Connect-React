import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { logout } = useAuth();
  const users = [
    { id: 1, name: 'Usuario 1', role: 'user' },
    { id: 2, name: 'Usuario 2', role: 'admin' },
    { id: 3, name: 'Usuario 3', role: 'user' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel de Administración</h1>
          <button 
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-4 mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Gestión de Usuarios</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Rol</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="px-6 py-4">{user.id}</td>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">
                    <button className="text-blue-500 mr-2">Editar</button>
                    <button className="text-red-500">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}