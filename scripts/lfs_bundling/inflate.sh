#!/usr/bin/env bash
# inflate-lfs-all.sh
# Usage: inflate-lfs-all.sh <owner> <repo> <asset_filename>

set -e

OWNER="$1"
REPO="$2"
ASSET_NAME="$3"
ZIP_TMP="./latest_lfs_asset.zip"

if [ -z "$OWNER" ] || [ -z "$REPO" ] || [ -z "$ASSET_NAME" ]; then
    echo "Usage: $0 <OWNER> <REPO> <ASSET_NAME>"
    exit 1
fi

PAGE=1
asset_url=""
while :; do
    echo "Fetching release metadata page $PAGE..."
    releases_json=$(curl -s "https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=100&page=${PAGE}")

    # Check if empty
    if [ "$(echo "$releases_json" | jq length)" -eq 0 ]; then
        break
    fi

    # Search for asset in this page
    asset_url=$(echo "$releases_json" | jq -r ".[] | .assets[]? | select(.name==\"$ASSET_NAME\") | .browser_download_url")
    
    if [ -n "$asset_url" ]; then
        TAG=$(echo "$releases_json" | jq -r ".[] | select(.assets[]?.name==\"$ASSET_NAME\") | .tag_name")
        echo "Found asset in release: $TAG"
        break
    fi

    PAGE=$((PAGE + 1))
done

if [ -z "$asset_url" ]; then
    echo "Error: Asset '$ASSET_NAME' not found in any release."
    exit 2
fi

echo "Downloading asset: $asset_url"
curl -L -o "$ZIP_TMP" "$asset_url"

echo "Unzipping and overwriting in place..."
unzip -o "$ZIP_TMP" -d __lfs_bundle
# overwrites the existing LFS files, preserves non-LFS files
rsync -a __lfs_bundle/ ./ 
rm -rf __lfs_bundle


echo "Cleanup temp file"
rm -f "$ZIP_TMP"

echo "Done."
