#!/bin/sh
# Xcode Cloud : npm + plugins Capacitor, puis Package.resolved (résolution SPM auto désactivée).
set -e
cd "$CI_PRIMARY_REPOSITORY_PATH"

if ! command -v node >/dev/null 2>&1; then
  brew install node
fi

npm ci
npx cap sync ios

# cap sync sous Windows peut laisser des backslashes dans CapApp-SPM/Package.swift
PKG="ios/App/CapApp-SPM/Package.swift"
if [ -f "$PKG" ]; then
  perl -pi -e 's{\.\.\\\.\.\\\.\.\\node_modules\\}{../../../node_modules/}g' "$PKG"
fi

APP_DIR="$CI_PRIMARY_REPOSITORY_PATH/ios/App"
RESOLVED_DIR="$APP_DIR/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm"
mkdir -p "$RESOLVED_DIR"

# Graphe SPM complet (AdMob, UMP, RevenueCat, …) — requis par -disableAutomaticPackageResolution
(cd "$APP_DIR/CapApp-SPM" && swift package resolve)
if [ -f "$APP_DIR/CapApp-SPM/Package.resolved" ]; then
  cp "$APP_DIR/CapApp-SPM/Package.resolved" "$RESOLVED_DIR/Package.resolved"
fi

xcodebuild -resolvePackageDependencies \
  -project "$APP_DIR/App.xcodeproj" \
  -scheme App
