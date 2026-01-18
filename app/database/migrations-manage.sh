#!/usr/bin/env bash
set -Eeu -o pipefail

DATABASE_MIGRATIONS_MOUNT="${DATABASE_MIGRATIONS_MOUNT:-/migrations}"
function command_internal_list {
	find "$DATABASE_MIGRATIONS_MOUNT" -type f -regex '.*\.sql' | sort
}

DATABASE_NAME="${DATABASE_NAME:-foilctf}"
DATABASE_MIGRATIONS_FILE="${DATABASE_MIGRATIONS_FILE:-$PGDATA/foilctf.migration.id}"
function command_internal_apply {
	ID_LAST=$(cat "$DATABASE_MIGRATIONS_FILE" 2>/dev/null || echo "-1")
	for FILE in $(command_internal_list); do
		SLUG=$(basename "$FILE")

		ID=$(echo "$SLUG" | cut -c '-3')
		TITLE=$(echo "$SLUG" | cut -c '5-')
		if [[ "$ID" -gt "$ID_LAST" ]]; then
			psql --dbname="$POSTGRES_DB" --username="$POSTGRES_USER" --file="$FILE" # 1>/dev/null # to see migration logs
			if [[ $? -eq 0 ]]; then
				echo "Migration" "'$TITLE'" "has been applied successfully"
				echo "$ID" > "$DATABASE_MIGRATIONS_FILE"
			else
				echo "Migration '$TITLE' FAILED!" >&2
				exit 1
			fi
		fi
	done
}

function command_internal_current {
	ID_LAST=$(cat "$DATABASE_MIGRATIONS_FILE" 2>/dev/null || echo "-1")
	if [[ "$ID_LAST" == "-1" ]]; then
		echo "-1" > "$DATABASE_MIGRATIONS_FILE"
		echo "-404" "Not Found"
		return
	fi

	TITLE_LAST=$(command_internal_list | xargs basename -a | grep "^$ID_LAST" | cut -c '5-')
	echo "$ID_LAST" "$TITLE_LAST"
}

if [[ "$1" == "current" ]]; then
	command_internal_current
	exit
fi

if [[ "$1" == "apply" ]]; then
	command_internal_apply
	exit
fi

if [[ "$1" == "list" ]]; then
	command_internal_list
	exit
fi

exit 1
