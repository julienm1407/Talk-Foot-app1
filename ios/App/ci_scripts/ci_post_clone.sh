#!/bin/sh
# Xcode Cloud : npm + plugins Capacitor (node_modules n’est pas dans git).
set -e
cd "$CI_PRIMARY_REPOSITORY_PATH"

if ! command -v node >/dev/null 2>&1; then
  brew install node
fi

npm ci
npx cap sync ios
