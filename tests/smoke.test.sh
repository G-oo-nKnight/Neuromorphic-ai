#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://127.0.0.1:3000}"

think(){
  curl -sS -X POST "$BASE_URL/api/think" \
    -H 'content-type: application/json' \
    -d '{"sessionId":"smoke1","input":"Test neuromorphic activity with happy tone"}'
}

reward(){
  curl -sS -X POST "$BASE_URL/api/reward/smoke1" \
    -H 'content-type: application/json' \
    -d '{"reward":0.4}'
}

state(){
  curl -sS "$BASE_URL/api/state/smoke1"
}

jq --version >/dev/null 2>&1 || { echo "jq is required"; exit 1; }

resp=$(think)
conf=$(echo "$resp" | jq -r '.thought.confidence // empty')
[ -n "$conf" ] || { echo "No confidence returned"; exit 2; }

echo "Confidence: $conf"

# Apply reward and ensure neuromodulators are returned
rew=$(reward)
dopa=$(echo "$rew" | jq -r '.neuromodulators.dopamine // empty')
[ -n "$dopa" ] || { echo "No neuromodulators returned"; exit 3; }

echo "Dopamine after reward: $dopa"

# Fetch state
st=$(state)
cz=$(echo "$st" | jq -r '.consciousness.level // empty')
[ -n "$cz" ] || { echo "No consciousness level"; exit 4; }

echo "Consciousness level: $cz"
