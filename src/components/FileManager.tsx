// components/FileManager.tsx
import React, { useState, useEffect } from 'react';
import { ArchivoSolicitud, archivosService } from '../services/archivosService';
import { Upload, File, Trash2, AlertCircle, Download } from 'lucide-react';

interface FileManagerProps {
    solicitudId: string;
    tipoSolicitud: 'almacen' | 'muestra';
}



export const FileManager: React.FC<FileManagerProps> = ({ solicitudId, tipoSolicitud }) => {
    const [archivos, setArchivos] = useState<ArchivoSolicitud[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    useEffect(() => {
        const cargarArchivos = async () => {
            setLoading(true);
            try {
                const data = await archivosService.getArchivos(solicitudId);
                // Formatear los datos correctamente
                const archivosFormateados = data.map(archivo => ({
                    id: archivo.id,
                    nombreArchivo: archivo.nombreArchivo || archivo.nombreArchivo,
                    tipoArchivo: archivo.tipoArchivo || archivo.tipoArchivo,
                    rutaArchivo: archivo.rutaArchivo || archivo.rutaArchivo,
                    fechaSubida: archivo.fechaSubida || archivo.fechaSubida,
                    subidoPor: archivo.subidoPor || archivo.subidoPor
                }));
                setArchivos(archivosFormateados);
                setError(null);
            } catch (err) {
                console.error('Error al cargar archivos:', err);
                setError('Error al cargar los archivos');
            } finally {
                setLoading(false);
            }
        };
    
        cargarArchivos();
    }, [solicitudId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const handleDownload = async (archivo: ArchivoSolicitud) => {
        try {
            const fileBlob = await archivosService.descargarArchivo(archivo.id);
            const url = window.URL.createObjectURL(fileBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', archivo.nombreArchivo);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
        }
    };
   

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        setLoading(true);
        setUploadProgress(0);
    
        try {
            const newArchivo = await archivosService.subirArchivo(
                solicitudId, 
                tipoSolicitud, 
                file, 
                {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / (progressEvent.total || 1)
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );
            setArchivos(prev => [...prev, newArchivo]);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error al subir el archivo');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (archivoId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

        setLoading(true);
        try {
            await archivosService.eliminarArchivo(archivoId);
            setArchivos(prev => prev.filter(archivo => archivo.id !== archivoId));
            setError(null);
        } catch (err) {
            setError('Error al eliminar el archivo');
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (tipoArchivo: string | undefined) => {
        if (!tipoArchivo) return '📁'; // valor por defecto si no hay tipo
        
        if (tipoArchivo.includes('pdf')) return '📄';
        if (tipoArchivo.includes('image')) return '🖼️';
        if (tipoArchivo.includes('excel') || tipoArchivo.includes('spreadsheet')) return '📊';
        if (tipoArchivo.includes('word') || tipoArchivo.includes('document')) return '📝';
        return '📁';
    };

    

    return (
        <div className="space-y-4">
            {/* Botón de subida */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                    <Upload size={20} />
                    <span>Subir Archivo</span>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={loading}
                    />
                </label>
                {uploadProgress > 0 && (
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Mensajes de error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-100 text-red-700 rounded-lg">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Lista de archivos */}
            <div className="space-y-2">
            {archivos.map((archivo) => (
    <div
        key={archivo.id}
        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50"
    >
        <div className="flex items-center gap-3">
            <span className="text-2xl">
                {getFileIcon(archivo.tipoArchivo)}
            </span>
            <div>
                <p className="font-medium">{archivo.nombreArchivo}</p>
                <p className="text-sm text-gray-500">
                    Subido por {archivo.subidoPor} el{' '}
                    {formatDate(archivo.fechaSubida)}
                </p>
            </div>
        </div>
        <div className="flex gap-2">
            <button
                onClick={() => handleDownload(archivo)}
                className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
                title="Descargar archivo"
            >
                <Download size={20} />
            </button>
            <button
                onClick={() => handleDelete(archivo.id)}
                className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                title="Eliminar archivo"
            >
                <Trash2 size={20} />
            </button>
        </div>
    </div>
))}

            {/* Estado vacío */}
            {archivos.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                    <File size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay archivos adjuntos</p>
                </div>
            )}
            </div>
        </div>
    );
};