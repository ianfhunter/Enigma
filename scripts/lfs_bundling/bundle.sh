#!/bin/bash

# Bundle LFS files into a zip file that can be used to inflate the LFS files into the repo
# at deployment time.
#
# Usage:
#   ./bundle.sh
#
# This will create a zip file in the current working directory.
# It creates a temporary directory to hold the LFS files and removes before exiting.

TEMP_DIR="__lfs_bundle"
mkdir -p "$TEMP_DIR"

# Copy LFS files into that directory
git lfs ls-files -n | while IFS= read -r file; do
    mkdir -p "$TEMP_DIR/$(dirname "$file")"
    cp "$file" "$TEMP_DIR/$file"
done


zip -r lfs_files.zip "$TEMP_DIR"/*

rm -rf "$TEMP_DIR"

echo "LFS bundle created in $(pwd)/lfs_files.zip"
