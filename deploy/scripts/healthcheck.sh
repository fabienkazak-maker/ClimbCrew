#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

BASE_URL="${PUBLIC_URL:-https://climbcrew.dip-tcs.com}"

echo "Test public : ${BASE_URL%/}/api/health"
curl -fsS "${BASE_URL%/}/api/health"
echo

echo "Test local backend : http://127.0.0.1:${BACKEND_BIND_PORT:-3000}/health"
curl -fsS "http://127.0.0.1:${BACKEND_BIND_PORT:-3000}/health"
echo
