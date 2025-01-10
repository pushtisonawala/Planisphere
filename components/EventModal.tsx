"use client";

import React, { useState } from "react";
import { Event, EventCategory } from "../types/calendar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface EventModalProps {
  onCloseAction: () => void;
  onSaveAction: (event: Event) => void;
  date: Date;
}

export const EventModal: React.FC<EventModalProps> = ({ onCloseAction, onSaveAction, date }) => {
  const [eventName, setEventName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("other");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSaveAction({
      id: Date.now().toString(),
      name: eventName,
      startTime,
      endTime,
      description,
      category,
    });
    setEventName("");
    setStartTime("");
    setEndTime("");
    setDescription("");
    setCategory("other");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold text-indigo-300 mb-4">
          Add Event for {date.toDateString()}
        </h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
            required
          />
          <div className="flex space-x-2 mb-4">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-1/2 p-2 bg-gray-700 text-white rounded"
              required
            />
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-1/2 p-2 bg-gray-700 text-white rounded"
              required
            />
          </div>
          <Textarea
            placeholder="Event Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-700 text-white rounded resize-none h-24"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </select>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
            <Button type="submit">Save Event</Button>
          </div>
        </form>
      </div>
    </div>
  );
};