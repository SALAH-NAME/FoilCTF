#!/usr/bin/env bash
set -Eeu -o pipefail

declare CHALLENGE_NAME="$(mktemp -u -p '/' -t 'XXXXXXXX' | sed 's/\///')"

read -p "Write an author identifier: " -r CHALLENGE_AUTHOR
read -p "Proceed with creating challenge \"$CHALLENGE_NAME\"? " -n 1 -r CHALLENGE_PROMPT
echo

if [[ $CHALLENGE_PROMPT =~ ^[Yy]$ ]]; then
	echo 'Creating challenge' $CHALLENGE_NAME 'by the author' $CHALLENGE_AUTHOR
	curl 'http://localhost:3002/api/challenges' \
		-i \
		-X 'POST' \
		-H 'Content-Type: application/json' \
		-H 'Accept: application/json' \
		--data-binary '{ "name": "'"$CHALLENGE_NAME"'", "author_id": '"$CHALLENGE_AUTHOR"' }'
fi

