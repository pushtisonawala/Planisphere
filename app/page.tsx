"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "../components/Calendar";
import { AuthForm } from "../components/auth/AuthForm";
import { Button } from "../components/ui/button"; // Fix the import path
import { supabase } from "../utils/supabase";
import { Profile } from "../components/Profile";

const CalendarPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-indigo-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-[1400px]">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-center bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Planisphere
            </h1>
            <p className="text-gray-400 mt-2">Your future is scheduled here.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => supabase.auth.signOut()}
            className="text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
          >
            Sign Out
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Profile */}
          <div className="lg:col-span-1 space-y-6">
            <Profile />
            <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-indigo-400 mb-4">Quick Stats</h2>
              {/* Add quick statistics here */}
            </div>
          </div>

          {/* Calendar Section */}
          <div className="lg:col-span-3">
            <div className="transition-all duration-300 hover:ring-2 hover:ring-indigo-500/20 rounded-lg">
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CalendarPage;
