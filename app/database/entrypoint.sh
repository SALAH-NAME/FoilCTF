#!/usr/bin/env bash
set -xe

PGDATA="$HOME/data"
PGLOGS="$HOME/logs"

if [[ ! -d "$PGDATA" ]]; then
	initdb "$PGDATA";
fi

pg_ctl -D "$PGDATA" -l "$PGLOGS" start

echo "Applying from migration '$(container-migrations-manage current)'"
container-migrations-manage apply

pg_ctl -D "$PGDATA" stop

exec postgres -D "$PGDATA"

