#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${SETUP_TOKEN:?SETUP_TOKEN manquant}"
BASE_URL="${PUBLIC_URL:-https://climbcrew.dip-tcs.com}"

curl -fsS \
  -H "X-Setup-Token: ${SETUP_TOKEN}" \
  "${BASE_URL%/}/api/setup-db"

echo
