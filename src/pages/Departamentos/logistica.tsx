// components/Laboratorio.tsx
import React, { useState, useEffect } from 'react';
import { laboratorioService } from '../../services/laboratorioService';
import { useAuth } from '../../context/AuthContext';
import { 
    SolicitudAlmacen, 
    SolicitudMuestra, 
    MensajeChat, 
    EstadoSolicitud, 
    NivelUrgencia 
} from '../../services/laboratorioService';
import { AdvancedFilter, FilterField, FilterValue } from '../../components/AdvancedFilter';
import { FileManager } from '../../components/FileManager';

interface FormData {
  nombre_mp?: string;
  codigo_articulo?: string;
  tipoMuestra?: string;
  lote: string;
  proveedor?: string;
  origen?: string;
  urgencia: NivelUrgencia;
  observaciones?: string;
}

export default function Logistica() {
  // Estados para pestañas y modales
  const [activeTab, setActiveTab] = useState('almacen');
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  


  
  // Estados para datos
  const [almacenRequests, setAlmacenRequests] = useState<SolicitudAlmacen[]>([]);
  const [muestraRequests, setMuestraRequests] = useState<SolicitudMuestra[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SolicitudAlmacen | SolicitudMuestra | null>(null);
  const [chatMessages, setChatMessages] = useState<MensajeChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para el formulario
  const [formData, setFormData] = useState<FormData>({
    lote: '',
    urgencia: 'Baja'
  });

  // Estado para loading y errores
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (activeTab === 'almacen') {
          const data = await laboratorioService.getAlmacenRequests();
          console.log('Datos recibidos del servidor:', data);
          
          // Verifica que los datos tengan la estructura correcta
          const formattedData = data.map(item => ({
            ...item,
            codigoArticulo: item.codigo_articulo || item.codigo_articulo, // Maneja ambos casos
            nombreMP: item.nombre_mp || item.nombre_mp // Maneja ambos casos
          }));
          
          console.log('Datos formateados:', formattedData);
          setAlmacenRequests(formattedData);
        } else {
          const data = await laboratorioService.getMuestraRequests();
          setMuestraRequests(data);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };
  
    loadData();
  }, [activeTab]);

  // Cargar mensajes del chat cuando se selecciona una solicitud
  useEffect(() => {
    const loadChatMessages = async () => {
      if (selectedRequest && showChatModal) {
        setIsLoading(true);
        try {
          const messages = await laboratorioService.getChatMessages(selectedRequest.id);
          setChatMessages(messages);
        } catch (err) {
          console.error('Error al cargar mensajes:', err);
          setError('Error al cargar los mensajes del chat.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadChatMessages();
  }, [selectedRequest, showChatModal]);

  // Handlers
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm('');
    setSelectedRequest(null);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'almacen') {
        const response = await laboratorioService.createAlmacenRequest({
          solicitante: user?.email || '',
          codigo_articulo: formData.codigo_articulo || '',
          nombre_mp: formData.nombre_mp || '',
          lote: formData.lote,
          proveedor: formData.proveedor || '',
          urgencia: formData.urgencia,
          observaciones: formData.observaciones || ''
        });
        
        setAlmacenRequests(prev => [response.solicitud, ...prev]);
      } else {
        const response = await laboratorioService.createMuestraRequest({
          solicitante: user?.email || '',
          tipoMuestra: formData.tipoMuestra || '',
          lote: formData.lote,
          origen: formData.origen || '',
          urgencia: formData.urgencia,
          observaciones: formData.observaciones || ''
        });
        
        setMuestraRequests(prev => [response.solicitud, ...prev]);
      }

      setIsCreatingRequest(false);
      setFormData({ lote: '', urgencia: 'Baja' }); // Reset form
    } catch (err) {
      console.error('Error al crear solicitud:', err);
      setError('Error al crear la solicitud. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };
  const almacenFilterFields: FilterField[] = [
    { field: 'solicitante', label: 'Solicitante', type: 'text' },
    { field: 'codigo_articulo', label: 'Código Artículo', type: 'text' },
    { field: 'nombre_mp', label: 'Nombre MP', type: 'text' },
    { field: 'lote', label: 'Lote', type: 'text' },
    { field: 'proveedor', label: 'Proveedor', type: 'text' },
    { field: 'urgencia', label: 'Urgencia', type: 'select', 
      options: [
        { value: 'Alta', label: 'Alta' },
        { value: 'Media', label: 'Media' },
        { value: 'Baja', label: 'Baja' }
      ]
    },
    { field: 'fecha', label: 'Fecha', type: 'date' },
    { field: 'estado', label: 'Estado', type: 'select',
      options: [
        { value: 'Pendiente', label: 'Pendiente' },
        { value: 'En Proceso', label: 'En Proceso' },
        { value: 'Completado', label: 'Completado' },
        { value: 'Rechazado', label: 'Rechazado' }
      ]
    }
  ];
  
  const muestraFilterFields: FilterField[] = [
    { field: 'solicitante', label: 'Solicitante', type: 'text' },
    { field: 'tipoMuestra', label: 'Tipo Muestra', type: 'text' },
    { field: 'lote', label: 'Lote', type: 'text' },
    { field: 'origen', label: 'Origen', type: 'text' },
    { field: 'urgencia', label: 'Urgencia', type: 'select',
      options: [
        { value: 'Alta', label: 'Alta' },
        { value: 'Media', label: 'Media' },
        { value: 'Baja', label: 'Baja' }
      ]
    },
    { field: 'fecha', label: 'Fecha', type: 'date' },
    { field: 'estado', label: 'Estado', type: 'select',
      options: [
        { value: 'Pendiente', label: 'Pendiente' },
        { value: 'En Proceso', label: 'En Proceso' },
        { value: 'Completado', label: 'Completado' },
        { value: 'Rechazado', label: 'Rechazado' }
      ]
    }
  ];

  const applyFilters = (item: any, filters: FilterValue[], searchTerm: string) => {
    console.log('Aplicando filtros a item:', item); // Añade este log
    
    // Si no hay filtros ni término de búsqueda, mostrar todo
    if (filters.length === 0 && !searchTerm) return true;
  
    // Aplicar término de búsqueda general
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const searchableFields = ['solicitante', 'codigoArticulo', 'nombreMP', 'lote', 'proveedor'];
      
      const matchesSearch = searchableFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTermLower);
      });
      
      if (!matchesSearch) return false;
    }
  
    // Aplicar filtros específicos
    return filters.every(filter => {
      const value = item[filter.field];
      if (value === undefined || value === null) return false;
  
      const itemValue = value.toString().toLowerCase();
      const filterValue = filter.value.toString().toLowerCase();
  
      switch (filter.operator) {
        case 'contains':
          return itemValue.includes(filterValue);
        case 'equals':
          return itemValue === filterValue;
        case 'startsWith':
          return itemValue.startsWith(filterValue);
        case 'endsWith':
          return itemValue.endsWith(filterValue);
        case 'greaterThan':
          return new Date(itemValue) > new Date(filterValue);
        case 'lessThan':
          return new Date(itemValue) < new Date(filterValue);
        default:
          return false;
      }
    });
  };
  

  const handleUpdateStatus = async (id: string, newStatus: EstadoSolicitud) => {
    setIsLoading(true);
    try {
      if (activeTab === 'almacen') {
        await laboratorioService.updateAlmacenStatus(id, newStatus);
        setAlmacenRequests(prev =>
          prev.map(req =>
            req.id === id ? { ...req, estado: newStatus } : req
          )
        );
      } else {
        await laboratorioService.updateMuestraStatus(id, newStatus);
        setMuestraRequests(prev =>
          prev.map(req =>
            req.id === id ? { ...req, estado: newStatus } : req
          )
        );
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newMessage.trim() || !user?.email) return;

    try {
      const message = await laboratorioService.sendChatMessage(
        selectedRequest.id,
        user.email,
        user.email.split('@')[0],
        newMessage.trim()
      );
      
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError('Error al enviar el mensaje. Por favor, intente nuevamente.');
    }
  };
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);


  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header y Búsqueda */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Logistica</h1>
          <div className="flex gap-4">
          <div className="mb-6">
  <AdvancedFilter
    fields={activeTab === 'almacen' ? almacenFilterFields : muestraFilterFields}
    onFilterChange={setActiveFilters}
    onSearchChange={setSearchTerm}
  />
