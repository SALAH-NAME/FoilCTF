#!/usr/bin/env bash
set -Eeu -o pipefail

read -p "Write attachment name (string): " -r ATTACHMENT_NAME
read -p "Write attachment contents (json): " -r ATTACHMENT_DATA
read -p "Select challenge (number): " -r CHALLENGE_ID
read -p "Confirm attachment creation (y/N)? " -n 1 -r CONFIRM_PROMPT_ANSWER
echo

if [[ $CONFIRM_PROMPT_ANSWER =~ ^[Yy]$ ]]; then
	echo 'Creating attachment linked to challenge' $CHALLENGE_ID
	curl 'http://localhost:3002/api/challenges/'"$CHALLENGE_ID"'/attachments' \
		-i \
		-X 'POST' \
		-H 'Content-Type: application/json' \
		-H 'Accept: application/json' \
		--data-binary '{ "name": "'"$ATTACHMENT_NAME"'", "contents": '"$ATTACHMENT_DATA"' }'
fi

