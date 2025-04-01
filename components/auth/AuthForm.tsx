"use client";

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          // Successfully logged in
          window.location.reload(); // This will trigger the app to show Calendar
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });

        if (error) {
          throw error;
        }

        if (data.user?.identities?.length === 0) {
          setMessage('An account with this email already exists.');
        } else {
          setMessage('Check your email for the confirmation link!');
          // Clear form
          setEmail('');
          setPassword('');
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('An error occurred during authentication.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-indigo-400 mb-6">
          {isLogin ? 'Login' : 'Sign Up'} to Planisphere
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 text-white"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700 text-white"
            required
          />
          <Button type="submit" className="w-full">
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>
        {message && (
          <p className="mt-4 text-sm text-indigo-400">{message}</p>
        )}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-sm text-indigo-400 hover:underline"
        >
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};
