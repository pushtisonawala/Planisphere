"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const storedEvents = localStorage.getItem("calendarEvents");
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClickAction = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    if (selectedDate) {
      setShowModal(true);
    }
  };

  const handleSaveEventAction = (event: Event) => {
    if (selectedDate) {
      const dateKey = formatDate(selectedDate);
      const updatedEvents = { ...events };
      if (!updatedEvents[dateKey]) {
        updatedEvents[dateKey] = [];
      }
      updatedEvents[dateKey].push(event);
      setEvents(updatedEvents);
      setShowModal(false);
    }
  };

  const handleDeleteEventAction = (eventId: string) => {
    if (selectedDate) {
      const dateKey = formatDate(selectedDate);
      const updatedEvents = { ...events };
      updatedEvents[dateKey] = updatedEvents[dateKey].filter((e) => e.id !== eventId);
      setEvents(updatedEvents);
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
        </div>
        <CalendarGrid
          currentDate={currentDate}
          onDayClickAction={handleDayClickAction}
          events={events}
        />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {selectedDate && (
          <div className="mt-6 max-w-4xl w-full bg-gray-800 rounded-lg shadow-lg p-6">
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
