CREATE TABLE IF NOT EXISTS profiles (
  id       SERIAL PRIMARY KEY,

  name     TEXT NOT NULL,
  image    TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id                  VARCHAR(64) PRIMARY KEY,
  password            VARCHAR(64) NOT NULL,

  created_at          TIMESTAMP DEFAULT now() NOT NULL,
  banned_until        TIMESTAMP DEFAULT NULL,

  profile_id          INTEGER DEFAULT NULL,
  CONSTRAINT profile  FOREIGN KEY (profile_id) REFERENCES profiles
);

CREATE TABLE IF NOT EXISTS sessions (
  id               SERIAL PRIMARY KEY,
  token            TEXT NOT NULL,
  expiry           TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ctfs (
  id                SERIAL PRIMARY KEY,

  team_members_min  INTEGER DEFAULT 1 NOT NULL,
  team_members_max  INTEGER NULL,

  metadata          JSON NULL,

  CONSTRAINT constraint_members_min_gt_zero  CHECK (team_members_min > 0),
  CONSTRAINT constraint_members_min_lteq_max CHECK (team_members_min <= team_members_max)
);
CREATE TABLE IF NOT EXISTS ctf_organizers (
  ctf_id        INTEGER NOT NULL,
  organizer_id  VARCHAR(64) NOT NULL,

  CONSTRAINT constraint_ctf FOREIGN KEY (ctf_id) REFERENCES ctfs,
  CONSTRAINT constraint_organizer FOREIGN KEY (organizer_id) REFERENCES users
);

CREATE TABLE IF NOT EXISTS teams (
  id              SERIAL PRIMARY KEY,

  profile_id      INTEGER,
  CONSTRAINT constraint_profile FOREIGN KEY (profile_id) REFERENCES profiles
);
CREATE TABLE IF NOT EXISTS team_members (
  team_id    INTEGER NOT NULL,
  member_id  VARCHAR(64) NOT NULL,
  PRIMARY KEY (team_id, member_id),

  CONSTRAINT constraint_team FOREIGN KEY (team_id) REFERENCES teams,
  CONSTRAINT constraint_member FOREIGN KEY (member_id) REFERENCES users
);

CREATE TABLE IF NOT EXISTS attachments (
  id        SERIAL PRIMARY KEY,
  contents  JSON NOT NULL
);

-- NOTE: Recipes of the challenges
CREATE TABLE IF NOT EXISTS challenges (
  id                  SERIAL PRIMARY KEY,
  is_published        BOOLEAN DEFAULT false NOT NULL,

  name                TEXT DEFAULT 'Unnamed challenge' NOT NULL,
  description         TEXT DEFAULT 'No description'    NOT NULL,

  reward              INTEGER DEFAULT 500  NOT NULL,
  reward_min          INTEGER DEFAULT 350  NOT NULL,
  reward_first_blood  INTEGER DEFAULT 0    NOT NULL,
  reward_decrements   BOOLEAN DEFAULT TRUE NOT NULL,

  author_id           VARCHAR(64) NOT NULL,
  created_at          TIMESTAMP DEFAULT now() NOT NULL,
  updated_at          TIMESTAMP DEFAULT now() NOT NULL,

  CONSTRAINT constraint_reward CHECK (reward >= reward_min),
  CONSTRAINT constraint_reward_min CHECK (reward_min >= 0),
  CONSTRAINT constraint_author FOREIGN KEY (author_id) REFERENCES users
);
CREATE TABLE IF NOT EXISTS challenges_attachments (
  challenge_id   INTEGER NOT NULL,
  attachment_id  INTEGER NOT NULL,
  PRIMARY KEY (challenge_id, attachment_id),

  name           TEXT NOT NULL,

  CONSTRAINT constraint_challenge
		FOREIGN KEY (challenge_id) REFERENCES challenges
		ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT constraint_attachment
		FOREIGN KEY (attachment_id) REFERENCES attachments
		ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS hints (
  id            SERIAL PRIMARY KEY,
  challenge_id  INTEGER NOT NULL,

  penalty       INTEGER DEFAULT 0 NOT NULL,
  contents      TEXT DEFAULT 'Empty hint' NOT NULL,

  CONSTRAINT constraint_challenge FOREIGN KEY (challenge_id) REFERENCES challenges
);

-- Participations (Instance of the Team in the Challenge)
CREATE TABLE IF NOT EXISTS participations (
  id               SERIAL PRIMARY KEY,
  score            INTEGER DEFAULT 0 NOT NULL,

  team_id          INTEGER NOT NULL,
  challenge_id     INTEGER NOT NULL,

  last_attempt_at  TIMESTAMP NULL,

  CONSTRAINT constraint_team FOREIGN KEY (team_id) REFERENCES teams,
  CONSTRAINT constraint_challenge FOREIGN KEY (challenge_id) REFERENCES challenges
);

-- CTF instantiation of the Challenges
CREATE TABLE IF NOT EXISTS ctfs_challenges (
  ctf_id            INTEGER NOT NULL,
  challenge_id      INTEGER NOT NULL,
  PRIMARY KEY (ctf_id, challenge_id),

  reward            INTEGER DEFAULT 500 NOT NULL,
  attempts          INTEGER DEFAULT 0 NOT NULL,
  solves            INTEGER DEFAULT 0 NOT NULL,

  first_blood_at    TIMESTAMP NULL,
  first_blood_id    INTEGER NULL,

  container_limits  JSON NULL,
  flag              JSON NOT NULL,

  CONSTRAINT constraint_ctf FOREIGN KEY (ctf_id) REFERENCES ctfs,
  CONSTRAINT constraint_challenge FOREIGN KEY (challenge_id) REFERENCES challenges,
  CONSTRAINT constraint_first_blood FOREIGN KEY (first_blood_id) REFERENCES participations
);

-- Containers (Actual instances of the Challenges)
CREATE TABLE IF NOT EXISTS containers (
  id                SERIAL PRIMARY KEY,
  participation_id  INTEGER NOT NULL,
  ctf_challenge_id  INTEGER NOT NULL,

  CONSTRAINT constraint_participation FOREIGN KEY (participation_id) REFERENCES participations,
  CONSTRAINT constraint_ctf_challenge FOREIGN KEY (ctf_challenge_id) REFERENCES ctfs_challenges
);

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,

  contents    JSON NOT NULL,
  created_at  TIMESTAMP DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS notification_users (
  notification_id  INTEGER NOT NULL,
  user_id          VARCHAR(64) NOT NULL,
  PRIMARY KEY (notification_id, user_id),

  read_at          TIMESTAMP NULL,

  CONSTRAINT constraint_user FOREIGN KEY (user_id) REFERENCES users,
  CONSTRAINT constraint_notification  FOREIGN KEY (notification_id) REFERENCES notifications
);

CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL,
  chatroom_id  INTEGER NOT NULL,
  PRIMARY KEY (id, chatroom_id),

  contents     TEXT NOT NULL,
  sent_at      TIMESTAMP DEFAULT now() NOT NULL,
  edited_at    TIMESTAMP DEFAULT NULL,
  deleted_at   TIMESTAMP DEFAULT NULL,

  writer_id    VARCHAR(64), -- NOTE: NULL means System message

  CONSTRAINT constraint_writer FOREIGN KEY (writer_id) REFERENCES users,
  CONSTRAINT constraint_chatroom FOREIGN KEY (chatroom_id) REFERENCES ctfs
);

-- NOTE: Bugs, Feature Requests
CREATE TABLE IF NOT EXISTS reports (
  id         SERIAL PRIMARY KEY,
  done       BOOLEAN DEFAULT FALSE NOT NULL,
  contents   TEXT NOT NULL,
  issued_at  TIMESTAMP DEFAULT now() NOT NULL,
  issuer_id  VARCHAR(64) DEFAULT NULL,

  CONSTRAINT constraint_issuer FOREIGN KEY (issuer_id) REFERENCES users
);

-- TODO: Files (Attachments, Containerfiles...)
