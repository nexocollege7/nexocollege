ALTER TABLE schools ADD COLUMN IF NOT EXISTS suspended_at timestamptz DEFAULT NULL;
