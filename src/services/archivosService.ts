import axios, { AxiosProgressEvent } from 'axios';

export interface ArchivoSolicitud {
    id: string;
    nombreArchivo: string;
    tipoArchivo?: string;
    rutaArchivo: string;
    fechaSubida: string;
    subidoPor: string;
}

export interface UploadOptions {
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export const archivosService = {
    async getArchivos(solicitudId: string): Promise<ArchivoSolicitud[]> {
        try {
            const response = await axios.get(`/api/archivos/${solicitudId}`);
            return response.data.map((archivo: ArchivoSolicitud) => ({
                ...archivo,
                fechaSubida: archivo.fechaSubida || new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error al obtener archivos:', error);
            throw new Error(this.getErrorMessage(error));
        }
    },

    async subirArchivo(
        solicitudId: string, 
        tipoSolicitud: 'almacen' | 'muestra', 
        archivo: File, 
        options: UploadOptions = {}
    ): Promise<ArchivoSolicitud> {
        // Validar el archivo antes de subirlo
        this.validateFile(archivo);

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('tipoSolicitud', tipoSolicitud);

        try {
            const response = await axios.post(
                `/api/archivos/${solicitudId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: options.onUploadProgress
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error al subir archivo:', error);
            throw new Error(this.getErrorMessage(error));
        }
    },

    async eliminarArchivo(archivoId: string): Promise<void> {
        try {
            await axios.delete(`/api/archivos/${archivoId}`);
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            throw new Error(this.getErrorMessage(error));
        }
    },

    // Método para descargar un archivo
    async descargarArchivo(archivoId: string): Promise<Blob> {
        try {
            const response = await axios.get(`/api/archivos/download/${archivoId}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            throw new Error(this.getErrorMessage(error));
        }
    },

    // Método para validar archivos antes de subirlos
    validateFile(archivo: File): void {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ];

        if (archivo.size > maxSize) {
            throw new Error('El archivo es demasiado grande. Máximo 5MB.');
        }

        if (!allowedTypes.includes(archivo.type)) {
            throw new Error('Tipo de archivo no permitido. Solo se permiten PDF, Word, Excel e imágenes.');
        }
    },

    // Método para manejar diferentes tipos de errores
    getErrorMessage(error: any): string {
        if (axios.isAxiosError(error)) {
            return error.response?.data?.error || 
                   error.message || 
                   'Error desconocido al procesar la solicitud';
        }
        return error instanceof Error 
            ? error.message 
            : 'Error desconocido al procesar la solicitud';
    }
};