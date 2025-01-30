import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MapPin, 
  Users, 
  Calendar as CalendarIcon, 
  X, 
  Edit, 
  Moon,
  Sun,
  Info 
} from 'lucide-react';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

// Constantes
const DragAndDropCalendar = withDragAndDrop(Calendar);
const API_BASE_URL = 'http://localhost:3002';

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

// Interfaces
interface Event {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  participants: Array<{
    email: string;
  }>;
  room: string;
  type: keyof typeof EVENT_TYPES;
}

interface EventDetailsModalProps { 
  event: Event; 
  isOpen: boolean; 
  onClose: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
  onSelectEvent: (event: Event) => void;
  onOpenDetailsModal: () => void;
  currentUserEmail: string;
  isDarkMode: boolean;
  events?: Event[];
  hiddenEvents?: Event[];
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
}

// Componente Tooltip
const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
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

// Componente Legend
const Legend: React.FC<LegendProps> = ({ isDarkMode }) => {
  return (
    <div className={`p-4 rounded-lg shadow-md mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
    </div>
  );
};

// Componente CalendarFilters
const CalendarFilters: React.FC<CalendarFiltersProps> = ({ onFilterChange, events, currentUserEmail }) => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    room: 'all',
    participant: 'all',
    type: 'all'
  });

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

// Componente EventComponent
const EventComponent: React.FC<EventComponentProps> = ({ event, user }) => {
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
        className="flex items-center space-x-1 py-0.5 px-1 rounded cursor-pointer transition-colors text-xs"
        style={{ 
          backgroundColor: typeInfo.color,
          color: 'white',
          position: 'relative',
          zIndex: 1,
          minHeight: '1.5rem',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}
      >
        <div className="flex-1 overflow-hidden">
          <div className="font-semibold truncate">
            {format(event.start, 'HH:mm')} - {event.title}
          </div>
        </div>
      </div>
    </Tooltip>
  );
};

// Modal de Detalles del Evento
const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ 
  event, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  onSelectEvent,
  onOpenDetailsModal,
  currentUserEmail,
  isDarkMode,
  events,
  hiddenEvents
}) => {
  if (!isOpen) return null;

  const dayEvents = hiddenEvents || events?.filter(e => 
    e.start.getDate() === event.start.getDate() &&
    e.start.getMonth() === event.start.getMonth() &&
    e.start.getFullYear() === event.start.getFullYear()
  ) || [event];

  const typeInfo = event.type in EVENT_TYPES ? EVENT_TYPES[event.type] : EVENT_TYPES['OTHER'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full max-h-[90vh] rounded-lg shadow-xl flex flex-col
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
              <h2 className="text-2xl font-bold text-white">
                {hiddenEvents ? 'Más eventos' : event.title}
              </h2>
              <p className="text-white text-opacity-90">
                {format(event.start, "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          <div className="p-6">
            <div className="space-y-4">
              {dayEvents.map((dayEvent) => {
                const eventTypeInfo = EVENT_TYPES[dayEvent.type] || EVENT_TYPES['OTHER'];
                return (
                  <div 
                    key={dayEvent.id}
                    className="p-4 rounded-lg transition-colors hover:bg-opacity-90 cursor-pointer"
                    style={{ backgroundColor: `${eventTypeInfo.color}15` }}
                    onClick={() => {
                      if (hiddenEvents) {
                        onSelectEvent(dayEvent);
                        onOpenDetailsModal();
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {format(dayEvent.start, "HH:mm")} - {format(dayEvent.end, "HH:mm")} hrs
                      </span>
                      <span className="text-sm">
                        {eventTypeInfo.icon} {eventTypeInfo.label}
                      </span>
                    </div>
                    
                    <h3 className="font-medium mb-2">{dayEvent.title}</h3>
                    <p className="text-sm mb-2">{dayEvent.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{dayEvent.room}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{dayEvent.participants.length} participantes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t px-6 py-4 flex justify-end space-x-4
          ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
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
  );
};

// Componente EventModal
const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  startDates, 
  initialData,
  isDarkMode 
}) => {
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
      if (startDates && startDates.length > 0) {
        const eventsToCreate = startDates.map(startDate => {
          const startDateTime = new Date(startDate);
          const [startHour, startMinute] = startTime.split(':').map(Number);
          startDateTime.setHours(startHour, startMinute, 0);
          
          const endDateTime = new Date(startDateTime);
          endDateTime.setHours(startDateTime.getHours() + 1);

          if (new Date() > startDateTime) {
            throw new Error('No puedes crear eventos en el pasado');
          }

          return {
            title: room,
            description,
            start: startDateTime,
            end: endDateTime,
            participants: participants.split(',').map(email => ({ email: email.trim() })),
            room,
            type: eventType
          };
        });

        await onSubmit(eventsToCreate);
        onClose();
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
          {/* Tipo de Evento (Color) */}
          <div>
            <label className="block text-sm font-medium mb-1">Color del Evento</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(EVENT_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEventType(key as keyof typeof EVENT_TYPES)}
                  className={`p-3 rounded-lg transition-colors ${
                    eventType === key ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{ 
                    backgroundColor: value.color,
                    opacity: eventType === key ? 1 : 0.6
                  }}
                />
              ))}
            </div>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-sm font-medium mb-1">Hora</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClasses}`}
              required
            />
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
};
// Estilos para el modo oscuro
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

