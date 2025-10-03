-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('teacher', 'parent', 'healthcare_worker', 'athlete');

-- Create enum for health conditions
CREATE TYPE public.health_condition AS ENUM ('asthma', 'children', 'elderly', 'heart_condition', 'none');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  health_conditions health_condition[] DEFAULT '{}',
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, health_conditions)
  VALUES (
    new.id,
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'parent'),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'health_conditions'))::health_condition[],
      '{}'::health_condition[]
    )
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create air quality readings table (for Arduino data in future)
CREATE TABLE public.air_quality_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  aqi INTEGER,
  pm25 DECIMAL(10, 2),
  pm10 DECIMAL(10, 2),
  no2 DECIMAL(10, 2),
  o3 DECIMAL(10, 2),
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  source TEXT NOT NULL, -- 'nasa', 'openaq', 'arduino', 'weather_api'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on readings
ALTER TABLE public.air_quality_readings ENABLE ROW LEVEL SECURITY;

-- Readings policies (public read for aggregated data)
CREATE POLICY "Anyone can view readings"
  ON public.air_quality_readings
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert readings"
  ON public.air_quality_readings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);