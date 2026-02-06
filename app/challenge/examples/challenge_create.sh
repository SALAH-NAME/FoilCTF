#!/usr/bin/env bash
set -Eeu -o pipefail

CHALLENGE_NAME="$(mktemp -u -p '/' -t 'XXXXXXXX' | sed 's/\///')"

read -p "Proceed with creating challenge \"$CHALLENGE_NAME\"? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
	curl 'http://localhost:3002/api/challenges' \
		-i \
		-X 'POST' \
		-H 'Content-Type: application/json' \
		-H 'Accept: application/json' \
		--data-binary '{ "name": '"\"$CHALLENGE_NAME\""', "author_id": "xenobas" }'
fi

