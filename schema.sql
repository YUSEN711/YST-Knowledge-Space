-- Copy and paste this into the Supabase SQL Editor and click RUN.

-- 1. Create Articles Table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  author TEXT NOT NULL,
  content TEXT,
  key_points TEXT,
  conclusion TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Users Profile Table
CREATE TABLE user_profiles (
  username TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'USER',
  saved_articles UUID[] DEFAULT '{}',
  read_articles UUID[] DEFAULT '{}'
);

-- 3. Enable Realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE articles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
