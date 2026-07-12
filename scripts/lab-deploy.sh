#!/usr/bin/env bash
# Build + (re)start the Meal Mate lab stack, stamping the version from version.json.
set -euo pipefail
cd "$(dirname "$0")/.."
export APP_VERSION=$(jq -r .version version.json)
export BUILD_NUMBER=$(jq -r .buildNumber version.json)
docker compose up -d --build "$@"
docker compose ps
