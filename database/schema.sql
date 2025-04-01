-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed (be careful in production!)
DROP TABLE IF EXISTS public.event_audit_log;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.user_profiles;

-- Create user_profiles table with enhanced fields
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    theme_preference TEXT DEFAULT 'dark',
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
    calendar_settings JSONB DEFAULT '{"default_view": "month", "week_starts_on": "Sunday"}'::jsonb,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create events table with enhanced features
CREATE TABLE public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    location TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    reminders JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    color TEXT,
    status TEXT DEFAULT 'active',
    shared_with UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create event audit log table
CREATE TABLE public.event_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.user_profiles;

-- Reset user_profiles policies
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.user_profiles;

-- Update policies for user_profiles
DROP POLICY IF EXISTS "Enable read access for users own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert access for users own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update access for users own profile" ON public.user_profiles;

-- Create comprehensive policy for user_profiles
CREATE POLICY "Enable all operations for users own profile"
ON public.user_profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure proper permissions are granted
GRANT ALL ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Reset RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Ensure proper permissions
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_profiles TO authenticated;

-- Grant necessary permissions
GRANT usage ON schema public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, timezone)
    VALUES (
        NEW.id,
        SPLIT_PART(NEW.email, '@', 1),
        'UTC'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the table exists and has the correct structure
ALTER TABLE public.user_profiles ALTER COLUMN updated_at 
SET DEFAULT timezone('utc'::text, now());

ALTER TABLE public.user_profiles ALTER COLUMN created_at 
SET DEFAULT timezone('utc'::text, now());

-- Create policies for events
CREATE POLICY "Users can view own and shared events" ON public.events
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        auth.uid() = ANY(shared_with)
    );

-- Drop existing event policies
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;

-- Create updated policy for event insertion
CREATE POLICY "Users can insert own events"
ON public.events
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND user_id IS NOT NULL
);

CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON public.events
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions for events table
GRANT ALL ON public.events TO authenticated;

-- Reset RLS for events table
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for audit log
CREATE POLICY "Users can view own event audit logs" ON public.event_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_shared_with ON public.events USING gin(shared_with);
CREATE INDEX IF NOT EXISTS idx_event_audit_event_id ON public.event_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_event_audit_user_id ON public.event_audit_log(user_id);

-- Create bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies first
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Add storage policy for updates and deletes
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() = owner);
