#!/usr/bin/env bash
set -xe

PGDATA="$HOME/${FOILCTF_DATABASE_DATA_DIR:-data}"
PGLOGS="$HOME/${FOILCTF_DATABASE_LOGS_FILE:-db.logs}"

if [[ ! -d "$PGDATA" ]]; then
	initdb "$PGDATA";

	pg_ctl -D "$PGDATA" -l "$PGLOGS" start
	psql --command="CREATE DATABASE ${FOILCTF_DATABASE_NAME:-foilctf}";
else
	pg_ctl -D "$PGDATA" -l "$PGLOGS" start
fi


echo "Applying all migrations starting from '$(container-migrations-manage current)'"
container-migrations-manage apply

pg_ctl -D "$PGDATA" stop

exec postgres -D "$PGDATA"

