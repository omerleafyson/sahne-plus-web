CREATE TABLE IF NOT EXISTS applications (
 id TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
 phone TEXT NOT NULL, object_key TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL,
 agreement_version TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','published')),
 display_name TEXT, notification TEXT NOT NULL DEFAULT 'pending',
 contacted INTEGER NOT NULL DEFAULT 0, reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS votes (
 application_id TEXT NOT NULL REFERENCES applications(id), voter_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(application_id,voter_hash)
);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status,created_at);
