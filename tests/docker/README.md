# Docker Image Tests

This directory contains tests for the published Docker image.

## Running the Docker Image Test

The `docker-image.test.sh` script pulls and tests the published Docker image to ensure it works correctly.

### Prerequisites

- Docker installed and running
- `curl` command available
- The Docker image must be published and accessible

### Usage

```bash
# Test the latest image
./tests/docker/docker-image.test.sh

# Test a specific tag
./tests/docker/docker-image.test.sh ianfhunter/enigma:1.0.1

# Test a dev build
./tests/docker/docker-image.test.sh ianfhunter/enigma:dev

# Use a custom port (default is 3001)
TEST_PORT=3002 ./tests/docker/docker-image.test.sh
```

### What It Tests

1. **Image Pull**: Verifies the image can be pulled from the registry
2. **Container Startup**: Ensures the container starts without errors
3. **Health Check**: Tests the `/api/health` endpoint responds correctly
4. **Frontend Serving**: Verifies the frontend is being served

### Test Output

The script provides colored output:
- ✅ Green: Successful operations
- ⚠️ Yellow: Warnings or informational messages
- ❌ Red: Failures

The script automatically cleans up (stops and removes containers and volumes) on exit.

### Integration with CI/CD

This test can be run as part of CI/CD to verify published images. Example:

```yaml
- name: Test Docker Image
  run: |
    ./tests/docker/docker-image.test.sh ianfhunter/enigma:${{ github.ref_name }}
```
