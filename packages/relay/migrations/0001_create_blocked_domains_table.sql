-- Create the domainRules table
CREATE TABLE IF NOT EXISTS domainRules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,
  is_regex INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  reason TEXT
);

-- Create the settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default domain block mode
INSERT INTO settings (key, value) VALUES ('domain_block_mode', 'blacklist');

-- Insert default auto-approve mode (false = manual approval required)
INSERT INTO settings (key, value) VALUES ('auto_approve_follows', 'false');
