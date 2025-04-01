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
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No authenticated user');

        const { data, error: insertError } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            date: formatDate(selectedDate),
            name: event.name,
            start_time: event.startTime,
            end_time: event.endTime,
            description: event.description,
            category: event.category,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update local state with new event
        if (data) {
          const newEvents = { ...events };
          const dateKey = formatDate(selectedDate);
          if (!newEvents[dateKey]) {
            newEvents[dateKey] = [];
          }
          newEvents[dateKey].push({
            id: data.id,
            name: data.name,
            startTime: data.start_time,
            endTime: data.end_time,
            description: data.description,
            category: data.category,
          });
          setEvents(newEvents);
        }

        setShowModal(false);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Error saving event:', error);
        alert(error instanceof Error ? error.message : 'Failed to save event');
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
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Skip if dropped in same location
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      setSyncStatus('syncing');
      
      const sourceDate = source.droppableId;
      const destDate = destination.droppableId;
      const updatedEvents = { ...events };

      // Get the event being moved
      const [movedEvent] = updatedEvents[sourceDate].splice(source.index, 1);

      // Ensure destination array exists
      if (!updatedEvents[destDate]) {
        updatedEvents[destDate] = [];
      }

      // Insert at new position
      updatedEvents[destDate].splice(destination.index, 0, movedEvent);

      setEvents(updatedEvents);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error during drag and drop:', error);
      setSyncStatus('error');
    }
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
    <div className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                ← Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                Next →
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => handleExport('json')} className="bg-indigo-600/80 hover:bg-indigo-500">
                Export JSON
              </Button>
              <Button size="sm" onClick={() => handleExport('csv')} className="bg-purple-600/80 hover:bg-purple-500">
                Export CSV
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-400 text-center">
          {syncStatus === 'syncing' && (
            <span className="animate-pulse flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
              Syncing...
            </span>
          )}
          {syncStatus === 'error' && 'Sync error'}
        </div>
      </div>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="p-6">
          <CalendarGrid
            currentDate={currentDate}
            onDayClickAction={handleDayClickAction}
            events={events}
            selectedDate={selectedDate}
          />
        </div>

        {/* Selected Day Events */}
        {selectedDate && (
          <div 
            ref={eventSectionRef}
            className="border-t border-gray-700/50 bg-gray-800/30 p-6 backdrop-blur-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Events for {selectedDate.toDateString()}
              </h3>
              <Button 
                onClick={handleAddEvent}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                Add Event
              </Button>
            </div>
            <EventList
              events={events[formatDate(selectedDate)] || []}
              onDeleteEventAction={handleDeleteEventAction}
              date={formatDate(selectedDate)}
            />
          </div>
        )}
      </DragDropContext>

      {/* Event Modal */}
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
