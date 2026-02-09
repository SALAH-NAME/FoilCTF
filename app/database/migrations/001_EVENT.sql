--- ctfs table
ALTER TABLE ctfs ADD COLUMN name TEXT NOT NULL DEFAULT 'New Event';
ALTER TABLE ctfs ADD COLUMN start_time TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE ctfs ADD COLUMN end_time TIMESTAMP NOT NULL DEFAULT (now() + interval '24 hours');
ALTER TABLE ctfs ADD COLUMN deleted_at TIMESTAMP NOT NULL DEFAULT NULL;
ALTER TABLE ctfs ADD COLUMN max_teams TIMESTAMP NOT NULL DEFAULT NULL CHECK(max_teams > 0);
ALTER TABLE ctfs ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN 'draft', 'published', 'active', 'ended', 'archived');

---participations table
ALTER TABLE participations RENAME COLUMN challenge_id TO ctf_id;
ALTER TABLE participations ADD COLUMN joined_at TIMESTAMP NOT NULL DEFAULT NOW();

--- teams table
-- ALTER TABLE teams ADD COLUMN name TEXT NOT NULL;
ALTER TABLE teams ADD COLUMN team_size INTEGER NOT NULL DEFAULT 0;

--- solves table
CREATE TABLE IF NOT EXISTS solves (
    id          SERIAL PRIMARY KEY,
    ctf_id      INTEGER NOT NULL,
    team_id     INTEGER NOT NULL,
    chall_id    INTEGER NOT NULL,
    score      INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,

    CONSTRAINT unique_team_solve UNIQUE(ctf_id, team_id, chall_id),
    CONSTRAINT constraint_ctf FOREIGN KEY (ctf_id) REFERENCES ctfs(id),
    CONSTRAINT constraint_challenge FOREIGN KEY (chall_id) REFERENCES challenges(id),
    CONSTRAINT constraint_team FOREIGN KEY (team_id) REFERENCES teams(id)
);
