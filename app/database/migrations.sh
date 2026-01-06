#!/usr/bin/env bash

function command_internal_list {
	MIGRATIONS_DIR="$HOME/migrations"
	find "$MIGRATIONS_DIR" -type f -regex '.*\.sql' | sort
}

MIGRATION_LAST="$HOME/.migration"
MIGRATION_LAST_NUM=$(cat "$MIGRATION_LAST" 2>/dev/null || echo "-1")

function command_internal_apply {
	for MIGRATION_PATH in $(command_internal_list); do
		MIGRATION=$(basename "$MIGRATION_PATH")
		MIGRATION_NUM=$(echo "$MIGRATION" | cut -c '-3')
		MIGRATION_TITLE=$(echo "$MIGRATION" | cut -c '5-')
		if [[ "$MIGRATION_NUM" -gt "$MIGRATION_LAST_NUM" ]]; then
			psql --file="$MIGRATION_PATH" 1>/dev/null
			if [[ $? -eq 0 ]]; then
				echo "Migration" "'$MIGRATION_TITLE'" "has been applied successfully"
				echo "$MIGRATION_NUM" > "$MIGRATION_LAST"
			fi
		fi
	done
}

function command_internal_current {
	if [[ "$MIGRATION_LAST_NUM" == "-1" ]]; then
		echo "-1" | tee "$MIGRATION_LAST"
		return
	fi

	MIGRATION_LAST_TITLE=$(command_internal_list | xargs basename -a | grep "^$MIGRATION_LAST_NUM" | cut -c '5-')
	echo "$MIGRATION_LAST_TITLE"
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
