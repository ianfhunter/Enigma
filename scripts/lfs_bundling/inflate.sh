#!/usr/bin/env bash
# inflate-lfs.sh
# Usage: inflate-lfs.sh <owner> <repo> <asset_filename>
# Example: inflate-lfs.sh ianfhunter Enigma lfs_files.zip

set -e

OWNER="$1"
REPO="$2"
ASSET_NAME="$3"
ZIP_TMP="./latest_lfs_asset.zip"

if [ -z "$OWNER" ] || [ -z "$REPO" ] || [ -z "$ASSET_NAME" ]; then
    echo "Usage: $0 <OWNER> <REPO> <ASSET_NAME>"
    exit 1
fi

# Query GitHub API for latest release info
API_URL="https://api.github.com/repos/${OWNER}/${REPO}/releases/latest"
echo "Fetching latest release metadata from $OWNER/$REPO..."
release_json=$(curl -s "$API_URL")

# Extract latest tag (optional if you want to print it)
TAG=$(echo "$release_json" | grep -oP '"tag_name": "\K(.*)(?=")' || true)
echo "Latest release: $TAG"

# Find the asset download URL for our named file
asset_url=$(echo "$release_json" \
    | grep -oP '"browser_download_url": "\K([^"]+)' \
    | grep "/${ASSET_NAME}$" \
    || true)

if [ -z "$asset_url" ]; then
    echo "Error: Asset '$ASSET_NAME' not found in latest release."
    exit 2
fi

echo "Downloading asset: $asset_url"
curl -L -o "$ZIP_TMP" "$asset_url"

# Unzip over the current paths
echo "Unzipping and overwriting in place..."
unzip -o "$ZIP_TMP" -d .

echo "Cleanup temp file"
rm -f "$ZIP_TMP"

echo "Done."
