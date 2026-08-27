#!/usr/bin/env bash
# Copy PWA launcher icons from the frontend public assets into the Android mipmap folders.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
ICON_SRC="$REPO_ROOT/frontend/public/icons/icon-192.png"
ICON_MASKABLE="$REPO_ROOT/frontend/public/icons/icon-maskable-512.png"
RES="$ROOT/android/app/src/main/res"

if [[ ! -f "$ICON_SRC" ]]; then
  echo "Missing icon source: $ICON_SRC" >&2
  exit 1
fi

for dir in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  mkdir -p "$RES/$dir"
  cp "$ICON_SRC" "$RES/$dir/ic_launcher.png"
  cp "$ICON_SRC" "$RES/$dir/ic_launcher_round.png"
done

if [[ -f "$ICON_MASKABLE" ]]; then
  mkdir -p "$RES/mipmap-xxxhdpi"
  cp "$ICON_MASKABLE" "$RES/mipmap-xxxhdpi/ic_launcher_foreground.png" || true
fi

echo "Android launcher icons prepared from frontend/public/icons"