// Componente Principal
const DashboardHome: React.FC = () => {
  // Estados
  const [events, setEvents] = useState<Event[]>([]);
  const [hiddenEvents, setHiddenEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; } | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  // Hooks de contexto
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Efectos
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
    
    const styleElement = document.createElement('style');
    styleElement.textContent = calendarDarkStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Manejadores de eventos
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
      const formattedEvents = data.map((event: any) => ({
        ...event,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        type: event.type in EVENT_TYPES ? event.type : 'OTHER'
      }));
      
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

  const handleEventDrop = async ({ event, start, end }: EventInteractionArgs<Event>) => {
    try {
      const eventToSend = {
        title: event.title,
        description: event.description,
        start_date: start.toString(),
        end_date: end.toString(),
        participants: event.participants,
        room: event.room,
        type: event.type
      };
  
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
  
  const handleEventResize = async (args: EventInteractionArgs<Event>) => {
    try {
      await handleEventDrop(args);
    } catch (error) {
      console.error('Error resizing event:', error);
    }
  };

  const handleEventCreate = async (eventsToCreate: Omit<Event, 'id'>[]) => {
    try {
      const eventToSend = {
        title: eventsToCreate[0].title,
        description: eventsToCreate[0].description,
        start: eventsToCreate[0].start.toISOString(),
        end: eventsToCreate[0].end.toISOString(),
        participants: eventsToCreate[0].participants,
        room: eventsToCreate[0].room,
        type: eventsToCreate[0].type
      };

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
      const formattedEvent = {
        ...newEvent,
        id: newEvent.id,
        start: new Date(newEvent.start_date || newEvent.start),
        end: new Date(newEvent.end_date || newEvent.end),
        type: eventToSend.type,
        participants: newEvent.participants || eventsToCreate[0].participants
      };

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
        start_date: eventData.start.toISOString(),
        end_date: eventData.end.toISOString(),
        participants: eventData.participants,
        room: eventData.room,
        type: eventData.type
      };

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
      if (newFilters.room !== 'all' && event.room !== newFilters.room) return false;
      if (newFilters.participant !== 'all' && 
          !event.participants.some(p => p.email === newFilters.participant)) return false;
      if (newFilters.type !== 'all' && event.type !== newFilters.type) return false;
      return true;
    });

    setFilteredEvents(filtered);
  };

  // Renderizado condicional para loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
      </div>
    );
  }

  // Render principal
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
  startAccessor={(event) => new Date((event as Event).start)}
  endAccessor={(event) => new Date((event as Event).end)}
  selectable
  resizable
  onEventDrop={(args) => handleEventDrop(args as EventInteractionArgs<Event>)}
  onEventResize={(args) => handleEventResize(args as EventInteractionArgs<Event>)}
  onSelectSlot={handleSelectSlot}
  onSelectEvent={(event, e) => handleSelectEvent(event as Event, e)}
  views={['month']}
  defaultView="month"
  components={{
    event: ({ event }) => <EventComponent event={event as Event} user={user} />,
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
  eventPropGetter={(event) => ({
    style: {
      backgroundColor: 'transparent',
      border: 'none'
    }
  })}
  slotPropGetter={(date) => ({
    style: {
      minHeight: '120px'
    }
  })}
/>

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
          events={filteredEvents}
          hiddenEvents={hiddenEvents}
          isOpen={isDetailsModalOpen}
          onSelectEvent={setSelectedEvent}
          onOpenDetailsModal={() => setIsDetailsModalOpen(true)}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedEvent(null);
            setHiddenEvents([]);
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
  
};


export default DashboardHome;