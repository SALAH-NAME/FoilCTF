#!/usr/bin/env bash
# test_ratelimit.sh — simple smoke-test for the gateway rate limiter
#
# Usage:
#   ./test_ratelimit.sh [HOST] [BURST]
#
# Examples:
#   ./test_ratelimit.sh                        # defaults: https://localhost, burst=50
#   ./test_ratelimit.sh https://localhost 50
#   ./test_ratelimit.sh http://localhost:3443 10

set -euo pipefail

HOST="${1:-https://localhost}"
BURST="${2:-50}"          # must match RATE_LIMIT_BURST env (default 50)
EXTRA=$((BURST + 20))     # fire more than the burst to guarantee some 429s
ENDPOINT="${HOST}/health"  # use /health so the gateway responds even without backend

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
RST='\033[0m'

echo -e "${YLW}=== Rate Limit Smoke Test ===${RST}"
echo "Target  : ${ENDPOINT}"
echo "Burst   : ${BURST}"
echo "Requests: ${EXTRA} (burst + 20 extra)"
echo ""

ok=0
limited=0
other=0

for i in $(seq 1 "$EXTRA"); do
    # -k  = ignore self-signed cert
    # -s  = silent
    # -o /dev/null = discard body
    # -w  = print only the HTTP status code
    status=$(curl -k -s -o /dev/null -w "%{http_code}" "$ENDPOINT")

    case "$status" in
        200) ok=$((ok + 1)) ;;
        429) limited=$((limited + 1)) ;;
        *)   other=$((other + 1)) ; echo "  [req $i] unexpected status: $status" ;;
    esac
done

echo ""
echo -e "${GRN}200 OK         : ${ok}${RST}"
echo -e "${RED}429 Rate Limited: ${limited}${RST}"
[ "$other" -gt 0 ] && echo -e "${YLW}Other          : ${other}${RST}"
echo ""

if [ "$limited" -gt 0 ]; then
    echo -e "${GRN}PASS — rate limiter is working (got ${limited} rejections)${RST}"
else
    echo -e "${RED}FAIL — no requests were rate limited; check RATE_LIMIT_BURST and RATE_LIMIT_ENABLED${RST}"
    exit 1
fi

echo ""
echo -e "${YLW}--- Cooldown test (waiting 2 s for token refill) ---${RST}"
sleep 2

status=$(curl -k -s -o /dev/null -w "%{http_code}" "$ENDPOINT")
if [ "$status" = "200" ]; then
    echo -e "${GRN}PASS — request accepted after cooldown (tokens refilled)${RST}"
else
    echo -e "${RED}FAIL — still getting $status after cooldown${RST}"
    exit 1
fi
