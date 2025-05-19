#!/bin/sh
# wait-for-it.sh - Simple script to wait for a host:port to become available

set -e

# Parse host and port from first argument
if [ -z "$1" ]; then
  echo "Error: You must provide a host:port to test."
  echo "Usage: $0 host:port [command to run]"
  exit 1
fi

# Split host:port into separate variables
IFS=: read -r HOST PORT <<EOF
$1
EOF

if [ -z "$PORT" ]; then
  echo "Error: Port not specified. Format should be host:port"
  echo "Usage: $0 host:port [command to run]"
  exit 1
fi

# Shift to remove the host:port argument
shift

# Log what we're waiting for
echo "Waiting for $HOST:$PORT to become available..."

# Try to connect to the host:port until it succeeds
until nc -z -v -w5 "$HOST" "$PORT" 2>/dev/null; do
  echo "Still waiting for $HOST:$PORT... (will retry in 1 second)"
  sleep 1
done

echo "$HOST:$PORT is ready!"

# If a command was provided, execute it
if [ $# -gt 0 ]; then
  echo "Executing command: $@"
  exec "$@"
else
  echo "No command provided, exiting."
fi
