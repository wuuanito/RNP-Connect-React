// Interfaces para las solicitudes a almacén
export interface AlmacenRequest {
    id: string;
    solicitante: string;
    codigo_articulo: string;  // Nuevo campo añadido
    nombre_mp: string;
    lote: string;
    proveedor: string;
    urgencia: 'Alta' | 'Media' | 'Baja';
    fecha: string;
    estado: 'Pendiente' | 'En Proceso' | 'Completado' | 'Rechazado';
    observaciones?: string;
  }
  // Interfaces para las solicitudes de muestras
  export interface MuestraRequest {
    id: string;
    solicitante: string;
    tipoMuestra: string;
    lote: string;
    origen: string;
    urgencia: 'Alta' | 'Media' | 'Baja';
    fecha: string;
    estado: 'Pendiente' | 'En Proceso' | 'Completado' | 'Rechazado';
    observaciones : string
  }
  
  // Interface para los mensajes del chat
  export interface ChatMessage {
    id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}