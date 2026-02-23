#!/usr/bin/env bash
set -Eeu -o pipefail


ADMIN_USER="${ADMIN_USERNAME:-admin}"
ADMIN_PASS="${ADMIN_PASSWORD:-admin}"

echo "Seeding admin user: $ADMIN_USER"

psql --dbname="$POSTGRES_DB" --username="$POSTGRES_USER" << EOF
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (username, password, role, created_at)
VALUES (
    '$ADMIN_USER', 
    crypt('$ADMIN_PASS', gen_salt('bf', 10)), 
    'admin', 
    now()
)
ON CONFLICT (username) DO UPDATE 
SET password = crypt('$ADMIN_PASS', gen_salt('bf', 10)),
    role = 'admin';

-- Ensure a profile exists for the admin if it doesn't already
INSERT INTO profiles (username)
VALUES ('$ADMIN_USER')
ON CONFLICT (username) DO NOTHING;
EOF

echo "Admin user $ADMIN_USER seeded successfully."
