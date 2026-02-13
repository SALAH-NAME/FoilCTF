#!/usr/bin/env bash
set -Eeu -o pipefail

LIST_LIMIT=50
read -p "Choose a limit for your query (defaults to $LIST_LIMIT): " -r
if [[ -n "$REPLY" ]]; then
	LIST_LIMIT=$REPLY
fi

LIST_OFFSET=0
read -p "Choose a limit for your query (defaults to $LIST_OFFSET): " -r
if [[ -n "$REPLY" ]]; then
	LIST_OFFSET=$REPLY
fi

curl 'http://localhost:3002/api/challenges' \
	-i -G \
	--data-urlencode "limit=$LIST_LIMIT" \
	--data-urlencode "offset=$LIST_OFFSET"
