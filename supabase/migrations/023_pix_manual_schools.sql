ALTER TABLE schools
  ADD COLUMN pix_key TEXT,
  ADD COLUMN pix_holder_name TEXT,
  ADD COLUMN whatsapp_contact TEXT,
  ADD COLUMN pending_expiration_days INTEGER NOT NULL DEFAULT 7;
