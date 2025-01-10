import { Event, DayEvents } from '../types/calendar';

export const exportToJSON = (events: DayEvents, month: string): void => {
  const dataStr = JSON.stringify(events, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.download = `calendar-events-${month}.json`;
  link.href = url;
  link.click();
};

export const exportToCSV = (events: DayEvents, month: string): void => {
  const rows = [['Date', 'Event Name', 'Start Time', 'End Time', 'Category', 'Description']];
  
  Object.entries(events).forEach(([date, dayEvents]) => {
    dayEvents.forEach((event) => {
      rows.push([
        date,
        event.name,
        event.startTime,
        event.endTime,
        event.category,
        event.description || ''
      ]);
    });
  });

  const csvContent = rows.map(row => row.join(',')).join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.download = `calendar-events-${month}.csv`;
  link.href = url;
  link.click();
};
