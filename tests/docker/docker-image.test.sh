#!/bin/bash
# ==============================================================================
# Docker Image Test Script
# ==============================================================================
# Tests that the published Docker image works correctly
#
# Usage:
#   ./tests/docker/docker-image.test.sh [image-tag]
#
# Examples:
#   ./tests/docker/docker-image.test.sh latest
#   ./tests/docker/docker-image.test.sh 1.0.1
#   ./tests/docker/docker-image.test.sh ianfhunter/enigma:dev
# ==============================================================================

set -euo pipefail

# Configuration
IMAGE_TAG="${1:-ianfhunter/enigma:latest}"
CONTAINER_NAME="enigma-docker-test-$(date +%s)"
TEST_PORT="${TEST_PORT:-3001}"
HEALTH_CHECK_URL="http://localhost:${TEST_PORT}/api/health"
MAX_WAIT_TIME=30
WAIT_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
  docker volume rm "enigma-test-data-${CONTAINER_NAME}" 2>/dev/null || true
}

# Register cleanup function to run on exit
trap cleanup EXIT

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Docker Image Test${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Image: ${IMAGE_TAG}"
echo -e "Container: ${CONTAINER_NAME}"
echo -e "Port: ${TEST_PORT}"
echo ""

# Step 1: Pull the image
echo -e "${YELLOW}[1/4] Pulling Docker image...${NC}"
if docker pull "$IMAGE_TAG"; then
  echo -e "${GREEN}✓ Image pulled successfully${NC}"
else
  echo -e "${RED}✗ Failed to pull image${NC}"
  exit 1
fi

# Step 2: Start the container
echo -e "\n${YELLOW}[2/4] Starting container...${NC}"
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${TEST_PORT}:3000" \
  -v "enigma-test-data-${CONTAINER_NAME}:/app/data" \
  -e SESSION_SECRET="test-secret-$(openssl rand -hex 16)" \
  -e FRONTEND_URL="http://localhost:${TEST_PORT}" \
  -e NODE_ENV=production \
  "$IMAGE_TAG"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Container started${NC}"
else
  echo -e "${RED}✗ Failed to start container${NC}"
  exit 1
fi

# Step 3: Wait for health check
echo -e "\n${YELLOW}[3/4] Waiting for health check...${NC}"
elapsed=0
while [ $elapsed -lt $MAX_WAIT_TIME ]; do
  if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    break
  fi
  
  if [ $elapsed -eq 0 ]; then
    echo -n "Waiting for service to be ready"
  else
    echo -n "."
  fi
  
  sleep $WAIT_INTERVAL
  elapsed=$((elapsed + WAIT_INTERVAL))
done

if [ $elapsed -ge $MAX_WAIT_TIME ]; then
  echo -e "\n${RED}✗ Health check failed - service did not become ready in ${MAX_WAIT_TIME}s${NC}"
  echo -e "${YELLOW}Container logs:${NC}"
  docker logs "$CONTAINER_NAME"
  exit 1
fi

# Step 4: Verify health endpoint response
echo -e "\n${YELLOW}[4/4] Verifying health endpoint...${NC}"
response=$(curl -s "$HEALTH_CHECK_URL")
if echo "$response" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✓ Health endpoint returned correct response${NC}"
  echo -e "  Response: $response"
else
  echo -e "${RED}✗ Health endpoint returned unexpected response${NC}"
  echo -e "  Response: $response"
  exit 1
fi

# Test frontend is being served
echo -e "\n${YELLOW}Testing frontend serving...${NC}"
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${TEST_PORT}/")
if [ "$frontend_response" = "200" ]; then
  echo -e "${GREEN}✓ Frontend is being served (HTTP ${frontend_response})${NC}"
else
  echo -e "${YELLOW}⚠ Frontend returned HTTP ${frontend_response} (expected 200)${NC}"
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}All tests passed! ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Container: ${CONTAINER_NAME}"
echo -e "Test URL: ${HEALTH_CHECK_URL}"
echo -e "\nTo inspect the container, run:"
echo -e "  docker logs ${CONTAINER_NAME}"
echo -e "  docker exec -it ${CONTAINER_NAME} sh"
