/*
  # Fix duplicate policies

  This migration checks if tables and policies exist before creating them to avoid errors.
  
  1. Tables
    - `game_sessions` - Game session data and settings
    - `players` - Player information and stats
    - `flags` - Flag locations and capture status
  
  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
  
  3. Performance
    - Add indexes for frequently queried columns
*/

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  position JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  captured_by TEXT,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (if not already enabled)
DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE players ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE flags ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create policies for game_sessions (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Anyone can create game sessions'
  ) THEN
    CREATE POLICY "Anyone can create game sessions"
      ON game_sessions
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Anyone can read game sessions'
  ) THEN
    CREATE POLICY "Anyone can read game sessions"
      ON game_sessions
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Anyone can update game sessions'
  ) THEN
    CREATE POLICY "Anyone can update game sessions"
      ON game_sessions
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create policies for players (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Anyone can create players'
  ) THEN
    CREATE POLICY "Anyone can create players"
      ON players
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Anyone can read players'
  ) THEN
    CREATE POLICY "Anyone can read players"
      ON players
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Anyone can update players'
  ) THEN
    CREATE POLICY "Anyone can update players"
      ON players
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create policies for flags (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flags' AND policyname = 'Anyone can create flags'
  ) THEN
    CREATE POLICY "Anyone can create flags"
      ON flags
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flags' AND policyname = 'Anyone can read flags'
  ) THEN
    CREATE POLICY "Anyone can read flags"
      ON flags
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flags' AND policyname = 'Anyone can update flags'
  ) THEN
    CREATE POLICY "Anyone can update flags"
      ON flags
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS players_session_id_idx ON players(session_id);
CREATE INDEX IF NOT EXISTS flags_session_id_idx ON flags(session_id);
CREATE INDEX IF NOT EXISTS flags_status_idx ON flags(status);