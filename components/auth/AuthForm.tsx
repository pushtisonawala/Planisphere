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
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url('https://source.unsplash.com/random/1920x1080/?galaxy,nebula,space')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Animated Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-indigo-900/80 to-purple-900/90 animate-gradient-xy" />
      
      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20">
        {/* Logo Section */}
        <div className="text-center space-y-3 mb-8">
          <div className="text-5xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent animate-text">
            Planisphere
          </div>
          <p className="text-gray-300 text-sm">Your future is scheduled here.</p>
        </div>

        {/* Form Header */}
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400
                         focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400
                         focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 
                     hover:to-purple-600 text-white font-medium py-2.5 rounded-lg transition-all 
                     duration-300 transform hover:scale-[1.02] hover:shadow-lg"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm animate-fade-in ${
            message.includes('error') 
              ? 'bg-red-500/20 text-red-200 border border-red-500/20' 
              : 'bg-green-500/20 text-green-200 border border-green-500/20'
          }`}>
            {message}
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900/50 text-gray-400 backdrop-blur-sm">or</span>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
        >
          {isLogin ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </div>

      {/* Animated Stars */}
      <div className="stars" />
      <div className="stars2" />
      <div className="stars3" />
    </div>
  );
};
