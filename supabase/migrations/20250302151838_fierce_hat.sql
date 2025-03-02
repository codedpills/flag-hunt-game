/*
  # Create game tables for Flag Hunt

  1. New Tables
    - `game_sessions` - Stores game session data
      - `id` (text, primary key)
      - `created_at` (timestamptz)
      - `settings` (jsonb)
      - `status` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
    - `players` - Stores player data
      - `id` (text, primary key)
      - `session_id` (text, foreign key)
      - `nickname` (text)
      - `avatar` (text)
      - `position` (jsonb)
      - `score` (integer)
      - `status` (text)
      - `created_at` (timestamptz)
    - `flags` - Stores flag data
      - `id` (text, primary key)
      - `session_id` (text, foreign key)
      - `position` (jsonb)
      - `status` (text)
      - `captured_by` (text, nullable)
      - `captured_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
*/

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
);

-- Create players table
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

-- Create flags table
CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  position JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  captured_by TEXT,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

-- Create policies for game_sessions
CREATE POLICY "Anyone can create game sessions"
  ON game_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read game sessions"
  ON game_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update game sessions"
  ON game_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for players
CREATE POLICY "Anyone can create players"
  ON players
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read players"
  ON players
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update players"
  ON players
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for flags
CREATE POLICY "Anyone can create flags"
  ON flags
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read flags"
  ON flags
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update flags"
  ON flags
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS players_session_id_idx ON players(session_id);
CREATE INDEX IF NOT EXISTS flags_session_id_idx ON flags(session_id);
CREATE INDEX IF NOT EXISTS flags_status_idx ON flags(status);