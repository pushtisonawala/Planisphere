export type EventCategory = 'work' | 'personal' | 'other';

export interface Event {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  category: EventCategory;
}

export interface DayEvents {
  [date: string]: Event[];
}