</div>
            <button
              onClick={() => setIsCreatingRequest(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
              disabled={isLoading}
            >
              <span>Nueva Solicitud</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => handleTabChange('almacen')}
            disabled={isLoading}
            className={`py-2 px-4 focus:outline-none ${
              activeTab === 'almacen'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Solicitudes Laboratorio
          </button>
          <button
            onClick={() => handleTabChange('muestras')}
            disabled={isLoading}
            className={`py-2 px-4 focus:outline-none ${
              activeTab === 'muestras'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Solicitudes de Muestras
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading estado */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}
      {/* Contenido principal - Tablas */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'almacen' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código Artículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre MP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {almacenRequests
  .filter(request => applyFilters(request, activeFilters, searchTerm))

                    .map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.solicitante}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.codigo_articulo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.nombre_mp}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.lote}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.proveedor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.urgencia === 'Alta'
                                ? 'bg-red-100 text-red-800'
                                : request.urgencia === 'Media'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {request.urgencia}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={request.estado}
                            onChange={(e) => handleUpdateStatus(request.id, e.target.value as EstadoSolicitud)}
                            className={`px-2 py-1 text-xs rounded-full border-0 font-semibold ${
                              request.estado === 'Completado'
                                ? 'bg-green-100 text-green-800'
                                : request.estado === 'En Proceso'
                                ? 'bg-blue-100 text-blue-800'
                                : request.estado === 'Rechazado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Completado">Completado</option>
                            <option value="Rechazado">Rechazado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Detalles
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowChatModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Chat
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (<div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Muestra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {muestraRequests
  .filter(request => applyFilters(request, activeFilters, searchTerm))

                  .map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.solicitante}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.tipoMuestra}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.lote}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.origen}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.urgencia === 'Alta'
                              ? 'bg-red-100 text-red-800'
                              : request.urgencia === 'Media'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {request.urgencia}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={request.estado}
                          onChange={(e) => handleUpdateStatus(request.id, e.target.value as EstadoSolicitud)}
                          className={`px-2 py-1 text-xs rounded-full border-0 font-semibold ${
                            request.estado === 'Completado'
                              ? 'bg-green-100 text-green-800'
                              : request.estado === 'En Proceso'
                              ? 'bg-blue-100 text-blue-800'
                              : request.estado === 'Rechazado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Proceso">En Proceso</option>
                          <option value="Completado">Completado</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Detalles
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowChatModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}{/* Modal de Detalles */}
    {showDetailsModal && selectedRequest && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Detalles de la Solicitud</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">ID de Solicitud</h4>
                  <p className="mt-1">{selectedRequest.id}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Solicitante</h4>
                  <p className="mt-1">{selectedRequest.solicitante}</p>
                </div>
                
                {'nombreMP' in selectedRequest ? (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Código de Artículo</h4>
                      {'codigo_articulo' in selectedRequest && (
                        <p className="mt-1">{selectedRequest.codigo_articulo}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Nombre MP</h4>
                      {'proveedor' in selectedRequest && (

                      <p className="mt-1">{selectedRequest.nombre_mp}</p>
                    )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Proveedor</h4>
                      {'proveedor' in selectedRequest && (
                        <p className="mt-1">{selectedRequest.proveedor}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Tipo de Muestra</h4>
                      <p className="mt-1">{'tipoMuestra' in selectedRequest ? selectedRequest.tipoMuestra : ''}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Origen</h4>
                      {'proveedor' in selectedRequest && (

                      <p className="mt-1">{selectedRequest.origen}</p>
                    )}

                    </div>
                    
                  </>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Lote</h4>
                  <p className="mt-1">{selectedRequest.lote}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Urgencia</h4>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedRequest.urgencia === 'Alta'
                          ? 'bg-red-100 text-red-800'
                          : selectedRequest.urgencia === 'Media'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {selectedRequest.urgencia}
                    </span>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Estado</h4>
                  <div className="mt-1 flex items-center gap-3">
                    <select
                      value={selectedRequest.estado}
                      onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value as EstadoSolicitud)}
                      className={`px-2 py-1 text-xs rounded-full border-0 font-semibold ${
                        selectedRequest.estado === 'Completado'
                          ? 'bg-green-100 text-green-800'
                          : selectedRequest.estado === 'En Proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedRequest.estado === 'Rechazado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Completado">Completado</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Fecha de Solicitud</h4>
                  <p className="mt-1">{new Date(selectedRequest.fecha).toLocaleString()}</p>
                </div>

                {selectedRequest.observaciones && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Observaciones</h4>
                    <p className="mt-1 whitespace-pre-wrap">{selectedRequest.observaciones}</p>
                  </div>
                  
                )}
                {/* Sección de archivos adjuntos */}
<div className="mt-6">
    <h4 className="text-sm font-medium text-gray-500 mb-4">Archivos Adjuntos</h4>
    <FileManager 
        solicitudId={selectedRequest.id}
        tipoSolicitud={'nombreMP' in selectedRequest ? 'almacen' : 'muestra'}
    />
</div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}{/* Modal de Chat */}
    {showChatModal && selectedRequest && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full h-[80vh]">
            <div className="flex flex-col h-full">
              {/* Header del Chat */}
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">
                    Chat - Solicitud {selectedRequest.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {'nombre_mp' in selectedRequest ? selectedRequest.nombre_mp : selectedRequest.tipoMuestra}
                  </p>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mensajes del Chat */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
  {chatMessages.length === 0 ? (
    <div className="flex items-center justify-center h-full text-gray-500">
      No hay mensajes aún. ¡Sé el primero en escribir!
    </div>
  ) : (
    chatMessages.map((message) => (
      <div
        key={message.id}
        className={`flex ${
          message.usuarioId === user?.email ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            message.usuarioId === user?.email
              ? 'bg-green-100 text-green-900'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <div className="text-xs text-gray-500 mb-1">
            {message.nombreUsuario}
          </div>
          <p className="text-sm break-words">{message.mensaje}</p>
          <div className="text-xs text-gray-500 mt-1">
            {message.fechaHora ? new Date(message.fechaHora).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            }) : ''}
          </div>
        </div>
      </div>
    ))
  )}
</div>

              {/* Formulario de Envío */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}{/* Modal de Creación de Solicitud */}
    {isCreatingRequest && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">
                  {activeTab === 'almacen' ? 'Nueva Solicitud a Almacén' : 'Nueva Solicitud de Muestra'}
                </h3>
                <button
                  onClick={() => setIsCreatingRequest(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {activeTab === 'almacen' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Código de Artículo
                        </label>
                        <input
                          type="text"
                          name="codigoArticulo"
                          value={formData.codigo_articulo || ''}
                          onChange={handleFormChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nombre de Materia Prima
                        </label>
                        <input
                          type="text"
                          name="nombreMP"
                          value={formData.nombre_mp || ''}
                          onChange={handleFormChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Proveedor
                        </label>
                        <input
                          type="text"
                          name="proveedor"
                          value={formData.proveedor || ''}
                          onChange={handleFormChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tipo de Muestra
                        </label>
                        <input
                          type="text"
                          name="tipoMuestra"
                          value={formData.tipoMuestra || ''}
                          onChange={handleFormChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Origen
                        </label>
                        <input
                          type="text"
                          name="origen"
                          value={formData.origen || ''}
                          onChange={handleFormChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Lote
                    </label>
                    <input
                      type="text"
                      name="lote"
                      value={formData.lote}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Urgencia
                    </label>
                    <select
                      name="urgencia"
                      value={formData.urgencia}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formData.observaciones || ''}
                      onChange={handleFormChange}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Añade cualquier observación relevante..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatingRequest(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creando...' : 'Crear Solicitud'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}