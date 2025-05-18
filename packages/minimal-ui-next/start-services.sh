#!/bin/bash

# Start services script for the Minimal UI Next project
# This script starts both the API server and the Next.js frontend

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define paths
PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
DATA_DIR="$PROJECT_ROOT/../../data"

# Print header
echo -e "${GREEN}=== Starting Minimal UI Next services ===${NC}"
echo -e "${YELLOW}Project root:${NC} $PROJECT_ROOT"
echo -e "${YELLOW}Data directory:${NC} $DATA_DIR"

# Create data directory if it doesn't exist
if [ ! -d "$DATA_DIR" ]; then
  echo -e "${YELLOW}Creating data directory...${NC}"
  mkdir -p "$DATA_DIR"
fi

# Create local preferences directory if it doesn't exist
LOCAL_PREFS_DIR="$PROJECT_ROOT/data/user-preferences"
if [ ! -d "$LOCAL_PREFS_DIR" ]; then
  echo -e "${YELLOW}Creating local preferences directory...${NC}"
  mkdir -p "$LOCAL_PREFS_DIR"
  
  # Check if there's a preferences file to copy from root data dir
  ROOT_PREFS_FILE="$DATA_DIR/user-preferences/preferences.json"
  if [ -f "$ROOT_PREFS_FILE" ]; then
    echo -e "${YELLOW}Copying preferences from root data directory...${NC}"
    cp "$ROOT_PREFS_FILE" "$LOCAL_PREFS_DIR/preferences.json"
  fi
fi

# Function to check if a port is in use
check_port() {
  lsof -i:$1 > /dev/null 2>&1
  return $?
}

# Start the Express API server
start_api() {
  echo -e "\n${GREEN}=== Starting Express API server on port 3001 ===${NC}"
  if check_port 3001; then
    echo -e "${RED}Port 3001 is already in use. Please stop any other service using this port.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Directory:${NC} $(pwd)"
  
  # Start the Express server
  echo -e "${YELLOW}Starting Express API server...${NC}"
  ACTUAL_DATA_DIR="$DATA_DIR" PORT=3001 yarn start:api &
  API_PID=$!
  echo -e "${GREEN}Express API server started with PID:${NC} $API_PID"
}

# Start the Next.js app
start_nextjs() {
  echo -e "\n${GREEN}=== Starting Next.js on port 3000 ===${NC}"
  if check_port 3000; then
    echo -e "${RED}Port 3000 is already in use. Please stop any other service using this port.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Directory:${NC} $(pwd)"
  
  # Start the Next.js app
  echo -e "${YELLOW}Starting Next.js app with proper API URL configuration...${NC}"
  export NEXT_PUBLIC_API_URL=http://localhost:3001
  echo -e "${YELLOW}NEXT_PUBLIC_API_URL set to:${NC} $NEXT_PUBLIC_API_URL"
  PORT=3000 NODE_OPTIONS="--max-old-space-size=4096" yarn dev &
  NEXTJS_PID=$!
  echo -e "${GREEN}Next.js app started with PID:${NC} $NEXTJS_PID"
}

# Handle cleanup on exit
cleanup() {
  echo -e "\n${RED}Stopping services...${NC}"
  if [ ! -z "$API_PID" ]; then
    echo -e "${YELLOW}Stopping Express API server (PID: $API_PID)${NC}"
    kill $API_PID
  fi
  if [ ! -z "$NEXTJS_PID" ]; then
    echo -e "${YELLOW}Stopping Next.js app (PID: $NEXTJS_PID)${NC}"
    kill $NEXTJS_PID
  fi
  echo -e "${GREEN}Cleanup complete.${NC}"
  exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Start services
start_api
start_nextjs

# Wait for user to press Ctrl+C
echo -e "\n${GREEN}=== Services are running ===${NC}"
echo -e "${YELLOW}Express API server:${NC} http://localhost:3001"
echo -e "${YELLOW}Next.js app:${NC} http://localhost:3000"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "\n${GREEN}=== Quick debug links ===${NC}"
echo -e "${YELLOW}Force default workspace:${NC} http://localhost:3000/?forceDefault=true"
echo -e "${YELLOW}Force logout:${NC} http://localhost:3000/?forceLogout=true"

# Wait indefinitely
wait 