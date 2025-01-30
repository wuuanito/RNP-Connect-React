// types.ts
export const EVENT_TYPES = {
    MEETING: { label: 'Reunión', color: '#4F46E5', icon: '🤝' },
    TRAINING: { label: 'Capacitación', color: '#7C3AED', icon: '📚' },
    PRESENTATION: { label: 'Presentación', color: '#EC4899', icon: '📊' },
    WORKSHOP: { label: 'Taller', color: '#EF4444', icon: '🛠️' },
    OTHER: { label: 'Otro', color: '#10B981', icon: '📌' }
  } as const;
  
  export const EVENT_STATUSES = {
    pending: { label: 'Pendiente', color: '#FCD34D' },
    accepted: { label: 'Aceptado', color: '#34D399' },
    declined: { label: 'Rechazado', color: '#EF4444' }
  } as const;
  
  export interface Event {
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
  
  export interface DragEvent {
    event: Event;
    start: Date;
    end: Date;
  }
  
  export interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (events: Omit<Event, 'id'>[]) => Promise<void>;
    startDates?: Date[];
    endDates?: Date[];
    initialData?: Partial<Event>;
    isDarkMode: boolean;
  }
  
  export interface CalendarFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    events: Event[];
    currentUserEmail: string;
  }
  
  export interface FilterState {
    status: 'all' | keyof typeof EVENT_STATUSES;
    room: string;
    participant: string;
    type: 'all' | keyof typeof EVENT_TYPES;
  }
  
  export interface EventComponentProps {
    event: Event;
    user: { email: string } | null;
  }
  
  export interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
  }
  
  export interface LegendProps {
    isDarkMode: boolean;
  }
  
  export interface EventDetailsModalProps {
    event: Event;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    currentUserEmail: string;
    isDarkMode: boolean;
  }