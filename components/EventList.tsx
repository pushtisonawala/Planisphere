// EventList.tsx
"use client";
import React from "react";
import { Event } from "../types/calendar";
import { Button } from "./ui/button";
import { Droppable, Draggable } from 'react-beautiful-dnd';

const categoryColors = {
  work: 'bg-blue-600',
  personal: 'bg-green-600',
  other: 'bg-purple-600'
};

interface EventListProps {
  events: Event[];
  onDeleteEventAction: (eventId: string) => void;
  date: string;
}

export const EventList: React.FC<EventListProps> = ({ events, onDeleteEventAction, date }) => {
  return (
    <Droppable 
      droppableId={date} 
      type="EVENT"
      isDropDisabled={false}
      isCombineEnabled={false}
      ignoreContainerClipping={false}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="space-y-2 min-h-[50px]"
        >
          {events.length === 0 ? (
            <div className="text-gray-400 text-center">No events for this day.</div>
          ) : (
            events.map((event, index) => (
              <Draggable key={event.id} draggableId={event.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${categoryColors[event.category]} bg-opacity-20 p-4 rounded-lg shadow
                      ${snapshot.isDragging ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-white">
                        <h3 className="font-semibold text-lg">{event.name}</h3>
                        <p className="text-gray-300 text-sm">{event.startTime} to {event.endTime}</p>
                        {event.description && (
                          <p className="text-gray-400 mt-2 text-sm">{event.description}</p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => onDeleteEventAction(event.id)}
                        className="ml-4"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};