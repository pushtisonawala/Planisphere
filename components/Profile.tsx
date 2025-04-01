"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { UserProfile } from '../types/profile';
import { Button } from './ui/button';
import { Input } from './ui/input';

const DEFAULT_AVATAR = 'https://t4.ftcdn.net/jpg/05/89/93/27/360_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.jpg';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First try to get the profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If profile doesn't exist, create one
      if (!existingProfile) {
        const newProfile = {
          id: user.id,
          display_name: user.email?.split('@')[0] || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          avatar_url: null,
          theme_preference: 'dark' as const
        };

        const { data: insertedProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (insertedProfile) {
          setProfile(insertedProfile);
          setDisplayName(insertedProfile.display_name || '');
          setTimezone(insertedProfile.timezone);
          setAvatarUrl(insertedProfile.avatar_url);
        }
      } else {
        // Profile exists, use it
        setProfile(existingProfile);
        setDisplayName(existingProfile.display_name || '');
        setTimezone(existingProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
        setAvatarUrl(existingProfile.avatar_url);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile. Please try refreshing the page.');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Failed to check profile: ${checkError.message}`);
      }

      let result;
      const profileData = {
        id: user.id, // Important: include the id for update
        display_name: displayName.trim(),
        timezone,
        avatar_url: avatarUrl,
        theme_preference: profile?.theme_preference || 'dark',
        updated_at: new Date().toISOString()
      };

      if (!existingProfile) {
        // Insert new profile
        result = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select('*')
          .single();
      } else {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', user.id)
          .select('*')
          .single();
      }

      if (result.error) {
        console.error('Database operation failed:', result.error);
        throw new Error(result.error.message);
      }

      if (result.data) {
        setProfile(result.data);
        setIsEditing(false);
        console.log('Profile updated successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      console.error('Profile update error:', error);
      alert(errorMessage);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Profile Header */}
      <div className="relative h-24 bg-gradient-to-r from-indigo-600/30 to-purple-600/30">
        <div className="absolute -bottom-10 left-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full border-4 border-gray-800 overflow-hidden bg-gray-700">
              <img
                src={avatarUrl || DEFAULT_AVATAR}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
            </div>
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-white text-xs">Change</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="pt-12 p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-indigo-300">
                {profile?.display_name || 'User Profile'}
              </h2>
              <p className="text-gray-400 text-sm">{profile?.timezone}</p>
            </div>
            {!isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="text-sm"
              >
                Edit Profile
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Display Name</label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="w-full bg-gray-700/50 border-gray-600/50 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-2 bg-gray-700/50 border border-gray-600/50 text-white rounded focus:ring-1 focus:ring-indigo-500"
                >
                  {Intl.supportedValuesOf('timeZone').map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button 
                  onClick={handleUpdateProfile}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-700/50 mt-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Account Type</p>
                  <p className="text-indigo-300">Free Plan</p>
                </div>
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Events Created</p>
                  <p className="text-indigo-300">0</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
