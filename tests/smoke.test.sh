#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://127.0.0.1:3000}"
SESSION="smoke-$(head -c8 /dev/urandom | xxd -p)"

say() { echo "[smoke] $*"; }

echo "Using BASE_URL=$BASE_URL SESSION=$SESSION"

# 1) THINK
say "POST /api/think"
RESP_THINK=$(curl -sS -X POST "$BASE_URL/api/think" \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SESSION\",\"input\":\"hello world\"}")

CONF=$(printf '%s' "$RESP_THINK" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(j.thought && j.thought.confidence || 0)}catch(e){console.log('0')}})")

echo "confidence=$CONF"

# 2) REWARD
say "POST /api/reward/:sessionId"
RESP_REWARD=$(curl -sS -X POST "$BASE_URL/api/reward/$SESSION" -H 'Content-Type: application/json' -d '{"reward":0.7}')
DOPA=$(printf '%s' "$RESP_REWARD" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(j.neuromodulators && j.neuromodulators.dopamine || 0)}catch(e){console.log('0')}})")

echo "dopamine=$DOPA"

# 3) STATE
say "GET /api/state/:sessionId"
RESP_STATE=$(curl -sS "$BASE_URL/api/state/$SESSION")
CONSC=$(printf '%s' "$RESP_STATE" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(j.consciousness && j.consciousness.level || 0)}catch(e){console.log('0')}})")

echo "consciousness.level=$CONSC"

# Basic assertions (non-zero-ish)
awk -v c="$CONF" 'BEGIN{ if(c==0) { print "Confidence is zero"; exit 1 }}'
awk -v d="$DOPA" 'BEGIN{ if(d==0) { print "Dopamine not returned"; exit 1 }}'
awk -v l="$CONSC" 'BEGIN{ if(l==0) { print "Consciousness level missing"; exit 1 }}'

echo "OK"
