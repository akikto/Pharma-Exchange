#!/usr/bin/env bash
# Build a signed release Android App Bundle (.aab) for Google Play.
# Prerequisites: JDK 17+, Android SDK (ANDROID_HOME), keystore.properties + release.keystore
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f keystore.properties ]]; then
  echo "Missing twa/keystore.properties — copy from keystore.properties.example and fill in signing values." >&2
  exit 1
fi

if [[ ! -f release.keystore ]]; then
  echo "Missing twa/release.keystore — create an upload keystore before release builds." >&2
  exit 1
fi

bash "$ROOT/scripts/prepare-android-resources.sh"

cd "$ROOT/android"

if [[ -x ./gradlew ]]; then
  ./gradlew bundleRelease
else
  gradle bundleRelease
fi

echo ""
echo "Release AAB output:"
echo "  android/app/build/outputs/bundle/release/app-release.aab"
