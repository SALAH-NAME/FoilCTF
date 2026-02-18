--- ctfs table
ALTER TABLE ctfs ADD COLUMN name TEXT NOT NULL DEFAULT 'New Event';
ALTER TABLE ctfs ADD COLUMN start_time TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE ctfs ADD COLUMN end_time TIMESTAMP NOT NULL DEFAULT (now() + interval '24 hours');
ALTER TABLE ctfs ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE ctfs ADD COLUMN max_teams INTEGER CHECK(max_teams > 0);
ALTER TABLE ctfs ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'ended'));

---participations table
ALTER TABLE participations RENAME COLUMN challenge_id TO ctf_id;
ALTER TABLE participations ADD COLUMN solves INTEGER NOT NULL DEFAULT 0;
ALTER TABLE participations ADD CONSTRAINT  unique_participation UNIQUE (team_id, ctf_id);

--- teams table
ALTER TABLE teams ADD COLUMN name TEXT NOT NULL;
ALTER TABLE teams ADD COLUMN team_size INTEGER NOT NULL DEFAULT 0;

--- ctf_challenges
ALTER TABLE ctfs_challenges 
ADD COLUMN reward_min INTEGER DEFAULT 100 NOT NULL,
ADD COLUMN decay INTEGER DEFAULT 50 NOT NULL,
ADD COLUMN reward_first_blood INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN reward_decrements BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN initial_reward INTEGER DEFAULT 500  NOT NULL,
ADD COLUMN released_at TIMESTAMP NULL,
ADD COLUMN requires_challenge_id INTEGER NULL,
ADD COLUMN is_hidden BOOLEAN DEFAULT false;

ALTER TABLE ctfs_challenges 
ADD CONSTRAINT constraint_decay_positive CHECK (decay > 0);

--- solves table
CREATE TABLE IF NOT EXISTS solves (
    id          SERIAL PRIMARY KEY,
    ctf_id      INTEGER NOT NULL,
    team_id     INTEGER NOT NULL,
    chall_id    INTEGER NOT NULL,
    score      INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,

    CONSTRAINT unique_team_solve UNIQUE(ctf_id, team_id, chall_id),
    CONSTRAINT fk_solves_ctf FOREIGN KEY (ctf_id) REFERENCES ctfs(id),
    CONSTRAINT fk_solves_challenge FOREIGN KEY (chall_id) REFERENCES challenges(id),
    CONSTRAINT fk_solves_team FOREIGN KEY (team_id) REFERENCES teams(id)
);

--- room table

CREATE TABLE IF NOT EXISTS chat_rooms (
    id          SERIAL PRIMARY KEY,
    ctf_id      INTEGER NOT NULL,
    team_id     INTEGER NULL,
    room_type   VARCHAR(20) DEFAULT 'team', -- 'global' 'team' 'admin'
    
    CONSTRAINT fk_chat_room_ctf FOREIGN KEY (ctf_id) REFERENCES ctfs(id),
    CONSTRAINT fk_chat_room_team FOREIGN KEY (team_id) REFERENCES teams(id)
);

---messages table
ALTER TABLE messages DROP  CONSTRAINT constraint_chatroom;
ALTER TABLE messages ADD CONSTRAINT  constraint_room Foreign Key (chatroom_id) REFERENCES chat_rooms(id);

--- challenges
ALTER Table challenges ADD COLUMN category TEXT NOT NULL;
-- ALTER table challenges DROP COLUMN reward;
-- ALTER table challenges DROP COLUMN reward_min;
-- ALTER table challenges DROP COLUMN reward_first_blood;
-- ALTER table challenges DROP COLUMN reward_decrements;
