# Version Management System

This project uses an automated version management system to ensure that game pack updates are properly detected by users and trigger cache invalidation.

## How It Works

### Version Numbers
- Each game pack has a `version` field in its `manifest.js` file (pack-level version)
- Each game has a `lastModified` field (game-level timestamp in milliseconds)
- Some games may have individual `version` fields
- All version fields are automatically updated to unix timestamps when changes are made
- This ensures that any modification to game packs will trigger updates for users

### Version Update Script

The `scripts/update-versions.js` script:
- Finds all `manifest.js` files in the `src/packs` directory
- Updates the pack `version` field with the current unix timestamp
- Updates individual game `lastModified` fields with the current unix timestamp (multiplied by 1000 for milliseconds)
- Updates individual game `version` fields (if they exist) with the current unix timestamp
- Logs which files were updated and what was changed

#### Usage
```bash
# Update all version numbers manually
node scripts/update-versions.js
```

### GitHub Actions

The `.github/workflows/pre-release.yml` workflow:
- Triggers on pushes to the main branch or manual dispatch
- Automatically updates version numbers
- Creates a pull request with version changes
- Builds the project and creates a pre-release

#### Workflow Features
- **Automatic Version Updates**: Updates all manifest files with unix timestamps
- **Pull Request Creation**: Creates a PR for version changes (if there are changes)
- **Pre-release Creation**: Creates GitHub pre-releases with build artifacts
- **Cache Invalidation**: Ensures users get updated content

## Benefits

1. **Cache Invalidation**: Unix timestamp versions ensure browsers cache invalidation
2. **User Updates**: Users automatically get notified of game pack updates
3. **Automated Process**: No manual version management required
4. **Traceability**: Each version corresponds to a specific point in time

## Manual Version Updates

While the system is designed to be automated, you can manually update versions by:

1. Running the update script: `node scripts/update-versions.js`
2. Committing the changes: `git add . && git commit -m "Update versions"`
3. Pushing to trigger the workflow: `git push`

## Testing Version Management

### Unit Tests

Run the version management unit tests to ensure all games have proper lastModified fields:

```bash
# Run the versioning tests
npm test tests/versioning.test.js

# Or run all tests
npm test
```

The tests check:
- All games have a `lastModified` field
- All `lastModified` fields have valid timestamp values
- No games are missing version information

### Manual Validation

Use the validation script to check lastModified fields:

```bash
# Check all games have lastModified fields
node scripts/check-lastmodified.js
```

## File Structure

```
scripts/
├── update-versions.js    # Version update script

.github/workflows/
├── pre-release.yml      # GitHub Actions workflow

src/packs/
├── [pack-name]/
│   └── manifest.js      # Contains version field
```

## Version Format

Versions use unix timestamps (e.g., `1769682640`) which represent:
- Seconds since January 1, 1970 UTC
- Always increasing with time
- Unique for each update
- Easy to convert back to readable dates if needed

## Troubleshooting

### Script Not Working
- Ensure Node.js is installed and available
- Check that the script has execute permissions
- Verify the `src/packs` directory exists

### GitHub Actions Not Triggering
- Check that the workflow file is in the correct location
- Ensure the repository has GitHub Actions enabled
- Verify the branch protection rules allow the workflow to run

### Version Not Updating
- Check that the manifest files have the correct format
- Ensure the version field follows the pattern: `version: '1.0.0'`
- Verify the script has read/write permissions to the files