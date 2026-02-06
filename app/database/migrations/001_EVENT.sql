ALTER TABLE ctfs ADD COLUMN name TEXT NOT NULL DEFAULT 'New Event';
ALTER TABLE ctfs ADD COLUMN start_time TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE ctfs ADD COLUMN end_time TIMESTAMP NOT NULL DEFAULT (NOW() + interval '24 hours');
ALTER TABLE ctfs ADD COLUMN deleted_at TIMESTAMP NOT NULL DEFAULT NULL;
ALTER TABLE ctfs ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN 'draft', 'published', 'active', 'finished', 'archived')
