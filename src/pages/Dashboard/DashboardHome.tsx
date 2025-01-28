import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { format, addDays } from 'date-fns';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { es } from 'date-fns/locale';
import { 
  MapPin, 
  Users, 
  Calendar as CalendarIcon, 
  X, 
  Edit, 
  X as XIcon,
  Circle,
  Filter,
  Tag,
  Moon,
  Sun,
  Info
} from 'lucide-react';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DragAndDropCalendar = withDragAndDrop(Calendar);
const API_BASE_URL = 'http://192.168.11.19:3002';

// Tipos de evento predefinidos con sus colores
const EVENT_TYPES = {
  MEETING: { label: 'Reunión', color: '#4F46E5', icon: '🤝' },
  TRAINING: { label: 'Capacitación', color: '#7C3AED', icon: '📚' },
  PRESENTATION: { label: 'Presentación', color: '#EC4899', icon: '📊' },
  WORKSHOP: { label: 'Taller', color: '#EF4444', icon: '🛠️' },
  OTHER: { label: 'Otro', color: '#10B981', icon: '📌' }
} as const;

// Estados de evento con sus colores
const EVENT_STATUSES = {
  pending: { label: 'Pendiente', color: '#FCD34D' },
  accepted: { label: 'Aceptado', color: '#34D399' },
  declined: { label: 'Rechazado', color: '#EF4444' }
} as const;

interface Event {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  participants: Array<{
    email: string;
    status: keyof typeof EVENT_STATUSES;
  }>;
  room: string;
  type: keyof typeof EVENT_TYPES;
}

interface DragEvent {
  event: Event;
  start: Date;
  end: Date;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (events: Omit<Event, 'id'>[]) => Promise<void>;
  startDates?: Date[];
  endDates?: Date[];
  initialData?: Partial<Event>;
  isDarkMode: boolean;
}

interface CalendarFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  events: Event[];
  currentUserEmail: string;
}

interface FilterState {
  status: 'all' | keyof typeof EVENT_STATUSES;
  room: string;
  participant: string;
  type: 'all' | keyof typeof EVENT_TYPES;
}

interface EventComponentProps {
  event: Event;
  user: { email: string } | null;
}

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

interface LegendProps {
  isDarkMode: boolean;
}// Componente Tooltip personalizado
const Tooltip = ({ children, content }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setIsVisible(true);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 text-sm rounded-lg shadow-lg p-2 min-w-[200px]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(8px)'
          }}
        >
          <div className="text-gray-900 dark:text-white">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Leyenda
