
ALTER TABLE sessions RENAME COLUMN token TO refreshToken;

ALTER TABLE sessions
	ADD COLUMN accessToken	TEXT NOT NULL,
	ADD COLUMN user_id	VARCHAR(64) NOT NULL,
	ADD COLUMN created_at	TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE sessions
	ADD CONSTRAINT fk_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE; -- delete session on user delete !!
