-- Create the actors table
CREATE TABLE IF NOT EXISTS actors (
  id TEXT PRIMARY KEY,
  publicKey TEXT
);

-- Create the followRequest table
CREATE TABLE IF NOT EXISTS followRequest (
  id TEXT PRIMARY KEY,
  actor TEXT,
  object TEXT
);