const Legend = ({ isDarkMode }: LegendProps) => {
  return (
    <div className={`p-4 rounded-lg shadow-md mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leyenda de Tipos */}
        <div>
          <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Tipos de Evento
          </h3>
          <div className="space-y-2">
            {Object.entries(EVENT_TYPES).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: value.color }}
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {value.icon} {value.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda de Estados */}
        <div>
          <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Estados
          </h3>
          <div className="space-y-2">
            {Object.entries(EVENT_STATUSES).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Circle className="w-4 h-4" fill={value.color} color={value.color} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {value.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Filtros
const CalendarFilters = ({ onFilterChange, events, currentUserEmail }: CalendarFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    room: 'all',
    participant: 'all',
    type: 'all'
  });

  // Obtener valores únicos para los filtros
  const uniqueRooms = [...new Set(events.map(event => event.room))];
  const uniqueParticipants = [...new Set(events.flatMap(event => 
    event.participants.map(p => p.email)
  ))];
  
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filtro por Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(EVENT_STATUSES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Sala */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Sala
          </label>
          <select
            value={filters.room}
            onChange={(e) => handleFilterChange('room', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Todas las salas</option>
            {uniqueRooms.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Participante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Participante
          </label>
          <select
            value={filters.participant}
            onChange={(e) => handleFilterChange('participant', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Todos los participantes</option>
            {uniqueParticipants.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Tipo
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(EVENT_TYPES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// Componente del Evento
const EventComponent = ({ event, user }: EventComponentProps) => {
  const userStatus = user?.email 
    ? event.participants?.find(p => p.email === user.email)?.status || 'pending'
    : 'pending';
  const typeInfo = event.type in EVENT_TYPES ? EVENT_TYPES[event.type] : EVENT_TYPES['OTHER'];
  return (
    <Tooltip
      content={
        <div className="p-2">
          <div className="font-bold mb-1">{event.title}</div>
          <div className="text-sm mb-1">{event.description}</div>
          <div className="text-sm">
            <div>🕒 {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>
            <div>📍 {event.room}</div>
            <div>👥 {event.participants.length} participantes</div>
          </div>
        </div>
      }
    >
      <div 
        className="flex items-center space-x-2 p-1 rounded cursor-pointer transition-colors"
        style={{ 
          backgroundColor: `${typeInfo.color}15`,
          borderLeft: `3px solid ${typeInfo.color}`,
          position: 'relative', // Añadir posición relativa
          zIndex: 1 // Asegurarse de que el evento esté por encima
        }}
      >
        <Circle 
          className="w-2 h-2"
          style={{ color: EVENT_STATUSES[userStatus].color }}
          fill="currentColor" 
        />
        <div className="flex-1">
          <div className="font-semibold text-xs dark:text-white">
            {format(event.start, 'HH:mm')} - {event.title}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
            <span className="mr-1">{typeInfo.icon}</span>
            {typeInfo.label} • {event.room}
          </div>
        </div>
      </div>
    </Tooltip>
  );
};
// Modal de Creación/Edición de Evento
function EventModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  startDates, 
  initialData,
  isDarkMode 
}: EventModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [room, setRoom] = useState(initialData?.room || '');
  const [participants, setParticipants] = useState(
    initialData?.participants?.map(p => p.email).join(', ') || ''
  );
  const [startTime, setStartTime] = useState(
    initialData?.start 
      ? format(initialData.start, 'HH:mm') 
      : format(new Date(), 'HH:mm')
  );
  const [endTime, setEndTime] = useState(
    initialData?.end
      ? format(initialData.end, 'HH:mm')
      : format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm')
  );
  const [eventType, setEventType] = useState<keyof typeof EVENT_TYPES>(
    initialData?.type || 'OTHER'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
  
    try {
      // Añadir console.log para debugging
      console.log('Selected event type:', eventType);
  
      if (startDates && startDates.length > 0) {
        const eventsToCreate = startDates.map(startDate => {
          const startDateTime = new Date(startDate);
          const [startHour, startMinute] = startTime.split(':').map(Number);
          startDateTime.setHours(startHour, startMinute, 0);
          
          const [endHour, endMinute] = endTime.split(':').map(Number);
          const endDateTime = new Date(startDate);
          endDateTime.setHours(endHour, endMinute, 0);
  
          if (new Date() > startDateTime) {
            throw new Error('No puedes crear eventos en el pasado');
          }
  
          // Log del objeto que se va a enviar
          const eventData = {
            title,
            description,
            start: startDateTime,
            end: endDateTime,
            participants: participants.split(',').map(email => ({
              email: email.trim(),
              status: 'pending' as const
            })),
            room,
            type: eventType // Asegurarse de que se incluye el tipo
          };
          
          console.log('Event data to create:', eventData);
          return eventData;
        });
  
        await onSubmit(eventsToCreate);
      } else {
            // Resto del código...
          }
        } catch (error) {
          console.error('Error:', error);
          setError(error instanceof Error ? error.message : 'Error al crear el evento');
        } finally {
          setIsSubmitting(false);
        }
      };

  if (!isOpen) return null;

  const modalClasses = isDarkMode 
    ? 'bg-gray-800 text-white'
    : 'bg-white text-gray-900';

  const inputClasses = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-green-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-96 shadow-xl ${modalClasses}`}>
        <h2 className="text-xl font-bold mb-4" style={{ color: EVENT_TYPES[eventType].color }}>
          {initialData ? 'Editar Evento' : `Nuevo Evento ${startDates ? `(${startDates.length} días)` : ''}`}
        </h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Evento */}
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Evento</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EVENT_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEventType(key as keyof typeof EVENT_TYPES)}
                  className={`p-2 rounded-lg flex items-center space-x-2 transition-colors
                    ${eventType === key 
                      ? 'text-white'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  style={{ 
                    backgroundColor: eventType === key 
                      ? value.color 
                      : isDarkMode ? '#374151' : '#F3F4F6'
                  }}
                >
                  <span>{value.icon}</span>
                  <span>{value.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClasses}`}
              required
            />
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClasses}`}
              rows={3}
              required
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hora Inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className={`w-full p-2 border rounded-lg ${inputClasses}`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className={`w-full p-2 border rounded-lg ${inputClasses}`}
                required
              />
            </div>
          </div>

          {/* Sala */}
          <div>
            <label className="block text-sm font-medium mb-1">Sala</label>
            <input
              type="text"
              value={room}
              onChange={e => setRoom(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClasses}`}
              required
            />
          </div>

          {/* Participantes */}
          <div>
            <label className="block text-sm font-medium mb-1">Participantes</label>
            <input
              type="text"
              value={participants}
              onChange={e => setParticipants(e.target.value)}
              placeholder="Emails separados por comas"
              className={`w-full p-2 border rounded-lg ${inputClasses}`}
              required
            />
          </div>

          {startDates && (
            <div className="text-sm opacity-75">
              Días seleccionados: {startDates.map(date => 
                format(date, 'dd/MM/yyyy')).join(', ')
              }
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: EVENT_TYPES[eventType].color }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Eventos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Detalles del Evento
function EventDetailsModal({ 
  event, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  currentUserEmail,
  isDarkMode 
}: { 
  event: Event; 
  isOpen: boolean; 
  onClose: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
  currentUserEmail: string;
  isDarkMode: boolean;
}) {
  if (!isOpen) return null;

  const typeInfo = event.type in EVENT_TYPES ? EVENT_TYPES[event.type] : EVENT_TYPES['OTHER'];
        const userStatus = event.participants.find(p => p.email === currentUserEmail)?.status || 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full max-h-[90vh] overflow-hidden rounded-lg shadow-xl 
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="relative p-6" style={{ backgroundColor: typeInfo.color }}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:text-opacity-80 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
              <p className="text-white text-opacity-90">{event.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`p-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center space-x-3">
              <Circle 
                className="w-5 h-5" 
                style={{ color: EVENT_STATUSES[userStatus].color }}
                fill="currentColor"
              />
              <p>Estado: {EVENT_STATUSES[userStatus].label}</p>
            </div>

            {/* Fecha y Hora */}
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5" style={{ color: typeInfo.color }} />
              <div>
                <p>
                  {format(event.start, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p>
                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")} hrs
                </p>
              </div>
            </div>

            {/* Sala */}
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5" style={{ color: typeInfo.color }} />
              <p>{event.room}</p>
            </div>

            {/* Participantes */}
            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
              <div className="flex items-center space-x-3 mb-3">
                <Users className="w-5 h-5" style={{ color: typeInfo.color }} />
                <h3 className="font-medium">Participantes</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {event.participants.map((participant, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg flex items-center justify-between
                      ${participant.email === currentUserEmail 
                        ? (isDarkMode ? 'bg-green-900' : 'bg-green-50')
                        : (isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}`}
                  >
                    <span className="text-sm">{participant.email}</span>
                    <Circle 
                      className="w-3 h-3" 
                      style={{ color: EVENT_STATUSES[participant.status].color }}
                      fill="currentColor"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t px-6 py-4 flex justify-between
          ${isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-gray-50 border-gray-200'}`}>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
              transition-colors inline-flex items-center"
          >
            <XIcon size={16} className="mr-2" />
            Eliminar Evento
          </button>
          <div className="space-x-4">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
              transition-colors inline-flex items-center"
          >
            <Edit size={16} className="mr-2" />
            Editar
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors
              ${isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

// Estilos CSS para el modo oscuro del calendario
const calendarDarkStyles = `
.rbc-calendar-dark {
background-color: #1f2937;
color: #fff;
}

.rbc-calendar-dark .rbc-header {
background-color: #374151;
color: #fff;
border-color: #4b5563;
}

.rbc-calendar-dark .rbc-month-view {
border-color: #4b5563;
}

.rbc-calendar-dark .rbc-day-bg {
background-color: #1f2937;
border-color: #4b5563;
}

.rbc-calendar-dark .rbc-today {
background-color: #374151;
}

.rbc-calendar-dark .rbc-off-range-bg {
background-color: #111827;
}

.rbc-calendar-dark .rbc-toolbar button {
color: #fff;
border-color: #4b5563;
}

.rbc-calendar-dark .rbc-toolbar button:hover {
background-color: #374151;
}

.rbc-calendar-dark .rbc-toolbar button.rbc-active {
background-color: #4b5563;
}
`;

// Componente Principal del Calendario
export default function DashboardHome() {
const [events, setEvents] = useState<Event[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; } | null>(null);
const [selectedDates, setSelectedDates] = useState<Date[]>([]);
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isDarkMode, setIsDarkMode] = useState(false);
const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
const { user } = useAuth();
const { addNotification } = useNotifications();

// Efecto para el modo oscuro
useEffect(() => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  setIsDarkMode(darkMode);
  if (darkMode) {
    document.documentElement.classList.add('dark');
  }
  
  // Agregar estilos del calendario en modo oscuro
  const styleElement = document.createElement('style');
  styleElement.textContent = calendarDarkStyles;
  document.head.appendChild(styleElement);

  return () => {
    document.head.removeChild(styleElement);
  };
}, []);

// Cargar eventos al inicio
useEffect(() => {
  fetchEvents();
}, []);

const toggleDarkMode = () => {
  setIsDarkMode(prev => {
    const newMode = !prev;
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return newMode;
  });
};

const fetchEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Error fetching events');

    const data = await response.json();
    const formattedEvents = data.map((event: any) => {
      // Depuración para entender qué tipo de evento se está recibiendo
      console.log('Evento recibido:', {
          type: event.type,
          typeExists: event.type in EVENT_TYPES
      });
  
      return {
          ...event,
          start: new Date(event.start_date),
          end: new Date(event.end_date),
          // Solo usa el tipo si existe exactamente en EVENT_TYPES, de lo contrario usa 'OTHER'
          type: event.type in EVENT_TYPES ? event.type : 'OTHER'
      };
  });
  
    
    setEvents(formattedEvents);
    setFilteredEvents(formattedEvents);
  } catch (error) {
    console.error('Error:', error);
    addNotification({
      title: 'Error',
      message: 'No se pudieron cargar los eventos',
      type: 'event'
    });
  } finally {
    setIsLoading(false);
  }
};
const handleEventDrop = async ({ event, start, end }: any) => {
  try {
    const eventToSend = {
      title: event.title,
      description: event.description,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      participants: event.participants,
      room: event.room,
      type: event.type
    };

    console.log('Sending drag update:', eventToSend);

    const response = await fetch(`${API_BASE_URL}/api/events/${event.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(eventToSend)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating event');
    }

    const updatedEvent = await response.json();
    const formattedEvent = {
      ...updatedEvent,
      id: updatedEvent.id,
      start: new Date(updatedEvent.start_date),
      end: new Date(updatedEvent.end_date),
      type: updatedEvent.type || 'OTHER'
    };

    setEvents(prev => prev.map(e => 
      e.id === event.id ? formattedEvent : e
    ));

    addNotification({
      title: 'Éxito',
      message: 'Evento actualizado correctamente',
      type: 'event'
    });
  } catch (error) {
    console.error('Error:', error);
    addNotification({
      title: 'Error',
      message: 'No se pudo actualizar el evento',
      type: 'event'
    });
  }
};

const handleEventResize = async ({ event, start, end }: any) => {
  try {
    await handleEventDrop({ event, start, end });
  } catch (error) {
    console.error('Error resizing event:', error);
  }
};


const handleEventCreate = async (eventsToCreate: Omit<Event, 'id'>[]) => {
  try {
    console.log('Events to create:', eventsToCreate); // Debug log

    const eventToSend = {
      title: eventsToCreate[0].title,
      description: eventsToCreate[0].description,
      start: eventsToCreate[0].start.toISOString(),
      end: eventsToCreate[0].end.toISOString(),
      participants: eventsToCreate[0].participants,
      room: eventsToCreate[0].room,
      type: eventsToCreate[0].type
    };

    console.log('Sending to backend:', eventToSend); // Debug log

    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(eventToSend)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creating event');
    }

    const newEvent = await response.json();
    console.log('Response from backend:', newEvent); // Debug log

    const formattedEvent: Event = {
      ...newEvent,
      id: newEvent.id,
      start: new Date(newEvent.start_date || newEvent.start),
      end: new Date(newEvent.end_date || newEvent.end),
      type: eventToSend.type, // Usar el tipo que enviamos
      participants: newEvent.participants || eventsToCreate[0].participants
    };

    console.log('Formatted event:', formattedEvent); // Debug log

    setEvents(prev => [...prev, formattedEvent]);
    setFilteredEvents(prev => [...prev, formattedEvent]);

    addNotification({
      title: 'Éxito',
      message: 'Evento creado correctamente',
      type: 'event'
    });

  } catch (error) {
    console.error('Error:', error);
    addNotification({
      title: 'Error',
      message: error instanceof Error ? error.message : 'No se pudo crear el evento',
      type: 'event'
    });
    throw error;
  }
};

const handleEventUpdate = async (eventId: string, eventData: Omit<Event, 'id'>) => {
  try {
    const eventToSend = {
      title: eventData.title,
      description: eventData.description,
      start_date: eventData.start.toISOString(), // Cambiado de start a start_date
      end_date: eventData.end.toISOString(),     // Cambiado de end a end_date
      participants: eventData.participants,
      room: eventData.room,
      type: eventData.type
    };

    console.log('Sending update:', eventToSend); // Para debugging

    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(eventToSend)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating event');
    }

    const updatedEvent = await response.json();
    const formattedEvent = {
      ...updatedEvent,
      id: updatedEvent.id,
      start: new Date(updatedEvent.start_date),
      end: new Date(updatedEvent.end_date),
      type: updatedEvent.type || 'OTHER'
    };

    setEvents(prev => prev.map(event => 
      event.id === eventId ? formattedEvent : event
    ));

    addNotification({
      title: 'Éxito',
      message: 'Evento actualizado correctamente',
      type: 'event'
    });

  } catch (error) {
    console.error('Error:', error);
    addNotification({
      title: 'Error',
      message: error instanceof Error ? error.message : 'No se pudo actualizar el evento',
      type: 'event'
    });
    throw error;
  }
};

const handleEventDelete = async (eventId: string) => {
  if (!window.confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Error deleting event');

    setEvents(prev => prev.filter(event => event.id !== eventId));
    addNotification({
      title: 'Éxito',
      message: 'Evento eliminado correctamente',
      type: 'event'
    });

  } catch (error) {
    console.error('Error:', error);
    addNotification({
      title: 'Error',
      message: 'No se pudo eliminar el evento',
      type: 'event'
    });
  }
};

const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
  if (start.getTime() === end.getTime()) {
    setSelectedSlot({ start, end });
    setSelectedDates([start]);
    setIsModalOpen(true);
    return;
  }

  const dates: Date[] = [];
  let currentDate = new Date(start);
  
  while (currentDate < end) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  setSelectedDates(dates);
  setSelectedSlot(null);
  setIsModalOpen(true);
};

const handleSelectEvent = (event: Event, e: React.SyntheticEvent<HTMLElement>) => {
  setSelectedEvent(event);
  setIsDetailsModalOpen(true);
};

const handleFilterChange = (newFilters: FilterState) => {
  const filtered = events.filter(event => {
    if (newFilters.status !== 'all') {
      const userStatus = event.participants.find(p => p.email === user?.email)?.status;
      if (userStatus !== newFilters.status) return false;
    }

    if (newFilters.room !== 'all' && event.room !== newFilters.room) return false;

    if (newFilters.participant !== 'all' && 
        !event.participants.some(p => p.email === newFilters.participant)) return false;

    if (newFilters.type !== 'all' && event.type !== newFilters.type) return false;

    return true;
  });

  setFilteredEvents(filtered);
};

if (isLoading) {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
    </div>
  );
}

return (
  <div className={`p-6 rounded-lg shadow transition-colors ${
    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
  }`}>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Calendario de Eventos</h1>
      <button
        onClick={toggleDarkMode}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>

    <CalendarFilters 
      onFilterChange={handleFilterChange}
      events={events}
      currentUserEmail={user?.email || ''}
    />

    <Legend isDarkMode={isDarkMode} />

    <div className={`h-[calc(100vh-16rem)] ${isDarkMode ? 'rbc-calendar-dark' : ''}`}>
    <DragAndDropCalendar
  localizer={dateFnsLocalizer({ 
    format, 
    parse, 
    startOfWeek, 
    getDay, 
    locales: { es } 
  })}
  events={filteredEvents}
  startAccessor={(event) => (event as Event).start}
  endAccessor={(event) => (event as Event).end}
  selectable
  resizable
  onEventDrop={(data) => {
    const { event, start, end } = data as { event: Event; start: Date; end: Date };
    handleEventDrop({ event, start, end });
  }}
  onEventResize={(data) => {
    const { event, start, end } = data as { event: Event; start: Date; end: Date };
    handleEventResize({ event, start, end });
  }}
  onSelectSlot={handleSelectSlot}
  onSelectEvent={(event, e) => handleSelectEvent(event as Event, e)}
  views={['month']}
  defaultView="month"
  components={{
    event: (props) => <EventComponent {...props} event={props.event as Event} user={user} />
  }}
  messages={{
    next: "Siguiente",
    previous: "Anterior",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día"
  }}
  formats={{
    monthHeaderFormat: (date) => format(date, 'MMMM yyyy', {locale: es}),
    dayHeaderFormat: (date) => format(date, 'EEEE dd/MM', {locale: es}),
    dayRangeHeaderFormat: ({ start, end }) => 
      `${format(start, 'dd/MM', {locale: es})} - ${format(end, 'dd/MM', {locale: es})}`,
  }}
  className={isDarkMode ? 'rbc-calendar-dark' : 'rbc-calendar-light'}
/>
    </div>

    {/* Modales */}
    <EventModal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedSlot(null);
        setSelectedDates([]);
      }}
      onSubmit={selectedEvent 
        ? (data) => handleEventUpdate(selectedEvent.id, data[0])
        : handleEventCreate}
      startDates={selectedDates.length > 0 ? selectedDates : undefined}
      initialData={selectedEvent || undefined}
      isDarkMode={isDarkMode}
    />

    {selectedEvent && (
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={() => {
          setIsDetailsModalOpen(false);
          setIsModalOpen(true);
        }}
        onDelete={() => {
          handleEventDelete(selectedEvent.id);
          setIsDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        currentUserEmail={user?.email || ''}
        isDarkMode={isDarkMode}
      />
    )}
  </div>
);
}