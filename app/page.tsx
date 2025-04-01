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
    <main>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-5xl font-bold text-indigo-400">Planisphere</h1>
            <Button 
              variant="outline" 
              onClick={() => supabase.auth.signOut()}
              className="text-indigo-400"
            >
              Sign Out
            </Button>
          </div>
          <Profile />
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <Calendar />
        </div>
      </div>
    </main>
  );
};

export default CalendarPage;
