"use client";

import React from "react";
import { Calendar } from "../components/Calendar";

const CalendarPage = () => {
  return (
    <main>
      <div className="container mx-auto px-4 py-8 text-center bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-5xl font-bold mb-4 text-indigo-400">Planisphere</h1>
        <blockquote className="italic mb-8 text-lg">"Your future is scheduled here."</blockquote>
        <div>
          <Calendar />
        </div>
      </div>
    </main>
  );
};

export default CalendarPage;
