-- Fresh, isolated staging database only. No production migration.
CREATE TABLE IF NOT EXISTS applications (
 id TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
 phone TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('music','dance','acting','comedy','sport','magic','other')),
 object_key TEXT NOT NULL CHECK(object_key LIKE 'applications/%'), sha256 TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL,
 agreement_version TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','invited','filmed','published')),
 notification TEXT NOT NULL DEFAULT 'pending', contacted INTEGER NOT NULL DEFAULT 0, reviewed_at TEXT,
 invitation_at TEXT, invitation_note TEXT
);
CREATE TABLE IF NOT EXISTS official_performances (
 id TEXT PRIMARY KEY, application_id TEXT NOT NULL UNIQUE REFERENCES applications(id),
 object_key TEXT NOT NULL UNIQUE CHECK(object_key LIKE 'official/%'), sha256 TEXT NOT NULL,
 mime TEXT NOT NULL CHECK(mime IN ('video/mp4','video/webm')), bytes INTEGER NOT NULL,
 display_name TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, published_at TEXT,
 CHECK(status!='published' OR (display_name IS NOT NULL AND published_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS votes (
 performance_id TEXT NOT NULL REFERENCES official_performances(id), voter_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(performance_id,voter_hash)
);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status,created_at);
