"use client";

import React from "react";
import { DayEvents } from "../types/calendar";
import { getMonthData, formatDate } from "../utils/dateUtils";

interface CalendarGridProps {
  currentDate: Date;
  onDayClickAction: (date: Date) => void;
  events: DayEvents;
  selectedDate: Date | null;  // Add this prop
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  onDayClickAction,
  events,
  selectedDate,
}) => {
  const monthData = getMonthData(currentDate.getFullYear(), currentDate.getMonth());
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  monthData.forEach((date) => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="w-full bg-gray-900 text-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800">
            {weekdays.map((day) => (
              <th
                key={day}
                className="border border-gray-700 p-2 text-gray-300 text-center text-sm font-medium"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => {
                const isToday = date && date.toDateString() === new Date().toDateString();
                const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
                const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();
                const dateEvents = date ? events[formatDate(date)] || [] : [];

                return (
                  <td
                    key={dayIndex}
                    onClick={() => date && onDayClickAction(date)}
                    className={`
                      relative border border-gray-700 p-2 
                      transition-all duration-300 ease-in-out
                      ${date ? "cursor-pointer" : "bg-gray-800"}
                      ${isCurrentMonth ? "" : "text-gray-500"}
                      ${isToday ? "bg-indigo-500/20" : ""}
                      ${isSelected ? "transform scale-[0.97] bg-indigo-600/30" : "hover:bg-gray-700/50"}
                      ${isSelected ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-gray-900" : ""}
                      ${isSelected ? "shadow-lg shadow-indigo-500/30" : ""}
                    `}
                    style={{ height: "100px", width: "14.28%" }}
                  >
                    <div className={`
                      flex justify-end mb-1
                      ${isSelected ? "font-bold text-indigo-200" : "text-gray-300"}
                    `}>
                      {date?.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dateEvents.slice(0, 2).map((event, i) => (
                        <div
                          key={i}
                          className="text-xs bg-indigo-600 text-white p-1 rounded truncate shadow-sm"
                        >
                          {event.startTime.slice(0, 5)} {event.name}
                        </div>
                      ))}
                      {dateEvents.length > 2 && (
                        <div className="text-xs text-indigo-300">
                          +{dateEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};