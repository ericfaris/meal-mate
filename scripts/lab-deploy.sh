#!/usr/bin/env bash
# Build + (re)start the Meal Mate lab stack. Pushing to main already does this
# via sentinel (test.yml); use this for a manual redeploy. Both images read
# version.json themselves; APP_VERSION here only sets the image label.
set -euo pipefail
cd "$(dirname "$0")/.."
export APP_VERSION=$(jq -r .version version.json)
docker compose up -d --build "$@"
docker compose ps
