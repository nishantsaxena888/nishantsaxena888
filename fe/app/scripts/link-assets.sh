#!/usr/bin/env bash
# Dev-only: symlink a source repo's public asset dirs into fe/app/public so
# imported markdown image paths (/linux/..., /chapters/...) resolve.
# Usage: fe/app/scripts/link-assets.sh /path/to/Uday_AWS/aws-lambda-masterclass/public
set -euo pipefail
SRC="${1:?usage: link-assets.sh <source-public-dir>}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public"
for d in "$SRC"/*/; do
  name="$(basename "$d")"
  [ -e "$DEST/$name" ] || ln -s "$d" "$DEST/$name"
done
echo "linked asset dirs from $SRC -> $DEST"
