// services/laboratorioService.ts
import axios from 'axios';
import { ReactNode } from 'react';

const BASE_URL = 'http://localhost:3002/api/laboratorio';
// Tipos de estado y urgencia
export type EstadoSolicitud = 'Pendiente' | 'En Proceso' | 'Completado' | 'Rechazado';
export type NivelUrgencia = 'Alta' | 'Media' | 'Baja';

// Interfaces base
interface SolicitudBase {
    id: string;
    solicitante: string;
    lote: string;
    urgencia: NivelUrgencia;
    fecha: string;
    estado: EstadoSolicitud;
    observaciones?: string;
}

// Interfaces para solicitudes de almacén
export interface SolicitudAlmacen extends SolicitudBase {
    origen: ReactNode;
    codigo_articulo: string;
    nombre_mp: string;
    proveedor: string;
}

export interface CrearSolicitudAlmacen {
    solicitante: string;
    codigo_articulo: string;
    nombre_mp: string;
    lote: string;
    proveedor: string;
    urgencia: NivelUrgencia;
    observaciones?: string;
}

// Interfaces para solicitudes de muestras
export interface SolicitudMuestra extends SolicitudBase {
    tipoMuestra: string;
    origen: string;
}

export interface CrearSolicitudMuestra {
    solicitante: string;
    tipoMuestra: string;
    lote: string;
    origen: string;
    urgencia: NivelUrgencia;
    observaciones?: string;
}

// Interfaces para mensajes de chat
export interface MensajeChat {
    id: string;
    solicitudId: string;
    usuarioId: string;
    nombreUsuario: string;
    mensaje: string;
    fechaHora: string;
}

// Interfaces para respuestas del servidor
interface RespuestaCreacion<T> {
    id: string;
    mensaje: string;
    solicitud: T;
}

interface RespuestaActualizacion {
    mensaje: string;
}

// Clase del servicio
export class LaboratorioService {
    // Métodos para solicitudes de almacén
    async getAlmacenRequests(): Promise<SolicitudAlmacen[]> {
        try {
            const response = await axios.get<SolicitudAlmacen[]>(`${BASE_URL}/almacen`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener solicitudes de almacén:', error);
            throw error;
        }
    }

    async createAlmacenRequest(data: CrearSolicitudAlmacen): Promise<RespuestaCreacion<SolicitudAlmacen>> {
        try {
            const response = await axios.post<RespuestaCreacion<SolicitudAlmacen>>(`${BASE_URL}/almacen`, data);
            return response.data;
        } catch (error) {
            console.error('Error al crear solicitud de almacén:', error);
            throw error;
        }
    }

    async updateAlmacenStatus(id: string, estado: EstadoSolicitud): Promise<RespuestaActualizacion> {
        try {
            const response = await axios.patch<RespuestaActualizacion>(
                `${BASE_URL}/almacen/${id}/estado`,
                { estado }
            );
            return response.data;
        } catch (error) {
            console.error('Error al actualizar estado de almacén:', error);
            throw error;
        }
    }

    // Métodos para solicitudes de muestras
    async getMuestraRequests(): Promise<SolicitudMuestra[]> {
        try {
            const response = await axios.get<SolicitudMuestra[]>(`${BASE_URL}/muestras`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener solicitudes de muestras:', error);
            throw error;
        }
    }

    async createMuestraRequest(data: CrearSolicitudMuestra): Promise<RespuestaCreacion<SolicitudMuestra>> {
        try {
            const response = await axios.post<RespuestaCreacion<SolicitudMuestra>>(`${BASE_URL}/muestras`, data);
            return response.data;
        } catch (error) {
            console.error('Error al crear solicitud de muestra:', error);
            throw error;
        }
    }

    async updateMuestraStatus(id: string, estado: EstadoSolicitud): Promise<RespuestaActualizacion> {
        try {
            const response = await axios.patch<RespuestaActualizacion>(
                `${BASE_URL}/muestras/${id}/estado`,
                { estado }
            );
            return response.data;
        } catch (error) {
            console.error('Error al actualizar estado de muestra:', error);
            throw error;
        }
    }

    // Métodos para mensajes de chat
    async getChatMessages(solicitudId: string): Promise<MensajeChat[]> {
        try {
            const response = await axios.get<MensajeChat[]>(`${BASE_URL}/chat/${solicitudId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener mensajes del chat:', error);
            throw error;
        }
    }

    async sendChatMessage(
        solicitudId: string,
        usuarioId: string,
        nombreUsuario: string,
        mensaje: string
    ): Promise<MensajeChat> {
        try {
            const response = await axios.post<MensajeChat>(`${BASE_URL}/chat/${solicitudId}`, {
                usuarioId,
                nombreUsuario,
                mensaje
            });
            return response.data;
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            throw error;
        }
    }
}

// Exportar una instancia por defecto del servicio
export const laboratorioService = new LaboratorioService();