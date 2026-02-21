-- Copy and paste this into the Supabase SQL Editor and click RUN.

-- 1. Create Users Profile Table (Linked to auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'USER',
  saved_articles UUID[] DEFAULT '{}',
  read_articles UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Articles Table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL, -- Fallback display name
  content TEXT,
  key_points TEXT,
  conclusion TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_profiles
-- Anyone can read user profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON user_profiles FOR SELECT
  USING ( true );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile."
  ON user_profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 5. RLS Policies for articles
-- Anyone can read articles
CREATE POLICY "Articles are viewable by everyone."
  ON articles FOR SELECT
  USING ( true );

-- Authenticated users can insert articles
CREATE POLICY "Authenticated users can insert articles."
  ON articles FOR INSERT
  WITH CHECK ( auth.uid() = author_id );

-- Authors or Admins can update articles (used for soft delete as well)
CREATE POLICY "Authors and Admins can update articles."
  ON articles FOR UPDATE
  USING (
    auth.uid() = author_id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Only Admins can permanently delete articles
CREATE POLICY "Only Admins can hard delete articles."
  ON articles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 6. Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  new_username text;
  counter integer := 0;
  assigned_role text := 'USER';
BEGIN
  -- Extract base name from email
  base_username := split_part(new.email, '@', 1);
  new_username := base_username;
  
  -- If email is jason, assign ADMIN role
  IF lower(new.email) = 'jason900711@gmail.com' THEN
    assigned_role := 'ADMIN';
  END IF;

  -- Ensure username is unique
  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter;
  END LOOP;

  INSERT INTO public.user_profiles (id, username, name, avatar, role)
  VALUES (
    new.id,
    new_username,
    new_username,
    'https://ui-avatars.com/api/?name=' || new_username || '&background=random',
    assigned_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Enable Realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE articles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
