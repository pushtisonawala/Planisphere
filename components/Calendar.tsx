"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../utils/supabase";
import { CalendarGrid } from "./CalendarGrid";
import { EventModal } from "./EventModal";
import { EventList } from "./EventList";
import { formatDate } from "../utils/dateUtils";
import { Event, DayEvents } from "../types/calendar";
import { Button } from "./ui/button";
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { exportToJSON, exportToCSV } from '../utils/exportUtils';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<DayEvents>({});
  const [showModal, setShowModal] = useState(false);
  const eventSectionRef = useRef<HTMLDivElement>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setSyncStatus('syncing');
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const eventsByDate = events?.reduce((acc: DayEvents, event) => {
          if (!acc[event.date]) {
            acc[event.date] = [];
          }
          acc[event.date].push({
            id: event.id,
            name: event.name,
            startTime: event.start_time,
            endTime: event.end_time,
            description: event.description,
            category: event.category,
          });
          return acc;
        }, {});

        setEvents(eventsByDate || {});
        setSyncStatus('synced');
      } catch (error) {
        console.error('Error loading events:', error);
        setSyncStatus('error');
      }
    };

    loadEvents();

    const channel = supabase
      .channel('events_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'events' 
        }, 
        payload => {
          loadEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClickAction = (date: Date) => {
    setSelectedDate(date);
    setTimeout(() => {
      eventSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleAddEvent = () => {
    if (selectedDate) {
      setShowModal(true);
    }
  };

  const handleSaveEventAction = async (event: Event) => {
    if (selectedDate) {
      try {
        setSyncStatus('syncing');
        const { error } = await supabase
          .from('events')
          .insert({
            date: formatDate(selectedDate),
            name: event.name,
            start_time: event.startTime,
            end_time: event.endTime,
            description: event.description,
            category: event.category,
          });

        if (error) throw error;
        setShowModal(false);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Error saving event:', error);
        setSyncStatus('error');
      }
    }
  };

  const handleDeleteEventAction = async (eventId: string) => {
    try {
      setSyncStatus('syncing');
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error deleting event:', error);
      setSyncStatus('error');
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.type !== "EVENT") return;

    const sourceDate = result.source.droppableId;
    const destDate = result.destination.droppableId;
    
    if (sourceDate === destDate) return;

    const updatedEvents = { ...events };
    const sourceEvents = [...(updatedEvents[sourceDate] || [])];
    const [movedEvent] = sourceEvents.splice(result.source.index, 1);

    if (!updatedEvents[destDate]) {
      updatedEvents[destDate] = [];
    }
    
    updatedEvents[sourceDate] = sourceEvents;
    updatedEvents[destDate] = [
      ...updatedEvents[destDate],
      movedEvent
    ];

    setEvents(updatedEvents);
  };

  const handleExport = (format: 'json' | 'csv') => {
    const month = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (format === 'json') {
      exportToJSON(events, month);
    } else {
      exportToCSV(events, month);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h1 className="text-3xl font-bold text-indigo-300">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h1>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={handlePrevMonth}>
              Previous
            </Button>
            <Button variant="outline" onClick={handleNextMonth}>
              Next
            </Button>
            <Button onClick={() => handleExport('json')}>Export JSON</Button>
            <Button onClick={() => handleExport('csv')}>Export CSV</Button>
          </div>
          <div className="text-sm text-gray-400">
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'error' && 'Sync error'}
          </div>
        </div>
        <CalendarGrid
          currentDate={currentDate}
          onDayClickAction={handleDayClickAction}
          events={events}
          selectedDate={selectedDate}
        />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {selectedDate && (
          <div 
            ref={eventSectionRef}
            className="mt-6 max-w-4xl w-full bg-gray-800 rounded-lg shadow-lg p-6 scroll-mt-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-indigo-300">
                Events for {selectedDate.toDateString()}
              </h2>
              <Button onClick={handleAddEvent}>Add Event</Button>
            </div>
            <EventList
              events={events[formatDate(selectedDate)] || []}
              onDeleteEventAction={handleDeleteEventAction}
              date={formatDate(selectedDate)}
            />
          </div>
        )}
      </DragDropContext>

      {showModal && selectedDate && (
        <EventModal
          onCloseAction={() => setShowModal(false)}
          onSaveAction={handleSaveEventAction}
          date={selectedDate}
        />
      )}
    </div>
  );
};
