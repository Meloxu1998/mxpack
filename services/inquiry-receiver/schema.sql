CREATE TABLE IF NOT EXISTS inquiries (
  request_key TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  contact_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0,
  lease_token TEXT,
  provider_message_id TEXT,
  last_error_code TEXT,
  accepted_at INTEGER
);
CREATE INDEX IF NOT EXISTS inquiries_created ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS inquiries_ip_created ON inquiries(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS inquiries_contact_created ON inquiries(contact_hash, created_at);
CREATE INDEX IF NOT EXISTS inquiries_retry ON inquiries(notification_status, next_attempt_at);
